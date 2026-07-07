import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

// GET - Fetch active videos with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    const where: any = {
      isActive: true,
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    const videos = await prisma.video.findMany({
      where,
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
      take: limit ? parseInt(limit) : undefined,
    });

    // Transform to component format
    const items = videos.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      description: item.description,
      source_type: item.sourceType,
      video_url: item.videoUrl,
      thumbnail_url: item.thumbnailUrl,
      duration: item.duration,
      view_count: item.viewCount,
      created_at: item.createdAt.toISOString(),
    }));

    // 禁用浏览器/CDN缓存，确保后台修改后立即生效
    const response = NextResponse.json(items);
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
