import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-errors';

/**
 * GET /api/admin/check-auth
 * 检查当前用户是否已登录
 * 供前端页面使用
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    
    if (session) {
      return NextResponse.json({
        authenticated: true,
        admin: {
          id: session.adminId,
          username: session.username,
          role: session.role || 'admin',
        },
      });
    } else {
      return NextResponse.json(
        {
          authenticated: false,
          message: '未登录',
        },
        { status: 401 }
      );
    }
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/admin/check-auth');
  }
}
