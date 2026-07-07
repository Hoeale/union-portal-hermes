import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

export async function GET(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    // 检查缓存
    const cacheKey = CACHE_KEYS.DASHBOARD;
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // 内容统计
    const [newsCount, policyCount, videoCount, serviceCount] = await Promise.all([
      prisma.news.count({ where: { status: 'published' } }),
      prisma.policy.count({ where: { status: 'published' } }),
      prisma.video.count({ where: { isActive: true } }),
      prisma.siteInfo.count(),
    ]);

    // 反馈统计
    const [feedbackTotal, feedbackUnread] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { isRead: false } }),
    ]);

    // 待办事项
    const [pendingNews, pendingPolicies, unreadFeedback, scheduledContent] = await Promise.all([
      prisma.news.count({ where: { status: 'pending' } }),
      prisma.policy.count({ where: { status: 'pending' } }),
      prisma.feedback.count({ where: { isRead: false } }),
      prisma.news.count({
        where: {
          publishStatus: 'scheduled',
          scheduledPublishAt: { lte: new Date() },
        },
      }),
    ]);

    // 待办列表
    const todos = [];
    if (pendingNews > 0) {
      todos.push({
        id: 'pending-news',
        title: '待发布新闻',
        count: pendingNews,
        link: '/admin/news?status=pending',
        priority: 'high',
      });
    }
    if (pendingPolicies > 0) {
      todos.push({
        id: 'pending-policies',
        title: '待发布政策',
        count: pendingPolicies,
        link: '/admin/policies?status=pending',
        priority: 'high',
      });
    }
    if (unreadFeedback > 0) {
      todos.push({
        id: 'unread-feedback',
        title: '未读反馈',
        count: unreadFeedback,
        link: '/admin/feedback?filter=unread',
        priority: 'medium',
      });
    }
    if (scheduledContent > 0) {
      todos.push({
        id: 'scheduled-publish',
        title: '待定时发布',
        count: scheduledContent,
        link: '/admin/scheduled',
        priority: 'low',
      });
    }

    // 最近编辑内容(新闻)
    const recentNews = await prisma.news.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });

    // 最近编辑内容(政策)
    const recentPolicies = await prisma.policy.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });

    const recentContent = [...recentNews, ...recentPolicies]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // 访问统计
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);

    const [todayViews, weekViews, monthViews, totalViews, uniqueVisitors] = await Promise.all([
      prisma.pageView.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.pageView.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.pageView.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.pageView.count(),
      prisma.pageView.groupBy({
        by: ['ip'],
        where: { createdAt: { gte: todayStart } },
        _count: { ip: true },
      }).then((groups) => groups.length),
    ]);

    // 热门新闻 TOP 10
    const topNews = await prisma.news.findMany({
      where: { status: 'published' },
      orderBy: { viewCount: 'desc' },
      take: 10,
      select: { id: true, title: true, viewCount: true },
    });

    const responseData = {
      success: true,
      data: {
        contentStats: {
          news: newsCount,
          policies: policyCount,
          videos: videoCount,
          services: serviceCount,
        },
        feedbackStats: {
          total: feedbackTotal,
          unread: feedbackUnread,
        },
        pageViewStats: {
          todayViews,
          weekViews,
          monthViews,
          totalViews,
          uniqueVisitors,
        },
        topNews: topNews.map((n) => ({
          id: n.id,
          title: n.title,
          views: n.viewCount,
        })),
        todos,
        recentContent,
      },
    };

    // 缓存结果（短 TTL，因为数据变化频繁）
    await setCache(cacheKey, responseData, CACHE_TTL.SHORT);

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: '获取仪表板数据失败' },
      { status: 500 }
    );
  }
}
