import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

// POST - 提交反馈
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, contact, content, category } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: '姓名和内容不能为空' },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        name,
        contact: contact || '',
        content,
        category: category || 'suggestion',
      },
    });

    logger.info('New feedback submitted', { name, category });

    return NextResponse.json(
      { message: '反馈提交成功', id: feedback.id },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error submitting feedback', error);
    return NextResponse.json(
      { error: '提交失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// GET - 获取反馈列表（管理员用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.feedback.count(),
    ]);

    return NextResponse.json({
      data: feedbacks,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error('Error fetching feedbacks', error);
    return NextResponse.json(
      { error: '获取反馈列表失败' },
      { status: 500 }
    );
  }
}
