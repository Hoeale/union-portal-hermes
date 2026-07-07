import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import { withCsrfProtection } from '@/lib/csrf';

// GET - 获取通知列表(分页,支持isRead筛选)
export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const isReadFilter = searchParams.get('isRead'); // 'true', 'false', or null

    const where: any = {};
    if (isReadFilter === 'true') {
      where.isRead = true;
    } else if (isReadFilter === 'false') {
      where.isRead = false;
    }

    const total = await prisma.notification.count({ where });
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 获取未读数量
    const unreadCount = await prisma.notification.count({
      where: { isRead: false },
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST - 创建系统通知(仅管理员)
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CSRF 保护
    const csrfError = await withCsrfProtection(request);
    if (csrfError) return csrfError;

    const body = await request.json();
    const { title, message, type, link } = body;

    // 验证必填字段
    if (!title || !message || !type) {
      return NextResponse.json(
        { error: '标题、消息和类型均为必填项' },
        { status: 400 }
      );
    }

    // 验证类型
    const validTypes = ['feedback', 'schedule', 'content_expired', 'system'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: '无效的通知类型' },
        { status: 400 }
      );
    }

    // XSS 防护: 清洗用户输入
    const sanitizedTitle = sanitizeHtml(title, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();

    const sanitizedMessage = sanitizeHtml(message, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u'],
      allowedAttributes: {},
    }).trim();

    const sanitizedLink = link ? sanitizeHtml(link, { allowedTags: [], allowedAttributes: {} }).trim() : null;

    const notification = await prisma.notification.create({
      data: {
        title: sanitizedTitle,
        message: sanitizedMessage,
        type,
        link: sanitizedLink,
        isRead: false,
      },
    });

    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: '创建通知失败' }, { status: 500 });
  }
}
