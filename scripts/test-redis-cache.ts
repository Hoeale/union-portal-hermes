/**
 * Redis 缓存集成测试
 * 验证 Redis 缓存功能和降级机制
 */

import { getCache, setCache, deleteCache, flushCache, generateCacheKey } from '../lib/cache';

async function testCache() {
  console.log('=== Redis 缓存集成测试 ===\n');
  
  // 测试 1: 设置和获取缓存
  console.log('测试 1: 设置和获取缓存');
  const testKey = generateCacheKey('test', 'key1');
  const testData = { message: 'Hello Redis!', timestamp: Date.now() };
  
  await setCache(testKey, testData, 60);
  console.log('✓ 缓存已设置');
  
  const cached = await getCache<typeof testData>(testKey);
  if (cached && cached.message === testData.message) {
    console.log('✓ 缓存获取成功:', cached.message);
  } else {
    console.error('✗ 缓存获取失败');
  }
  
  // 测试 2: 删除缓存
  console.log('\n测试 2: 删除缓存');
  await deleteCache(testKey);
  const deleted = await getCache(testKey);
  if (deleted === null) {
    console.log('✓ 缓存删除成功');
  } else {
    console.error('✗ 缓存删除失败');
  }
  
  // 测试 3: 缓存过期
  console.log('\n测试 3: 缓存过期 (TTL=2秒)');
  const expireKey = generateCacheKey('test', 'expire');
  await setCache(expireKey, { data: 'will expire' }, 2);
  console.log('✓ 缓存已设置 (TTL=2秒)');
  
  const beforeExpire = await getCache(expireKey);
  if (beforeExpire) {
    console.log('✓ 过期前可以获取缓存');
  }
  
  // 等待过期
  await new Promise(resolve => setTimeout(resolve, 3000));
  const afterExpire = await getCache(expireKey);
  if (afterExpire === null) {
    console.log('✓ 缓存已过期');
  } else {
    console.error('✗ 缓存未过期');
  }
  
  // 测试 4: 清空缓存
  console.log('\n测试 4: 清空缓存');
  await setCache(generateCacheKey('test', 'clear1'), { data: 1 }, 60);
  await setCache(generateCacheKey('test', 'clear2'), { data: 2 }, 60);
  await flushCache();
  
  const cleared1 = await getCache(generateCacheKey('test', 'clear1'));
  const cleared2 = await getCache(generateCacheKey('test', 'clear2'));
  if (cleared1 === null && cleared2 === null) {
    console.log('✓ 缓存清空成功');
  } else {
    console.error('✗ 缓存清空失败');
  }
  
  console.log('\n=== 测试完成 ===');
  console.log('提示: 如果看到 "[Cache] Redis 就绪" 消息,说明正在使用 Redis 缓存');
  console.log('提示: 如果看到 "[Cache] Redis 连接错误" 消息,说明已降级为内存缓存');
  
  process.exit(0);
}

testCache().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});
