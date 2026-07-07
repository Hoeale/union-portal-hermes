import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // 计算日期范围
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // 并行获取统计数据
    const [
      totalNews,
      totalPolicies,
      totalVideos,
      totalServices,
      totalFeedbacks,
      unreadFeedbacks,
      recentPageViews,
      topNews,
    ] = await Promise.all([
      prisma.news.count(),
      prisma.policy.count(),
      prisma.video.count(),
      prisma.service.count(),
      prisma.feedback.count(),
      prisma.feedback.count({ where: { isRead: false } }),
      // 近期访问量
      prisma.pageView.count({
        where: { createdAt: { gte: startDate } },
      }),
      // 热门新闻（阅读量前10）
      prisma.news.findMany({
        where: { status: 'published' },
        orderBy: { viewCount: 'desc' },
        take: 10,
        select: { id: true, title: true, viewCount: true, publishedAt: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        content: {
          news: totalNews,
          policies: totalPolicies,
          videos: totalVideos,
          services: totalServices,
        },
        feedback: {
          total: totalFeedbacks,
          unread: unreadFeedbacks,
        },
        pageViews: {
          total: recentPageViews,
          days,
        },
        topContent: topNews.map((n) => ({
          id: n.id,
          title: n.title,
          views: n.viewCount,
          date: n.publishedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
