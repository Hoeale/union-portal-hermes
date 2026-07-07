import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { withCsrfProtection } from '@/lib/csrf';
import { apiErrorResponse, apiUnauthorizedError, apiValidationError, apiNotFoundError } from '@/lib/api-errors';

// POST - 回复反馈
export async function POST(
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
    const { reply, status } = body;

    if (!reply || !reply.trim()) {
      return apiValidationError('回复内容不能为空');
    }

    // 检查反馈是否存在
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!existingFeedback) {
      return apiNotFoundError();
    }

    // Sanitize 回复内容（允许基本 HTML 标签用于格式化）
    const sanitizedReply = sanitizeHtml(reply, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'a'],
      allowedAttributes: {
        'a': ['href', 'title', 'target'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
    });

    // 获取当前管理员用户名（从 session 中获取）
    const session = (request as any).session || {};
    const replyBy = session.username || 'admin';

    // 允许前端传入状态，如果未传入则保持原状态
    const VALID_STATUSES = ['unread', 'read', 'processing', 'resolved'];
    const newStatus = status && VALID_STATUSES.includes(status) ? status : existingFeedback.status;

    // 更新反馈
    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        reply: sanitizedReply,
        replyBy,
        replyAt: new Date(),
        status: newStatus,
        isRead: true,
      },
    });

    // 创建通知（记录回复操作）
    await prisma.notification.create({
      data: {
        title: '反馈已回复',
        message: `管理员 ${replyBy} 回复了用户 ${existingFeedback.name} 的反馈`,
        type: 'feedback',
        link: `/admin/feedback`,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedFeedback,
    });
  } catch (error) {
    return apiErrorResponse(error, 'POST /api/admin/feedback/[id]/reply');
  }
}
