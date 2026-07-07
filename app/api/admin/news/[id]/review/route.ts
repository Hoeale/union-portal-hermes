import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminPermissions, hasPermission, logReviewAction, PERMISSIONS } from '@/lib/permission';
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

    // 检查审核权限
    if (!hasPermission(admin, PERMISSIONS.NEWS_REVIEW)) {
      return NextResponse.json({ error: '无审核权限' }, { status: 403 });
    }

    const newsId = params.id;
    const body = await request.json();
    const { action, comment } = body; // action: approve, reject, request_changes

    // 验证action
    if (!['approve', 'reject', 'request_changes'].includes(action)) {
      return NextResponse.json({ error: '无效的审核操作' }, { status: 400 });
    }

    // 获取新闻当前状态
    const news = await prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!news) {
      return NextResponse.json({ error: '新闻不存在' }, { status: 404 });
    }

    if (news.status !== 'pending') {
      return NextResponse.json({ error: '只能审核待审核状态的新闻' }, { status: 400 });
    }

    // 根据审核操作更新状态
    let newStatus: string;
    switch (action) {
      case 'approve':
        newStatus = 'published';
        break;
      case 'reject':
        newStatus = 'pending';
        break;
      case 'request_changes':
        newStatus = 'pending';
        break;
      default:
        newStatus = 'pending';
    }

    // 更新新闻状态
    const updatedNews = await prisma.news.update({
      where: { id: newsId },
      data: {
        status: newStatus as any,
        ...(action === 'approve' ? { publishedAt: new Date() } : {}),
      },
    });

    // 记录审核日志
    await logReviewAction(
      'news',
      newsId,
      action,
      admin.username,
      comment,
      'pending',
      newStatus
    );

    return NextResponse.json({
      success: true,
      data: updatedNews,
      message: action === 'approve' ? '审核通过并发布' : action === 'reject' ? '审核驳回' : '已退回修改',
    });
  } catch (error) {
    logger.error('Error reviewing news:', error);
    return NextResponse.json({ error: '审核失败' }, { status: 500 });
  }
}
