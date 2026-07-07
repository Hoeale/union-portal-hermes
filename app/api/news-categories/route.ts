import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

// 公开 API：获取启用的新闻分类（前端使用）
export async function GET() {
  try {
    // 检查缓存
    const cacheKey = CACHE_KEYS.NEWS_CATEGORIES;
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const categories = await prisma.newsCategory.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        orderIndex: true,
      },
    });

    // 缓存结果
    await setCache(cacheKey, categories, CACHE_TTL.LONG);

    // 禁用浏览器/CDN缓存，确保后台修改后立即生效
    const response = NextResponse.json(categories);
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return response;
  } catch (error) {
    logger.error('Failed to fetch public news categories:', error);
    return NextResponse.json(
      { error: '获取分类列表失败' },
      { status: 500 }
    );
  }
}
