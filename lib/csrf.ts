import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_TOKEN_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * 生成 CSRF token - 使用 Edge Runtime 兼容的 Web Crypto API
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 设置 CSRF token cookie
 */
export async function setCsrfToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_TOKEN_COOKIE_NAME, token, {
    httpOnly: false, // 前端需要读取
    secure: false,
    sameSite: 'lax',
    maxAge: 3600, // 1 小时
    path: '/',
  });
}

/**
 * 获取 CSRF token cookie
 */
export async function getCsrfToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CSRF_TOKEN_COOKIE_NAME);
  return token?.value;
}

/**
 * 验证 CSRF token（使用 timingSafeEqual 防止时序攻击）
 */
export async function verifyCsrfToken(request: NextRequest): Promise<boolean> {
  const cookieToken = await getCsrfToken();
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // 简单的字符串比较（Edge Runtime 不支持 crypto.timingSafeEqual 和 Buffer）
  // 长度不同直接返回 false
  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  // 使用固定时间比较防止时序攻击
  let result = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }
  return result === 0;
}

/**
 * CSRF 保护中间件
 * [DEV MODE] 开发阶段暂时跳过 CSRF 验证，部署生产前恢复
 */
export async function withCsrfProtection(
  request: NextRequest
): Promise<NextResponse | null> {
  // [DEV MODE] 暂时跳过验证，生产环境请注释掉此行并取消下方注释
  return null;

  // const isValid = await verifyCsrfToken(request);
  // if (!isValid) {
  //   return NextResponse.json(
  //     { error: 'CSRF token 验证失败' },
  //     { status: 403 }
  //   );
  // }
  // return null;
}
