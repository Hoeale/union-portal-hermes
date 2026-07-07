import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated, getAdminSession } from '@/lib/auth';
import { withCsrfProtection } from '@/lib/csrf';
import { logOperation } from '@/lib/operation-logger';

// 获取管理员详情、更新、删除
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { id: params.id },
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
    });

    if (!admin) {
      return NextResponse.json({ error: '管理员不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error('Error fetching admin:', error);
    return NextResponse.json({ error: '获取管理员信息失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { nickname, avatar, bio, isActive } = body;

    // 验证是否存在
    const existing = await prisma.admin.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: '管理员不存在' }, { status: 404 });
    }

    // 防止修改自己
    if (session?.adminId === params.id) {
      return NextResponse.json({ error: '不能修改自己的信息' }, { status: 400 });
    }

    // 更新管理员
    const admin = await prisma.admin.update({
      where: { id: params.id },
      data: {
        nickname,
        avatar,
        bio,
        isActive,
      },
      select: {
        id: true,
        username: true,
        role: true,
        nickname: true,
        isActive: true,
      },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'users',
      action: 'update',
      targetId: params.id,
      targetType: 'admin',
      targetTitle: existing.username,
      details: { nickname, isActive },
      source: 'admin_panel',
    });

    return NextResponse.json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ error: '更新管理员失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const session = await getAdminSession();

    // 防止删除自己
    if (session?.adminId === params.id) {
      return NextResponse.json({ error: '不能删除自己' }, { status: 400 });
    }

    // 软删除
    await prisma.admin.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'users',
      action: 'delete',
      targetId: params.id,
      targetType: 'admin',
      targetTitle: 'admin',
      source: 'admin_panel',
    });

    return NextResponse.json({
      success: true,
      message: '管理员已删除',
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ error: '删除管理员失败' }, { status: 500 });
  }
}
