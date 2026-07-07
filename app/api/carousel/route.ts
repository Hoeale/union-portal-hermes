import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

// 公开 API：获取轮播图数据
export async function GET(request: NextRequest) {
  try {
    // 检查缓存
    const cacheKey = CACHE_KEYS.CAROUSEL;
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const news = await prisma.news.findMany({
      where: {
        status: 'published',
        isCarousel: true,
      },
      orderBy: { carouselOrder: 'asc' },
    });

    // Transform to carousel format
    const items = news.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      content: item.content,
      image_url: item.imageUrl,
      is_carousel: item.isCarousel,
      carousel_order: item.carouselOrder,
      published_at: item.publishedAt.toISOString(),
      created_at: item.createdAt.toISOString(),
    }));

    // 缓存结果（短 TTL，因为轮播图可能频繁更新）
    await setCache(cacheKey, items, CACHE_TTL.SHORT);

    // 禁用浏览器/CDN缓存，确保后台修改后立即生效
    const response = NextResponse.json(items);
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error fetching carousel data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carousel data' },
      { status: 500 }
    );
  }
}
