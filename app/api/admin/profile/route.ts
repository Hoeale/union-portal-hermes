import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiErrorResponse } from '@/lib/api-errors';

/**
 * GET /api/admin/profile
 * 获取当前登录用户的详细信息
 */
export async function GET(request: NextRequest) {
  try {
    // 获取当前登录用户
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { message: '未登录' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        username: admin.username,
        role: admin.role,
        createdAt: admin.createdAt,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/admin/profile');
  }
}
