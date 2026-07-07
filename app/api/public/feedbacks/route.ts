import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - 获取公开展示的留言列表（前台使用）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // 只获取标记为公开的留言
    const where = { isPublic: true };

    const total = await prisma.feedback.count({ where });
    
    const feedbacks = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        content: true,
        category: true,
        reply: true,
        replyBy: true,
        replyAt: true,
        createdAt: true,
      },
    });

    // 获取每条留言的公开评论
    const feedbacksWithComments = await Promise.all(
      feedbacks.map(async (feedback) => {
        const comments = await prisma.feedbackComment.findMany({
          where: {
            feedbackId: feedback.id,
            isVisible: true, // 只获取可见的评论
          },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            name: true,
            content: true,
            isReply: true,
            createdAt: true,
          },
        });

        return {
          ...feedback,
          comments,
        };
      })
    );

    return NextResponse.json({
      data: feedbacksWithComments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching public feedbacks:', error);
    return NextResponse.json({ error: '获取留言失败' }, { status: 500 });
  }
}
