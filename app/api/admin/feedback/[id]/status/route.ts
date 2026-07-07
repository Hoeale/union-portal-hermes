import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withCsrfProtection } from '@/lib/csrf';
import { apiErrorResponse, apiUnauthorizedError, apiValidationError, apiNotFoundError } from '@/lib/api-errors';

const VALID_STATUSES = ['unread', 'read', 'processing', 'resolved'];

// PATCH - 更新反馈状态
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

    const feedbackId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return apiValidationError(`无效的状态值，支持: ${VALID_STATUSES.join(', ')}`);
    }

    // 检查反馈是否存在
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!existingFeedback) {
      return apiNotFoundError();
    }

    // 同步 isRead 字段
    const isRead = status !== 'unread';

    // 更新状态
    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        status,
        isRead,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedFeedback,
    });
  } catch (error) {
    return apiErrorResponse(error, 'PATCH /api/admin/feedback/[id]/status');
  }
}
