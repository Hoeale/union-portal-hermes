import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [
      newsCount,
      videoCount,
      workerCount,
      serviceCount,
      policyCount,
      linkCount,
      carouselCount,
    ] = await Promise.all([
      prisma.news.count(),
      prisma.video.count(),
      prisma.worker.count(),
      prisma.service.count(),
      prisma.policy.count(),
      prisma.friendlyLink.count(),
      prisma.carouselItem.count(),
    ]);

    // Get recent news
    const recentNews = await prisma.news.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        createdAt: true,
      },
    });

    // Get recent videos
    const recentVideos = await prisma.video.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          news: newsCount,
          videos: videoCount,
          workers: workerCount,
          services: serviceCount,
          policies: policyCount,
          links: linkCount,
          carousel: carouselCount,
        },
        recentNews,
        recentVideos,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}
