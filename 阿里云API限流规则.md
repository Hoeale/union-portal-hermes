# 阿里云百炼 API 限流应对规则

## 核心原则

1. **优先使用服务端排队等待**：在请求头添加 `X-DashScope-Wait-Timeout: 30`
2. **指数退避重试**：使用 `wait_random_exponential(min=1, max=60)` 避免惊群效应
3. **冷启动控制**：令牌桶初始化使用 `initial_tokens=0`，逐步提升并发
4. **超时调整**：`timeout = 原超时 + Wait-Timeout`（如 150s）

## 限流诊断

| 错误码 | 触发原因 | 应对策略 |
|--------|---------|---------|
| `Throttling.RateQuota` | RPM/RPS 超限 | 指数退避 + 令牌桶限速 |
| `Throttling.AllocationQuota` | TPM/TPS 超限 | 流量整形（双重令牌桶） |
| `Throttling.BurstRate` | 流量增速过快 | 服务端排队等待（首选） |

## 推荐实现

### 场景 1：基础调用（低并发）

```python
from tenacity import retry, wait_random_exponential, stop_after_attempt, retry_if_exception_type

@retry(
    wait=wait_random_exponential(min=1, max=60),
    stop=stop_after_attempt(5),
    retry=retry_if_exception_type((openai.RateLimitError, openai.InternalServerError))
)
def chat_with_retry(client, model, messages, max_tokens=1024):
    return client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=messages,
        extra_headers={"X-DashScope-Wait-Timeout": "30"}
    )
```

### 场景 2：在线服务（Chatbot）

```python
class TokenBucket:
    """令牌桶：控制 RPM"""
    def __init__(self, quota_per_minute: float, initial_tokens: float = 0.0):
        self.capacity = quota_per_minute
        self.tokens = initial_tokens
        self.refill_rate = quota_per_minute / 60.0
        self.last_refill = time.monotonic()

    def reserve(self, cost: float = 1.0) -> float:
        self._refill()
        if self.tokens >= cost:
            self.tokens -= cost
            return 0.0
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
    def __init__(self, rpm_limit=600.0, max_concurrency=20):
        self.rpm_bucket = TokenBucket(quota_per_minute=rpm_limit, initial_tokens=rpm_limit)
        self.semaphore = asyncio.Semaphore(max_concurrency)

    async def chat_with_limit(self, model, messages, max_tokens=1024):
        # 1. RPM 检查
        wait_seconds = self.rpm_bucket.reserve(1.0)
        if wait_seconds > 0:
            await asyncio.sleep(wait_seconds)
        
        # 2. 并发控制 + 请求
        async with self.semaphore:
            return await self.client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                extra_headers={"X-DashScope-Wait-Timeout": "30"}
            )
```

### 场景 3：高吞吐（RAG/批量）

```python
class TrafficShapingClient:
    """双重令牌桶：同时控制 RPM 和 TPM"""
    def __init__(self, rpm_limit=600, tpm_limit=1_000_000):
        self.rpm_bucket = TokenBucket(quota_per_minute=rpm_limit)
        self.tpm_bucket = TokenBucket(quota_per_minute=tpm_limit)
        self.semaphore = asyncio.Semaphore(20)
        
    async def chat_with_shaping(self, model, messages, max_tokens=1024):
        # 预估输入 token（1 字符 ≈ 1.5 token）
        estimated_input_tokens = int(sum(len(m["content"]) for m in messages) * 1.5)
        
        # 双重准入
        wait_rpm = self.rpm_bucket.reserve(1.0)
        wait_tpm = self.tpm_bucket.reserve(estimated_input_tokens)
        admission_wait = max(wait_rpm, wait_tpm)
        if admission_wait > 0:
            await asyncio.sleep(admission_wait)
        
        # 并发控制
        async with self.semaphore:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                extra_headers={"X-DashScope-Wait-Timeout": "30"}
            )
            
            # 输出 token 结算
            adjustment = estimated_input_tokens - response.usage.completion_tokens
            self.tpm_bucket.adjust(adjustment)
            return response
## 架构级方案

### 模型降级（推荐）

当主模型触发 429 限流时，自动切换到备用模型：

```python
async def chat_with_fallback(model, messages, max_tokens=1024):
    """
    模型降级链：
    1. qwen3.7-plus（主模型，功能最全）
    2. qwen3.6-plus（备用，功能相近）
    3. kimi-k2.5（第三方备用，避免千问配额耗尽）
    """
    fallback_models = ["qwen3.7-plus", "qwen3.6-plus", "kimi-k2.5"]
    
    for fallback_model in fallback_models:
        try:
            return await client.chat.completions.create(
                model=fallback_model,
                messages=messages,
                max_tokens=max_tokens,
                extra_headers={"X-DashScope-Wait-Timeout": "30"}
            )
        except openai.RateLimitError:
            continue
    raise Exception("所有模型均触发限流")
```

**降级原则**：
- 优先同品牌降级（千问系列独立限流）
- 跨品牌降级（切换到 kimi-k2.5）
- 每个模型有独立的 RPM/TPM 配额

### 可用模型列表

**千问系列**（推荐）：
- `qwen3.7-plus` - 文本生成、推理模型、视觉理解（主模型）
- `qwen3.6-plus` - 文本生成、推理模型、视觉理解（备用）
- `qwen3.5-plus` - 文本生成、推理模型、视觉理解
- `qwen3-max-2026-01-23` - 文本生成、推理模型
- `qwen3-coder-next` - 文本生成（编程专用）
- `qwen3-coder-plus` - 文本生成（编程专用）

**第三方模型**：
- `kimi-k2.5`（月之暗面）- 文本生成、推理模型、视觉理解
- `glm-5`（智谱 AI）- 文本生成、推理模型
- `glm-4.7`（智谱 AI）- 文本生成、推理模型
- `MiniMax-M2.5`（MiniMax）- 文本生成、推理模型

### 批量异步处理

1. **冷启动**：令牌桶使用 `initial_tokens=0`，避免瞬间突发
2. **重试策略**：指数退避 + 随机抖动，最大重试 5 次
3. **并发控制**：使用信号量限制并发数（建议 20-50）
4. **监控日志**：记录 429 错误频率和重试次数
5. **配额管理**：通过百炼控制台实时监控 RPM/TPM 用量

## 参考文档

- 完整文档：`/home/unionportal/7.8 阿里云coding plan限流应对.md`
- 官方文档：https://help.aliyun.com/zh/model-studio/rate-limiting-best-practices
