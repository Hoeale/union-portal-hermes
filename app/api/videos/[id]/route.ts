import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

// GET - Fetch single video by ID and increment view count
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: '视频ID不能为空' },
        { status: 400 }
      );
    }

    // Fetch video
    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json(
        { error: '视频不存在' },
        { status: 404 }
      );
    }

    if (!video.isActive) {
      return NextResponse.json(
        { error: '视频未公开' },
        { status: 403 }
      );
    }

    // Increment view count atomically
    await prisma.video.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // Transform to component format
    const item = {
      id: video.id,
      title: video.title,
      category: video.category,
      description: video.description,
      source_type: video.sourceType,
      video_url: video.videoUrl,
      thumbnail_url: video.thumbnailUrl,
      duration: video.duration,
      view_count: video.viewCount + 1, // Return incremented count
      created_at: video.createdAt.toISOString(),
      updated_at: video.updatedAt.toISOString(),
    };

    // 禁用浏览器/CDN缓存，确保后台修改后立即生效
    const response = NextResponse.json(item);
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}
