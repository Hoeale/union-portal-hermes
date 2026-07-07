import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSession, getAdminSession } from '@/lib/auth';
import { logLogin } from '@/lib/login-logger';
import { apiErrorResponse } from '@/lib/api-errors';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // 获取当前 session 信息用于日志记录
    const session = await getAdminSession();

    // 记录登出日志
    try {
      await logLogin({
        request,
        username: session?.username || 'unknown',
        adminId: session?.adminId,
        loginType: 'success',
      });
    } catch (error) {
      // 日志记录失败不影响登出
      logger.error('Failed to log logout:', error);
    }

    // Clear session cookie
    await clearAdminSession();

    // 根据请求实际协议判断是否使用 secure cookie
    const isSecure = request.headers.get('x-forwarded-proto') === 'https';

    // 返回 JSON 响应，由前端处理跳转
    const response = NextResponse.json({
      success: true,
      message: '退出登录成功',
    });
    
    // 清除 cookie
    response.cookies.set('admin_session', '', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      expires: new Date(0),
    });
    response.cookies.set('csrf_token', '', {
      httpOnly: false,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    return apiErrorResponse(error, 'POST /api/admin/logout');
  }
}
