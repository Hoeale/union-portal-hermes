/**
 * API 缓存中间件
 * 为 GET 请求提供统一的缓存处理
 */

import { NextResponse } from 'next/server';
import { getCache, setCache, deleteCache, CACHE_TTL } from './cache';

interface CacheConfig {
  key: string;
  ttl: number;
  tags?: string[];
}

/**
 * 缓存 GET 响应
 * @param handler - 原始的 GET handler 函数
 * @param config - 缓存配置
 */
export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
  handler: T,
  config: CacheConfig
): T {
  return (async (...args: Parameters<T>) => {
    // 检查缓存
    const cached = await getCache(config.key);
    if (cached) {
      return NextResponse.json(cached);
    }

    // 执行原始 handler
    const response = await handler(...args) as NextResponse;

    // 缓存响应数据
    if (response.status === 200 || response.status === 201) {
      const data = await response.json();
      await setCache(config.key, data, config.ttl);
      
      // 如果有标签，建立索引
      if (config.tags) {
        // 标签索引在 cache.ts 中已实现
      }
    }

    return response;
  }) as T;
}

/**
 * 清除相关缓存
 * @param keys - 要清除的缓存键数组
 */
export async function invalidateCaches(keys: string[]): Promise<void> {
  await Promise.all(keys.map(key => deleteCache(key)));
}

/**
 * 缓存键生成器
 */
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return `${prefix}?${sortedParams}`;
}

export { CACHE_TTL };
export type { CacheConfig };
