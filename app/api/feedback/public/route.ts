import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

// GET - 获取公开的反馈列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const category = searchParams.get('category') || 'all';

    const skip = (page - 1) * pageSize;

    const where: any = {
      isPublic: true,
      status: 'resolved', // 只显示已解决的留言
    };

    if (category !== 'all') {
      where.category = category;
    }

    const total = await prisma.feedback.count({ where });

    const feedbacks = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        content: true,
        category: true,
        status: true,
        reply: true,
        replyAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: feedbacks,
      total,
      totalPages: Math.ceil(total / pageSize),
      page,
    });
  } catch (error) {
    console.error('Failed to fetch public feedbacks:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
