import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 权限定义
export const PERMISSIONS = {
  // 新闻权限
  NEWS_CREATE: 'news:create',
  NEWS_EDIT: 'news:edit',
  NEWS_DELETE: 'news:delete',
  NEWS_PUBLISH: 'news:publish',
  NEWS_REVIEW: 'news:review',

  // 政策权限
  POLICY_CREATE: 'policy:create',
  POLICY_EDIT: 'policy:edit',
  POLICY_DELETE: 'policy:delete',
  POLICY_PUBLISH: 'policy:publish',
  POLICY_REVIEW: 'policy:review',

  // 视频权限
  VIDEO_CREATE: 'video:create',
  VIDEO_EDIT: 'video:edit',
  VIDEO_DELETE: 'video:delete',
  VIDEO_PUBLISH: 'video:publish',

  // 反馈权限
  FEEDBACK_VIEW: 'feedback:view',
  FEEDBACK_REPLY: 'feedback:reply',

  // 系统权限
  USER_MANAGE: 'user:manage',
  SYSTEM_CONFIG: 'system:config',
} as const;

// 角色权限映射
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    PERMISSIONS.NEWS_CREATE,
    PERMISSIONS.NEWS_EDIT,
    PERMISSIONS.NEWS_DELETE,
    PERMISSIONS.NEWS_PUBLISH,
    PERMISSIONS.NEWS_REVIEW,
    PERMISSIONS.POLICY_CREATE,
    PERMISSIONS.POLICY_EDIT,
    PERMISSIONS.POLICY_DELETE,
    PERMISSIONS.POLICY_PUBLISH,
    PERMISSIONS.POLICY_REVIEW,
    PERMISSIONS.VIDEO_CREATE,
    PERMISSIONS.VIDEO_EDIT,
    PERMISSIONS.VIDEO_DELETE,
    PERMISSIONS.VIDEO_PUBLISH,
    PERMISSIONS.FEEDBACK_VIEW,
    PERMISSIONS.FEEDBACK_REPLY,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.SYSTEM_CONFIG,
  ],
  editor: [
    PERMISSIONS.NEWS_CREATE,
    PERMISSIONS.NEWS_EDIT,
    PERMISSIONS.POLICY_CREATE,
    PERMISSIONS.POLICY_EDIT,
    PERMISSIONS.VIDEO_CREATE,
    PERMISSIONS.VIDEO_EDIT,
    PERMISSIONS.FEEDBACK_VIEW,
    PERMISSIONS.FEEDBACK_REPLY,
  ],
  reviewer: [
    PERMISSIONS.NEWS_REVIEW,
    PERMISSIONS.NEWS_PUBLISH,
    PERMISSIONS.POLICY_REVIEW,
    PERMISSIONS.POLICY_PUBLISH,
    PERMISSIONS.VIDEO_PUBLISH,
    PERMISSIONS.FEEDBACK_VIEW,
  ],
};

export interface AdminUser {
  id: string;
  username: string;
  role: string;
  permissions: string[];
}

/**
 * 获取当前管理员的权限
 * 从已验证签名的 session 中获取用户名，不信任客户端 cookie
 */
export async function getCurrentAdminPermissions(request: NextRequest): Promise<AdminUser | null> {
  try {
    // 从已验证的 session 中获取用户名（session 已通过 HMAC 签名验证）
    const { getAdminSession } = await import('@/lib/auth');
    const session = await getAdminSession();
    if (!session) return null;

    const admin = await prisma.admin.findUnique({
      where: { username: session.username },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) return null;

    // 根据角色获取权限（Admin 模型没有 permissions 字段）
    const permissions: string[] = ROLE_PERMISSIONS[admin.role] || []

    return {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      permissions,
    };
  } catch (error) {
    console.error('Error getting admin permissions:', error);
    return null;
  }
}

/**
 * 检查管理员是否有指定权限
 */
export function hasPermission(admin: AdminUser | null, permission: string): boolean {
  if (!admin) return false;

  // 管理员角色拥有所有权限
  if (admin.role === 'admin') return true;

  return admin.permissions.includes(permission);
}

/**
 * 权限检查中间件
 */
export function withPermission(handler: Function, permission: string) {
  return async function (request: NextRequest, ...args: any[]) {
    const admin = await getCurrentAdminPermissions(request);

    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (!hasPermission(admin, permission)) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 将管理员信息添加到request
    (request as any).admin = admin;
    return handler(request, ...args);
  };
}

/**
 * 记录审核日志
 */
export async function logReviewAction(
  contentType: string,
  contentId: string,
  action: string,
  reviewer: string,
  comment: string | null,
  statusBefore: string,
  statusAfter: string
) {
  try {
    await prisma.reviewLog.create({
      data: {
        contentType,
        contentId,
        action,
        reviewer,
        comment,
        statusBefore,
        statusAfter,
      },
    });
  } catch (error) {
    console.error('Error logging review action:', error);
  }
}
