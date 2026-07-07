import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getAdminSession, AdminSession } from './auth';

/**
 * API 路由处理函数类型
 */
type RouteHandler = (request: NextRequest, context?: RouteContext) => Promise<NextResponse>;

/**
 * 路由上下文，包含认证信息
 */
export interface RouteContext {
  session: AdminSession;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

/**
 * 分页响应
 */
export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 认证包装器 - 简化 API 路由中的认证代码
 * 
 * @example
 * export const GET = withAuth(async (request, { session }) => {
 *   // session 已经验证，可以直接使用
 *   return NextResponse.json({ adminId: session.adminId });
 * });
 */
export function withAuth(handler: RouteHandler): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(request, { session });
  };
}

/**
 * 从请求 URL 解析分页参数
 */
export function parsePagination(request: NextRequest, defaultPageSize = 20): PaginationParams {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || String(defaultPageSize))));
  
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

/**
 * 创建分页响应
 */
export function createPaginationResponse<T>(
  data: T[],
  total: number,
  pagination: PaginationParams
): PaginationResponse<T> {
  return {
    data,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
}

/**
 * 统一的错误处理包装器
 */
export function withErrorHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
  errorMessage = 'Internal server error'
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  };
}
