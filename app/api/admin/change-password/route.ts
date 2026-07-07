import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/change-password
 * 修改当前登录用户的密码
 */
export async function POST(request: NextRequest) {
  try {
    // 获取当前登录用户
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { message: '未登录' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // 验证必填字段
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: '当前密码和新密码不能为空' },
        { status: 400 }
      );
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: '新密码长度不能少于6位' },
        { status: 400 }
      );
    }

    // 获取用户信息
    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: {
        id: true,
        username: true,
        passwordHash: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      );
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { message: '当前密码错误' },
        { status: 400 }
      );
    }

    // 新密码不能与旧密码相同
    const isSamePassword = await bcrypt.compare(newPassword, admin.passwordHash);
    if (isSamePassword) {
      return NextResponse.json(
        { message: '新密码不能与当前密码相同' },
        { status: 400 }
      );
    }

    // 生成新密码哈希
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    // 记录操作日志
    await prisma.operationLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.username,
        module: 'settings',
        action: 'update',
        targetType: 'admin',
        targetTitle: '修改密码',
        details: JSON.stringify({ action: 'change_password' }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { message: '密码修改失败，请稍后重试' },
      { status: 500 }
    );
  }
}
