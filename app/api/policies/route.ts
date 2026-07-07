import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// TODO [P3-Edge Runtime]: 此 API 适合使用 Edge Runtime 加速
// 当前状态: 使用 Node.js Runtime（因为依赖 Prisma）
// 优化方案: 如果未来改为直接读取 Redis 缓存或使用边缘数据库（如 Upstash Redis），
//          可以启用 Edge Runtime:
//          export const runtime = 'edge';
// 预期收益: 冷启动时间从 ~200ms 降至 ~10ms，提升 95%
// 限制: Edge Runtime 不支持 Prisma Client、Node.js API（fs、crypto 等）

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

// GET - Fetch all active policies for frontend
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    // 生成缓存键
    const cacheKey = `${CACHE_KEYS.POLICY_LIST}:${category || 'all'}:${limit || 'all'}`;
    
    // 检查缓存
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const policies = await prisma.policy.findMany({
      where: {
        status: 'published', // 只显示已发布的内容
        isActive: true,      // 且已开启显示
        ...(category && { category }),
      },
      orderBy: [{ publishDate: 'desc' }, { orderIndex: 'asc' }],
      take: limit ? parseInt(limit) : undefined,
    });

    // 缓存结果（ISR: 1小时重新验证）
    await setCache(cacheKey, policies, CACHE_TTL.MEDIUM);

    // 禁用浏览器/CDN缓存，确保后台修改后立即生效
    const response = NextResponse.json(policies);
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}
