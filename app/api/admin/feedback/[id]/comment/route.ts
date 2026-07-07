import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { withCsrfProtection } from '@/lib/csrf';
import { apiErrorResponse, apiUnauthorizedError, apiValidationError, apiNotFoundError } from '@/lib/api-errors';

// 生成 UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// POST - 追加评论/回复
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
    const { content, isReply = true, status } = body;

    if (!content || !content.trim()) {
      return apiValidationError('内容不能为空');
    }

    // 检查反馈是否存在
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!existingFeedback) {
      return apiNotFoundError();
    }

    // Sanitize 内容
    const sanitizedContent = sanitizeHtml(content, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'a'],
      allowedAttributes: {
        'a': ['href', 'title', 'target'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
    });

    // 获取当前管理员用户名
    const session = (request as any).session || {};
    const name = session.username || 'admin';

    // 使用原生 SQL 创建评论（绕过 Prisma Client 版本问题）
    const commentId = generateUUID();
    const now = new Date();
    
    await prisma.$executeRaw`
      INSERT INTO feedback_comments (
        _id, feedback_id, name, contact, content, is_reply, is_visible, created_at, updated_at
      ) VALUES (
        ${commentId}, ${feedbackId}, ${name}, '', ${sanitizedContent}, ${isReply !== false}, 1, ${now}, ${now}
      )
    `;

    // 获取刚创建的评论
    const comment = await prisma.$queryRaw`
      SELECT * FROM feedback_comments WHERE _id = ${commentId}
    `;
    const createdComment = (comment as any[])[0];

    // 如果传入了状态，更新反馈状态
    if (status) {
      const VALID_STATUSES = ['unread', 'read', 'processing', 'resolved'];
      if (VALID_STATUSES.includes(status)) {
        await prisma.feedback.update({
          where: { id: feedbackId },
          data: {
            status,
            isRead: status !== 'unread',
          },
        });
      }
    }

    // 创建通知
    await prisma.notification.create({
      data: {
        title: isReply ? '追加回复' : '添加评论',
        message: `管理员 ${name} 对 ${existingFeedback.name} 的反馈进行了回复`,
        type: 'feedback',
        link: `/admin/feedback`,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: createdComment,
    });
  } catch (error) {
    return apiErrorResponse(error, 'POST /api/admin/feedback/[id]/comment');
  }
}
