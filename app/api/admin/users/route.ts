import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated, getAdminSession } from '@/lib/auth';
import { withCsrfProtection } from '@/lib/csrf';
import { logOperation } from '@/lib/operation-logger';

// 获取用户列表 (所有管理员可查看)
export async function GET(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // GET 请求不需要 CSRF 验证（与 middleware 设计一致）

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * pageSize;

    const where: any = {
      isActive: true, // 只显示启用的用户
    };
    
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { nickname: { contains: search } },
      ];
    }

    const [admins, total] = await Promise.all([
      prisma.admin.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          role: true,
          nickname: true,
          avatar: true,
          bio: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.admin.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: admins,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
  }
}

// 创建新用户 (仅 super_admin)
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 验证是否为超级管理员（role为super_admin或用户名为admin）
  const session = await getAdminSession();
  const isSuperAdmin = session?.role === 'super_admin' || session?.username === 'admin';
  if (!isSuperAdmin) {
    return NextResponse.json({ error: '权限不足，仅超级管理员可操作' }, { status: 403 });
  }

  const csrfError = await withCsrfProtection(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const { username, password, role, nickname, bio } = body;

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    // 验证用户名格式
    if (username.length < 3 || username.length > 50) {
      return NextResponse.json({ error: '用户名长度必须在3-50个字符之间' }, { status: 400 });
    }

    // 验证密码强度
    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 });
    }

    // 检查用户名是否已存在
    const existing = await prisma.admin.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
    }

    // 密码加密
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // 强制设置为普通管理员，禁止创建超级管理员
    const admin = await prisma.admin.create({
      data: {
        username,
        passwordHash,
        role: 'admin', // 强制为普通管理员
        nickname,
        bio,
      },
      select: {
        id: true,
        username: true,
        role: true,
        nickname: true,
        createdAt: true,
      },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'users',
      action: 'create',
      targetId: admin.id,
      targetType: 'admin',
      targetTitle: username,
      details: { role },
      source: 'admin_panel',
    });

    return NextResponse.json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: '创建管理员失败' }, { status: 500 });
  }
}
