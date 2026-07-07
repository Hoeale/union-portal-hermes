import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

// 获取待发布内容列表
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // news, policy, video, all

    const now = new Date();

    const [scheduledNews, scheduledPolicies, scheduledVideos] = await Promise.all([
      type === 'all' || type === 'news'
        ? prisma.news.findMany({
            where: {
              publishStatus: 'scheduled',
              scheduledPublishAt: { not: null },
            },
            orderBy: { scheduledPublishAt: 'asc' },
            select: {
              id: true,
              title: true,
              category: true,
              scheduledPublishAt: true,
              status: true,
            },
          })
        : Promise.resolve([]),
      type === 'all' || type === 'policy'
        ? prisma.policy.findMany({
            where: {
              publishStatus: 'scheduled',
              scheduledPublishAt: { not: null },
            },
            orderBy: { scheduledPublishAt: 'asc' },
            select: {
              id: true,
              title: true,
              category: true,
              scheduledPublishAt: true,
              status: true,
            },
          })
        : Promise.resolve([]),
      type === 'all' || type === 'video'
        ? prisma.video.findMany({
            where: {
              publishStatus: 'scheduled',
              scheduledPublishAt: { not: null },
              isActive: true,
            },
            orderBy: { scheduledPublishAt: 'asc' },
            select: {
              id: true,
              title: true,
              category: true,
              scheduledPublishAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        news: scheduledNews,
        policies: scheduledPolicies,
        videos: scheduledVideos,
        total: scheduledNews.length + scheduledPolicies.length + scheduledVideos.length,
      },
    });
  } catch (error) {
    console.error('Get scheduled content error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
