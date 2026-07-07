import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { generateCsrfToken, setCsrfToken } from '@/lib/csrf';
import { apiErrorResponse, apiUnauthorizedError } from '@/lib/api-errors';

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return apiUnauthorizedError();
    }

    const token = generateCsrfToken();
    await setCsrfToken(token);

    // 根据请求协议判断是否使用 secure cookie
    // 注意：在 HTTP 环境下（如内网部署），secure 必须为 false
    const isSecure = request.headers.get('x-forwarded-proto') === 'https' || 
                     request.url?.startsWith('https://');

    const response = NextResponse.json({ token });
    response.cookies.set('csrf_token', token, {
      httpOnly: false, // 前端需要读取
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    });

    return response;
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/admin/csrf-token');
  }
}
