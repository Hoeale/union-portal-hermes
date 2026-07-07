import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, signSession } from '@/lib/auth';
import { generateCsrfToken } from '@/lib/csrf';
import { logLogin } from '@/lib/login-logger';
import { prisma } from '@/lib/prisma';
import {
  isAccountLocked,
  recordFailedAttempt,
  clearFailedAttempts,
  createLockoutResponse,
} from '@/lib/login-lockout';

const SESSION_DURATION = 24 * 60 * 60; // 24 hours in seconds

export async function POST(request: NextRequest) {
  try {
    // 检查账户是否被锁定
    const lockStatus = isAccountLocked(request);
    if (lockStatus.locked) {
      return NextResponse.json(
        createLockoutResponse(lockStatus.remainingTime!),
        { 
          status: 429, 
          headers: { 
            'Retry-After': String(lockStatus.remainingTime),
            'X-RateLimit-Remaining': '0',
          } 
        }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      await logLogin({
        request,
        username: username || 'unknown',
        loginType: 'failed',
        failureReason: '用户名或密码为空',
      });
      
      // 记录失败尝试
      const failResult = recordFailedAttempt(request);
      
      return NextResponse.json(
        { 
          error: '用户名和密码不能为空',
          attemptsRemaining: failResult.attemptsRemaining,
        },
        { status: 400 }
      );
    }

    // Verify credentials
    const session = await verifyAdmin(username, password);

    if (!session) {
      await logLogin({
        request,
        username,
        loginType: 'failed',
        failureReason: '用户名或密码错误',
      });
      
      // 记录失败尝试
      const failResult = recordFailedAttempt(request);
      
      if (failResult.locked) {
        return NextResponse.json(
          createLockoutResponse(failResult.remainingTime!),
          { 
            status: 429, 
            headers: { 
              'Retry-After': String(failResult.remainingTime),
              'X-RateLimit-Remaining': '0',
            } 
          }
        );
      }

      return NextResponse.json(
        { 
          error: '用户名或密码错误',
          attemptsRemaining: failResult.attemptsRemaining,
        },
        { status: 401 }
      );
    }

    // 登录成功，清除失败记录
    clearFailedAttempts(request);

    // 更新最后登录时间
    await prisma.admin.update({
      where: { id: session.adminId },
      data: { lastLoginAt: new Date() },
    });

    // 记录登录成功日志
    await logLogin({
      request,
      username,
      adminId: session.adminId,
      loginType: 'success',
    });

    // 生成 CSRF token
    const csrfToken = generateCsrfToken();

    // 创建带签名的 session token
    const sessionData = JSON.stringify(session);
    const signedToken = signSession(sessionData);

    // 创建响应
    const response = NextResponse.json({
      success: true,
      data: {
        username: session.username,
      },
    });

    // 根据请求实际协议判断是否使用 secure cookie
    // 站点通过 HTTP 访问时（无 x-forwarded-proto: https），不能用 Secure 标志，否则浏览器会拒绝设置 cookie
    const isSecure = request.headers.get('x-forwarded-proto') === 'https';

    // 直接在 response 上设置 cookies
    response.cookies.set('admin_session', signedToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24小时
      path: '/',
    });

    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: false,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}
