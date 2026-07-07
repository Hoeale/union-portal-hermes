import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// 强制动态渲染
export const dynamic = 'force-dynamic';

// GET - 获取所有政策分类（公开接口）
export async function GET() {
  try {
    // 检查缓存
    const cacheKey = 'public:policy-categories';
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // 获取所有分类
    const categories = await prisma.policyCategory.findMany({
      orderBy: { orderIndex: 'asc' },
      select: { id: true, name: true, orderIndex: true }
    });

    // 缓存结果（1小时）
    await setCache(cacheKey, categories, CACHE_TTL.MEDIUM);

    // 禁用浏览器缓存
    const response = NextResponse.json(categories);
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error fetching policy categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policy categories' },
      { status: 500 }
    );
  }
}
