import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { logger } from '@/lib/logger';

// 设置定时发布
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { scheduledPublishAt } = body;

    if (!scheduledPublishAt) {
      return NextResponse.json({ error: '请指定发布时间' }, { status: 400 });
    }

    const publishDate = new Date(scheduledPublishAt);
    if (isNaN(publishDate.getTime()) || publishDate <= new Date()) {
      return NextResponse.json({ error: '发布时间必须是未来的时间' }, { status: 400 });
    }

    const news = await prisma.news.update({
      where: { id: params.id },
      data: {
        scheduledPublishAt: publishDate,
        publishStatus: 'scheduled',
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: news.id,
        title: news.title,
        scheduledPublishAt: news.scheduledPublishAt,
        publishStatus: news.publishStatus,
      },
    });
  } catch (error) {
    logger.error('Schedule publish error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 取消定时发布
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    await prisma.news.update({
      where: { id: params.id },
      data: {
        scheduledPublishAt: null,
        publishStatus: 'immediate',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Cancel schedule error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
