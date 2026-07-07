import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withCsrfProtection } from '@/lib/csrf';
import { apiErrorResponse, apiUnauthorizedError, apiValidationError, apiNotFoundError } from '@/lib/api-errors';

// PATCH - 更新评论（切换可见性）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return apiUnauthorizedError();
    }

    // CSRF 保护
    const csrfError = await withCsrfProtection(request);
    if (csrfError) return csrfError;

    const commentId = params.id;
    const body = await request.json();
    const { isVisible } = body;

    if (typeof isVisible !== 'boolean') {
      return apiValidationError('参数错误');
    }

    // 检查评论是否存在（使用原生 SQL）
    const checkResult = await prisma.$queryRaw`
      SELECT * FROM feedback_comments WHERE _id = ${commentId}
    `;
    
    if (!checkResult || (checkResult as any[]).length === 0) {
      return apiNotFoundError();
    }

    // 更新评论可见性（使用原生 SQL）
    const now = new Date();
    await prisma.$executeRaw`
      UPDATE feedback_comments 
      SET is_visible = ${isVisible}, updated_at = ${now}
      WHERE _id = ${commentId}
    `;

    // 获取更新后的评论
    const updatedResult = await prisma.$queryRaw`
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
      WHERE _id = ${commentId}
    `;

    return NextResponse.json({
      success: true,
      data: (updatedResult as any[])[0],
    });
  } catch (error) {
    return apiErrorResponse(error, 'PATCH /api/admin/feedback/comment/[id]');
  }
}

// DELETE - 删除评论
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return apiUnauthorizedError();
    }

    // CSRF 保护
    const csrfError = await withCsrfProtection(request);
    if (csrfError) return csrfError;

    const commentId = params.id;

    // 检查评论是否存在（使用原生 SQL）
    const checkResult = await prisma.$queryRaw`
      SELECT * FROM feedback_comments WHERE _id = ${commentId}
    `;
    
    if (!checkResult || (checkResult as any[]).length === 0) {
      return apiNotFoundError();
    }

    // 删除评论（使用原生 SQL）
    await prisma.$executeRaw`
      DELETE FROM feedback_comments WHERE _id = ${commentId}
    `;

    return NextResponse.json({
      success: true,
      message: '评论已删除',
    });
  } catch (error) {
    return apiErrorResponse(error, 'DELETE /api/admin/feedback/comment/[id]');
  }
}
