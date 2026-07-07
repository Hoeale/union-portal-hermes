import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * 统一 API 错误响应 - 服务器内部错误
 */
export function apiErrorResponse(error: unknown, context: string): NextResponse {
  logger.error(`${context}:`, error);
  return NextResponse.json(
    {
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    },
    { status: 500 }
  );
}

/**
 * 验证错误响应 - 400 Bad Request
 */
export function apiValidationError(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * 未授权错误响应 - 401 Unauthorized
 */
export function apiUnauthorizedError(): NextResponse {
  return NextResponse.json({ error: '未授权' }, { status: 401 });
}

/**
 * 资源不存在错误响应 - 404 Not Found
 */
export function apiNotFoundError(): NextResponse {
  return NextResponse.json({ error: '资源不存在' }, { status: 404 });
}
