import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { CACHE_KEYS, deleteCache, deleteCacheByPrefix } from '@/lib/cache';

// POST - 检查并发布到期的定时新闻
export async function POST() {
  try {
    // 认证检查
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: '未授权访问，请先登录' }, { status: 401 });
    }

    const now = new Date();

    // 查找所有到期的定时发布新闻
    const scheduledNews = await prisma.news.findMany({
      where: {
        publishStatus: 'scheduled',
        scheduledPublishAt: {
          lte: now,
        },
        status: 'pending', // 只处理待发布的
      },
    });

    if (scheduledNews.length === 0) {
      return NextResponse.json({
        success: true,
        published: 0,
        message: '没有到期的定时发布内容',
      });
    }

    // 批量更新状态
    const ids = scheduledNews.map((n) => n.id);
    await prisma.news.updateMany({
      where: { id: { in: ids } },
      data: {
        status: 'published',
        publishStatus: 'immediate',
        publishedAt: now,
      },
    });

    // 重新验证页面
    revalidatePath('/');
    revalidatePath('/news');
    await deleteCache(CACHE_KEYS.NEWS_LIST);
    await deleteCacheByPrefix(`${CACHE_KEYS.NEWS_LIST}:`);
    await deleteCache(CACHE_KEYS.CAROUSEL);
    await deleteCache(CACHE_KEYS.DASHBOARD);

    console.log(`[Auto-publish] Published ${scheduledNews.length} scheduled news items`);

    return NextResponse.json({
      success: true,
      published: scheduledNews.length,
      items: scheduledNews.map((n) => ({ id: n.id, title: n.title })),
    });
  } catch (error) {
    logger.error('Auto-publish error:', error);
    return NextResponse.json(
      { error: '自动发布失败' },
      { status: 500 }
    );
  }
}

// GET - 获取定时发布列表（仅新闻）
export async function GET() {
  try {
    // 认证检查
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: '未授权访问，请先登录' }, { status: 401 });
    }

    const scheduledNews = await prisma.news.findMany({
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
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: scheduledNews.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        scheduled_publish_at: item.scheduledPublishAt?.toISOString(),
        status: item.status,
        created_at: item.createdAt.toISOString(),
      })),
      total: scheduledNews.length,
    });
  } catch (error) {
    logger.error('Get scheduled news error:', error);
    return NextResponse.json(
      { error: '获取定时发布列表失败' },
      { status: 500 }
    );
  }
}
