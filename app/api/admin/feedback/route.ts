import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { withCsrfProtection } from '@/lib/csrf';
import { logOperation } from '@/lib/operation-logger';
import { apiErrorResponse, apiUnauthorizedError, apiValidationError } from '@/lib/api-errors';

// GET - 获取留言列表（分页、筛选）
export async function GET(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      return apiUnauthorizedError();
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const category = searchParams.get('category') || 'all';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: any = {};
    if (filter === 'unread') {
      where.isRead = false;
    } else if (filter === 'read') {
      where.isRead = true;
    }

    // 分类筛选
    if (category !== 'all') {
      where.category = category;
    }

    // 状态筛选
    if (status !== 'all') {
      where.status = status;
    }

    const total = await prisma.feedback.count({ where });
    
    const feedbacks = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      data: feedbacks,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/admin/feedback');
  }
}

// POST - 前台提交留言（公开接口）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, contact, content, category } = body;

    // XSS 防护: 清洗用户输入
    const sanitizedName = sanitizeHtml(name, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();

    const sanitizedContact = sanitizeHtml(contact, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();

    const sanitizedContent = sanitizeHtml(content, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();

    if (!sanitizedName || !sanitizedContact || !sanitizedContent) {
      return NextResponse.json(
        { error: '姓名、联系方式和留言内容均为必填项' },
        { status: 400 }
      );
    }

    if (sanitizedContent.length < 5) {
      return NextResponse.json(
        { error: '留言内容至少需要5个字符' },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        name: sanitizedName,
        contact: sanitizedContact,
        content: sanitizedContent,
        isRead: false,
        category: category || null,
        status: 'unread',
      },
    });

    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    return apiErrorResponse(error, 'POST /api/admin/feedback');
  }
}

// PUT - 标记已读/未读/批量标记/公开隐藏
export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return apiUnauthorizedError();
    }

    // CSRF 保护
    const csrfError = await withCsrfProtection(request);
    if (csrfError) return csrfError;

    const body = await request.json();
    const { id, ids, action, isRead, isPublic } = body;

    // 标记全部已读
    if (action === 'markReadAll') {
      await prisma.feedback.updateMany({
        where: { isRead: false },
        data: { 
          isRead: true,
          status: 'read'  // 同时更新 status 字段
        },
      });
      return NextResponse.json({ success: true });
    }

    // 批量模式
    if (ids && Array.isArray(ids)) {
      const updateData: any = {};
      if (isRead !== undefined) updateData.isRead = isRead;
      if (isPublic !== undefined) updateData.isPublic = isPublic;

      await prisma.feedback.updateMany({
        where: { id: { in: ids } },
        data: updateData,
      });
      return NextResponse.json({ success: true });
    }

    // 单条模式
    if (id) {
      const feedback = await prisma.feedback.findUnique({
        where: { id },
      });

      const updateData: any = {};
      if (isRead !== undefined) updateData.isRead = isRead;
      if (isPublic !== undefined) updateData.isPublic = isPublic;

      await prisma.feedback.update({
        where: { id },
        data: updateData,
      });

      // 记录操作日志
      if (feedback) {
        const action = isPublic !== undefined ? (isPublic ? 'make_public' : 'hide_public') : (isRead !== undefined ? 'mark_read' : 'update');
        await logOperation({
          request,
          module: 'feedback',
          action,
          targetId: id,
          targetType: 'feedback',
          targetTitle: feedback.name,
        });
      }

      return NextResponse.json({ success: true });
    }

    return apiValidationError('缺少参数');
  } catch (error) {
    return apiErrorResponse(error, 'PUT /api/admin/feedback');
  }
}

// DELETE - 删除留言（支持单条和批量）
export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return apiUnauthorizedError();
    }

    // CSRF 保护
    const csrfError = await withCsrfProtection(request);
    if (csrfError) return csrfError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // 单条删除
    if (id) {
      const oldFeedback = await prisma.feedback.findUnique({
        where: { id },
      });

      await prisma.feedback.delete({ where: { id } });

      // 记录操作日志
      if (oldFeedback) {
        await logOperation({
          request,
          module: 'feedback',
          action: 'delete',
          targetId: id,
          targetType: 'feedback',
          targetTitle: oldFeedback.name,
        });
      }

      return NextResponse.json({ success: true, deletedCount: 1 });
    }

    // 批量删除
    try {
      const body = await request.json();
      if (body.ids && Array.isArray(body.ids)) {
        const result = await prisma.feedback.deleteMany({
          where: { id: { in: body.ids } },
        });
        return NextResponse.json({ success: true, deletedCount: result.count });
      }
    } catch {
      // 没有 JSON body
    }

    return apiValidationError('缺少留言 ID');
  } catch (error) {
    return apiErrorResponse(error, 'DELETE /api/admin/feedback');
  }
}
