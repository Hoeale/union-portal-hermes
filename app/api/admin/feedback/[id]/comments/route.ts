import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiErrorResponse, apiUnauthorizedError, apiNotFoundError } from '@/lib/api-errors';

// GET - 获取反馈的所有评论
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return apiUnauthorizedError();
    }

    const feedbackId = params.id;

    // 检查反馈是否存在
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!existingFeedback) {
      return apiNotFoundError();
    }

    // 使用原生 SQL 获取所有评论（绕过 Prisma Client 版本问题）
    const comments = await prisma.$queryRaw`
      SELECT 
        _id as id,
        feedback_id as feedbackId,
        name,
        contact,
        content,
        is_reply as isReply,
        is_visible as isVisible,
        created_at as createdAt,
        updated_at as updatedAt
      FROM feedback_comments 
      WHERE feedback_id = ${feedbackId}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/admin/feedback/[id]/comments');
  }
}
