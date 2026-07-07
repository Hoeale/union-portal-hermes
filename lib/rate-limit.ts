/**
 * API 速率限制中间件
 * 支持基于 IP 和用户 ID 的限流
 * 考虑多管理员并发场景
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitConfig {
  // 时间窗口（秒）
  windowMs: number;
  // 窗口内最大请求数
  maxRequests: number;
  // 管理员限制（更宽松）
  adminMaxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 内存存储（生产环境应使用 Redis）
const rateLimitStore = new Map<string, RateLimitEntry>();

// 默认配置 - 放宽限制以提升用户体验
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60, // 60秒窗口
  maxRequests: 200, // 普通用户每分钟200次（放宽）
  adminMaxRequests: 600, // 管理员每分钟600次（支持更多并发）
};

/**
 * 清理过期的限流记录
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * 获取客户端标识
 */
function getClientIdentifier(request: NextRequest): string {
  // 优先使用用户ID（从session中解析）
  const sessionCookie = request.cookies.get('admin_session');
  if (sessionCookie?.value) {
    try {
      const sessionData = sessionCookie.value.split('.')[0];
      const session = JSON.parse(Buffer.from(sessionData, 'base64').toString());
      if (session.userId) {
        return `user:${session.userId}`;
      }
    } catch {
      // 解析失败，回退到IP
    }
  }

  // 使用 IP + User-Agent 作为标识
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : request.ip || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  
  return `ip:${ip}:${userAgent.slice(0, 50)}`;
}

/**
 * 检查是否为管理员
 */
function isAdmin(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get('admin_session');
  return !!sessionCookie?.value;
}

/**
 * 速率限制检查
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetTime: number } {
  // 定期清理过期记录（每100次检查清理一次）
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  const identifier = getClientIdentifier(request);
  const isAdminUser = isAdmin(request);
  const maxRequests = isAdminUser ? config.adminMaxRequests : config.maxRequests;
  const now = Date.now();
  const windowMs = config.windowMs * 1000;

  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    // 新窗口或已过期
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(identifier, newEntry);
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // 检查是否超过限制
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // 增加计数
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * 创建速率限制响应
 */
export function createRateLimitResponse(
  resetTime: number,
  isAdmin: boolean
): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return NextResponse.json(
    {
      error: '请求过于频繁，请稍后再试',
      message: `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      retryAfter,
      isAdmin,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(isAdmin ? DEFAULT_CONFIG.adminMaxRequests : DEFAULT_CONFIG.maxRequests),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
      },
    }
  );
}

/**
 * 速率限制中间件
 */
export function rateLimitMiddleware(
  request: NextRequest,
  config?: RateLimitConfig
): NextResponse | null {
  // 跳过某些路径
  const { pathname } = request.nextUrl;
  
  // 静态资源和健康检查不限制
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/api/health' ||
    pathname === '/favicon.ico'
  ) {
    return null;
  }

  const result = checkRateLimit(request, config);

  if (!result.allowed) {
    return createRateLimitResponse(result.resetTime, isAdmin(request));
  }

  // 添加速率限制头到响应
  return null;
}

/**
 * 获取特定路径的限流配置
 */
export function getPathConfig(pathname: string): RateLimitConfig | undefined {
  // 登录接口限制（内部系统大幅放宽，依赖 login-lockout.ts 防爆破）
  if (pathname.includes('/api/admin/login')) {
    return {
      windowMs: 60, // 1分钟窗口（缩短）
      maxRequests: 500, // 普通用户每分钟500次（大幅放宽）
      adminMaxRequests: 1000, // 管理员每分钟1000次（支持多管理员并发）
    };
  }

  // 上传接口限制
  if (pathname.includes('/api/admin/upload')) {
    return {
      windowMs: 60,
      maxRequests: 10,
      adminMaxRequests: 50,
    };
  }

  // 导出接口限制
  if (pathname.includes('/export')) {
    return {
      windowMs: 60,
      maxRequests: 5,
      adminMaxRequests: 20,
    };
  }

  // 搜索接口限制
  if (pathname.includes('/search')) {
    return {
      windowMs: 60,
      maxRequests: 30,
      adminMaxRequests: 100,
    };
  }

  return undefined;
}

// 导出存储用于测试
export { rateLimitStore };
export type { RateLimitConfig, RateLimitEntry };
