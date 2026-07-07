/**
 * Redis 缓存客户端
 * 提供高性能的数据缓存服务
 * 支持 Redis 和内存缓存（降级方案）
 */

import Redis from 'ioredis';

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

// 内存缓存实现（作为 Redis 的降级方案）
class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async flush(): Promise<void> {
    this.store.clear();
  }

  // 定期清理过期数据
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiry) {
        this.store.delete(key);
      }
    }
  }
}

// 全局缓存实例
const memoryCache = new MemoryCache();

// Redis 客户端（如果配置了 REDIS_URL）
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

// Redis 连接状态监听
if (redis) {
  redis.on('connect', () => {
    console.log('[Cache] Redis 连接成功');
  });
  
  redis.on('error', (error) => {
    console.error('[Cache] Redis 连接错误，降级为内存缓存:', error.message);
  });
  
  redis.on('ready', () => {
    console.log('[Cache] Redis 就绪，开始使用 Redis 缓存');
  });
}

// 定期清理（每5分钟）- 仅在使用内存缓存时
setInterval(() => {
  if (!redis) {
    memoryCache.cleanup();
  }
}, 5 * 60 * 1000);

/**
 * 缓存键生成器
 */
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * 获取缓存
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    // 优先使用 Redis
    if (redis) {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    }
    
    // 降级到内存缓存
    return memoryCache.get<T>(key);
  } catch (error) {
    console.error('[Cache] 获取缓存失败:', error);
    // 出错时降级到内存缓存
    return memoryCache.get<T>(key);
  }
}

/**
 * 设置缓存
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<void> {
  try {
    // 优先使用 Redis
    if (redis) {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } else {
      // 降级到内存缓存
      await memoryCache.set(key, value, ttlSeconds);
    }
  } catch (error) {
    console.error('[Cache] 设置缓存失败:', error);
    // 出错时降级到内存缓存
    await memoryCache.set(key, value, ttlSeconds);
  }
}

/**
 * 删除缓存
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    // 优先使用 Redis
    if (redis) {
      await redis.del(key);
    } else {
      // 降级到内存缓存
      await memoryCache.delete(key);
    }
  } catch (error) {
    console.error('[Cache] 删除缓存失败:', error);
    // 出错时降级到内存缓存
    await memoryCache.delete(key);
  }
}

/**
 * 清空缓存
 */
export async function flushCache(): Promise<void> {
  try {
    // 优先使用 Redis
    if (redis) {
      await redis.flushdb();
    } else {
      // 降级到内存缓存
      await memoryCache.flush();
    }
  } catch (error) {
    console.error('[Cache] 清空缓存失败:', error);
    // 出错时降级到内存缓存
    await memoryCache.flush();
  }
}

/**
 * 缓存装饰器（用于函数）
 */
export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttlSeconds: number = 3600
): T {
  const cachedFn = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const cacheKey = keyGenerator(...args);
    const cached = await getCache<ReturnType<T>>(cacheKey);
    
    if (cached !== null) {
      return cached;
    }
    
    const result = await fn(...args) as ReturnType<T>;
    await setCache(cacheKey, result, ttlSeconds);
    return result;
  };
  
  return cachedFn as T;
}

/**
 * 缓存标签（用于批量清除）
 */
const tagIndex = new Map<string, Set<string>>();

export async function setCacheWithTag(
  key: string,
  value: unknown,
  tags: string[],
  ttlSeconds: number = 3600
): Promise<void> {
  await setCache(key, value, ttlSeconds);
  
  // 建立标签索引
  for (const tag of tags) {
    if (!tagIndex.has(tag)) {
      tagIndex.set(tag, new Set());
    }
    tagIndex.get(tag)!.add(key);
  }
}

export async function invalidateCacheByTag(tag: string): Promise<void> {
  const keys = tagIndex.get(tag);
  if (keys) {
    for (const key of keys) {
      await deleteCache(key);
    }
    tagIndex.delete(tag);
  }
}

// 缓存键常量
export const CACHE_KEYS = {
  NEWS_LIST: 'news:list',
  NEWS_DETAIL: 'news:detail',
  NEWS_CATEGORIES: 'news:categories',
  POLICY_LIST: 'policy:list',
  POLICY_DETAIL: 'policy:detail',
  SERVICE_LIST: 'service:list',
  SERVICE_DETAIL: 'service:detail',
  CAROUSEL: 'carousel',
  ABOUT: 'about',
  LAYOUT_CONFIG: 'layout:config',
  DASHBOARD: 'dashboard',
  SITE_CONFIG: 'site:config',
  STATS: 'stats',
} as const;

// 缓存 TTL 常量（秒）
export const CACHE_TTL = {
  SHORT: 60,      // 1分钟
  MEDIUM: 300,    // 5分钟
  LONG: 3600,     // 1小时
  VERY_LONG: 86400, // 24小时
} as const;

export { memoryCache };
