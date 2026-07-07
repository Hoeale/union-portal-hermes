import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminPermissions, logReviewAction } from '@/lib/permission';
import { createNotification } from '@/lib/notification-service';
import { logger } from '@/lib/logger';

// 获取审核开关状态
async function isReviewEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'review_enabled' },
    });
    if (!setting) return false;
    return setting.value === 'true' || setting.value === '1';
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查审核功能是否开启
    if (!await isReviewEnabled()) {
      return NextResponse.json({ error: '审核功能未开启' }, { status: 403 });
    }

    const admin = await getCurrentAdminPermissions(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const newsId = params.id;

    // 获取新闻当前状态
    const news = await prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!news) {
      return NextResponse.json({ error: '新闻不存在' }, { status: 404 });
    }

    if (news.status === 'published') {
      return NextResponse.json({ error: '已发布的新闻无法提交审核' }, { status: 400 });
    }

    // 更新状态为待审核
    const updatedNews = await prisma.news.update({
      where: { id: newsId },
      data: {
        status: 'pending',
      },
    });

    // 记录审核日志
    await logReviewAction(
      'news',
      newsId,
      'submit',
      admin.username,
      '提交审核',
      'draft',
      'pending'
    );

    // 通知审核员
    const reviewers = await prisma.admin.findMany({
      where: {
        role: 'reviewer',
        isActive: true,
      },
      select: { username: true },
    });

    for (const reviewer of reviewers) {
      await createNotification(
        'system',
        '待审核新闻',
        `${admin.username} 提交了新闻 "${news.title}" 的审核`,
        `/admin/news/${newsId}/review`
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedNews,
    });
  } catch (error) {
    logger.error('Error submitting news for review:', error);
    return NextResponse.json({ error: '提交审核失败' }, { status: 500 });
  }
}
