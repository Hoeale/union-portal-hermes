import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic'

// GET - 获取留言的评论列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const feedbackId = params.id;

    const comments = await prisma.feedbackComment.findMany({
      where: { feedbackId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json(
      { success: false, error: '获取评论失败' },
      { status: 500 }
    );
  }
}

// POST - 添加评论
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const feedbackId = params.id;
    const body = await request.json();

    const { name, contact, content } = body;

    if (!name || !contact || !content) {
      return NextResponse.json(
        { success: false, error: '请填写所有必填项' },
        { status: 400 }
      );
    }

    if (content.length < 5) {
      return NextResponse.json(
        { success: false, error: '评论内容至少需要5个字符' },
        { status: 400 }
      );
    }

    // 检查留言是否存在
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      return NextResponse.json(
        { success: false, error: '留言不存在' },
        { status: 404 }
      );
    }

    // 创建评论
    const comment = await prisma.feedbackComment.create({
      data: {
        feedbackId,
        name,
        contact,
        content,
      },
    });

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json(
      { success: false, error: '提交评论失败' },
      { status: 500 }
    );
  }
}
