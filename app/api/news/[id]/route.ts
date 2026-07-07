import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const news = await prisma.news.findUnique({
      where: { id },
    });

    if (!news) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    // Transform database format to component format
    const item = {
      id: news.id,
      title: news.title,
      category: news.category,
      content: news.content,
      image_url: news.imageUrl,
      is_carousel: news.isCarousel,
      carousel_order: news.carouselOrder,
      published_at: news.publishedAt.toISOString(),
      created_at: news.createdAt.toISOString(),
    };

    // 禁用浏览器/CDN缓存，确保后台修改后立即生效
    const response = NextResponse.json(item);
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
