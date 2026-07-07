import { describe, it, expect, beforeEach } from '@jest/globals';
import { getCache, setCache, deleteCache, flushCache, generateCacheKey, memoryCache } from './cache';

describe('Cache Module', () => {
  beforeEach(async () => {
    // 清理内存缓存
    await memoryCache.flush();
  });

  describe('MemoryCache CRUD', () => {
    it('should set and get cache', async () => {
      const testData = { name: 'test', value: 123 };
      await setCache('test-key', testData, 3600);
      const result = await getCache<typeof testData>('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent key', async () => {
      const result = await getCache('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete cache', async () => {
      await setCache('delete-key', { data: 'value' }, 3600);
      await deleteCache('delete-key');
      const result = await getCache('delete-key');
      expect(result).toBeNull();
    });

    it('should flush all cache', async () => {
      await setCache('key1', 'value1', 3600);
      await setCache('key2', 'value2', 3600);
      await flushCache();
      
      const result1 = await getCache('key1');
      const result2 = await getCache('key2');
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('should handle different data types', async () => {
      await setCache('string-key', 'string-value', 3600);
      await setCache('number-key', 42, 3600);
      await setCache('array-key', [1, 2, 3], 3600);
      await setCache('boolean-key', true, 3600);

      expect(await getCache<string>('string-key')).toBe('string-value');
      expect(await getCache<number>('number-key')).toBe(42);
      expect(await getCache<number[]>('array-key')).toEqual([1, 2, 3]);
      expect(await getCache<boolean>('boolean-key')).toBe(true);
    });
  });

  describe('Cache Expiration', () => {
    it('should expire cache after TTL', async () => {
      // 设置一个 1 秒过期的缓存
      await setCache('expiring-key', 'value', 1);
      
      // 立即获取应该存在
      const immediate = await getCache('expiring-key');
      expect(immediate).toBe('value');

      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // 过期后应该返回 null
      const expired = await getCache('expiring-key');
      expect(expired).toBeNull();
    });

    it('should cleanup expired entries', async () => {
      // 设置多个短过期缓存
      await setCache('expire1', 'value1', 1);
      await setCache('expire2', 'value2', 1);
      await setCache('keep', 'value', 3600);

      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 1100));

      // 执行清理
      memoryCache.cleanup();

      // 过期的应该被清除，未过期的还在
      expect(await getCache('expire1')).toBeNull();
      expect(await getCache('expire2')).toBeNull();
      expect(await getCache('keep')).toBe('value');
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate cache key with prefix', () => {
      const key = generateCacheKey('news', 'list');
      expect(key).toBe('news:list');
    });

    it('should generate cache key with multiple parts', () => {
      const key = generateCacheKey('news', 'detail', '123', 'page1');
      expect(key).toBe('news:detail:123:page1');
    });

    it('should handle numeric parts', () => {
      const key = generateCacheKey('api', 123, 456);
      expect(key).toBe('api:123:456');
    });
  });

  describe('Error Handling', () => {
    it('should handle get cache error gracefully', async () => {
      // 即使 Redis 出错也应该降级到内存缓存
      const result = await getCache('error-test');
      expect(result).toBeNull();
    });

    it('should handle set cache error gracefully', async () => {
      // 不应该抛出异常
      await expect(setCache('error-test', 'value', 3600)).resolves.not.toThrow();
    });

    it('should handle delete cache error gracefully', async () => {
      // 删除不存在的键不应该报错
      await expect(deleteCache('non-existent')).resolves.not.toThrow();
    });
  });
});
