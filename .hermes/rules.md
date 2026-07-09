# 阿里云 API 限流应对规则

## 限流诊断标准

遇到以下错误码时，按照推荐策略处理：

| 错误码 | 触发维度 | 特征 | 推荐策略 |
|--------|---------|------|---------|
| `Throttling.RateQuota` | RPM/RPS 超限 | 间歇性报错，启动时集中报错 | 指数退避重试 + 请求速率限制 |
| `Throttling.AllocationQuota` | TPM/TPS 超限 | 长文本时 429 | 流量整形策略 |
| `Throttling.BurstRate` | 流量增速超限 | 突发请求触发 | 服务端排队等待（首选） |

## 核心原则

1. **优先使用平台能力**：服务端排队等待（`X-DashScope-Wait-Timeout: 30`）
2. **渐进式策略**：基础重试 → 速率限制 → 流量整形 → 拥塞控制
3. **避免突发**：冷启动时逐步提升并发，不要瞬间拉满

## 推荐实现（按场景）

### 场景 1：基础调用（个人测试/低并发）

```python
from tenacity import retry, wait_random_exponential, stop_after_attempt, retry_if_exception_type
import openai

@retry(
    wait=wait_random_exponential(min=1, max=60),
    stop=stop_after_attempt(5),
    retry=retry_if_exception_type((
        openai.RateLimitError,
        openai.InternalServerError
    ))
)
def chat_with_retry(client, model, messages, max_tokens=1024):
    return client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=messages,
        extra_headers={
            "X-DashScope-Wait-Timeout": "30"  # 服务端排队等待 30 秒
        }
    )
```

### 场景 2：在线服务（Chatbot/实时交互）

```python
import asyncio
import time
import openai
from openai import AsyncOpenAI
from tenacity import retry, wait_random_exponential, stop_after_attempt, retry_if_exception_type

class TokenBucket:
    """令牌桶：控制每分钟请求数 (RPM)"""
    def __init__(self, quota_per_minute: float, initial_tokens: float = 0.0):
        self.capacity = quota_per_minute
        self.tokens = initial_tokens
        self.refill_rate = quota_per_minute / 60.0
        self.last_refill = time.monotonic()

    def reserve(self, cost: float = 1.0) -> float:
        """申请令牌，返回需要等待的秒数"""
        self._refill()
        if self.tokens >= cost:
            self.tokens -= cost
            return 0.0
        # 令牌不足：预支未来额度
        deficit = cost - self.tokens
        wait_seconds = deficit / self.refill_rate
        self.tokens -= cost
        return wait_seconds

    def _refill(self):
        now = time.monotonic()
        elapsed = now - self.last_refill
        if elapsed > 0:
            self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
            self.last_refill = now

class RateLimitedClient:
    """带速率限制和并发控制的客户端"""
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1",
        rpm_limit: float = 600.0,
        max_concurrency: int = 20
    ):
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.rpm_bucket = TokenBucket(
            quota_per_minute=rpm_limit,
            initial_tokens=rpm_limit  # 满桶启动
        )
        self.semaphore = asyncio.Semaphore(max_concurrency)

    async def _execute_request(self, model, messages, max_tokens):
        # 1. RPM 检查（先拿令牌）
        wait_seconds = self.rpm_bucket.reserve(1.0)
        if wait_seconds > 0:
            await asyncio.sleep(wait_seconds)
        
        # 2. 并发检查（再拿信号量）
        async with self.semaphore:
            # 3. 发起请求（带服务端排队等待）
            return await self.client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                extra_headers={
                    "X-DashScope-Wait-Timeout": "30"
                }
            )

    @retry(
        wait=wait_random_exponential(min=1, max=60),
        stop=stop_after_attempt(5),
        retry=retry_if_exception_type((
            openai.RateLimitError,
            openai.InternalServerError
        ))
    )
    async def chat_with_limit(self, model, messages, max_tokens=1024):
        """带重试的限流请求"""
        return await self._execute_request(model, messages, max_tokens)
```

### 场景 3：高吞吐场景（RAG/批量处理）

使用流量整形策略，同时控制 RPM 和 TPM：

```python
class TrafficShapingClient:
    def __init__(self, rpm_limit=600, tpm_limit=1_000_000):
        self.rpm_bucket = TokenBucket(quota_per_minute=rpm_limit)
        self.tpm_bucket = TokenBucket(quota_per_minute=tpm_limit)
        self.semaphore = asyncio.Semaphore(20)
        
    async def chat_with_shaping(self, model, messages, max_tokens=1024):
        # 预估输入 token（粗略估算：1 字符 ≈ 1.5 token）
        input_chars = sum(len(m.get("content", "")) for m in messages)
        estimated_input_tokens = int(input_chars * 1.5)
        
        # 1. 双重准入（RPM + TPM）
        wait_rpm = self.rpm_bucket.reserve(1.0)
        wait_tpm = self.tpm_bucket.reserve(estimated_input_tokens)
        admission_wait = max(wait_rpm, wait_tpm)
        
        if admission_wait > 0:
            await asyncio.sleep(admission_wait)
        
        # 2. 并发控制
        async with self.semaphore:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                extra_headers={
                    "X-DashScope-Wait-Timeout": "30"
                }
            )
            
            # 3. 输出 token 结算
            actual_output_tokens = response.usage.completion_tokens
            adjustment = estimated_input_tokens - actual_output_tokens
            self.tpm_bucket.adjust(adjustment)
            
            return response
```

## 最佳实践

1. **服务端排队等待**：始终在请求头添加 `X-DashScope-Wait-Timeout: 30`
2. **指数退避**：重试时使用 `wait_random_exponential(min=1, max=60)` 避免惊群效应
3. **冷启动控制**：令牌桶初始化时使用 `initial_tokens=0` 或低值，逐步提升
4. **超时配置**：
   - 非流式：`timeout = 原超时 + Wait-Timeout`（如 120s + 30s = 150s）
   - 流式：`timeout > Wait-Timeout`（如 30s）

## 架构级方案

当客户端流控仍不足时：

### 模型降级（Fallback）

```python
async def chat_with_fallback(model, messages, max_tokens=1024):
    """主模型失败时降级到备选模型"""
    fallback_models = [model, "qwen-plus", "qwen-turbo"]
    
    for fallback_model in fallback_models:
        try:
            return await client.chat.completions.create(
                model=fallback_model,
                messages=messages,
                max_tokens=max_tokens
            )
        except openai.RateLimitError:
            continue
    raise Exception("所有模型均触发限流")
```

### 批量异步处理

对于无实时性要求的任务，使用 Batch API：

```python
# 提交批量任务
batch = client.batches.create(
    input_file_id="file-xxx",
    endpoint="/v1/chat/completions",
    completion_window="24h"
)

# 轮询结果
while batch.status != "completed":
    await asyncio.sleep(60)
    batch = client.batches.retrieve(batch.id)
```

## 监控建议

1. **跟踪错误率**：监控 429 错误频率
2. **配额用量**：通过百炼控制台查看 RPM/TPM 实际用量
3. **日志记录**：记录每次限流触发的错误类型和重试次数

## 参考文档

- 完整文档：`/home/unionportal/7.8 阿里云coding plan限流应对.md`
- 阿里云官方文档：https://help.aliyun.com/zh/model-studio/rate-limiting-best-practices
