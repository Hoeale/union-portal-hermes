import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminPermissions, hasPermission, logReviewAction, PERMISSIONS } from '@/lib/permission';
import { logger } from '@/lib/logger';

// 获取审核开关状态
async function isReviewEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'review_enabled' },
    });
    if (!setting) return false;
    return setting.value === 'true' || setting.value === '1';
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查审核功能是否开启
    if (!await isReviewEnabled()) {
      return NextResponse.json({ error: '审核功能未开启' }, { status: 403 });
    }

    const admin = await getCurrentAdminPermissions(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 检查审核权限
    if (!hasPermission(admin, PERMISSIONS.POLICY_REVIEW)) {
      return NextResponse.json({ error: '无审核权限' }, { status: 403 });
    }

    const policyId = params.id;
    const body = await request.json();
    const { action, comment } = body; // action: approve, reject, request_changes

    // 验证 action
    if (!['approve', 'reject', 'request_changes'].includes(action)) {
      return NextResponse.json({ error: '无效的审核操作' }, { status: 400 });
    }

    // 获取政策当前状态
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      return NextResponse.json({ error: '政策不存在' }, { status: 404 });
    }

    if (policy.status !== 'pending') {
      return NextResponse.json({ error: '只能审核待审核状态的政策' }, { status: 400 });
    }

    // 根据审核操作更新状态
    let newStatus: string;
    switch (action) {
      case 'approve':
        newStatus = 'published';
        break;
      case 'reject':
        newStatus = 'pending';
        break;
      case 'request_changes':
        newStatus = 'pending';
        break;
      default:
        newStatus = 'pending';
    }

    // 更新政策状态
    const updatedPolicy = await prisma.policy.update({
      where: { id: policyId },
      data: {
        status: newStatus as any,
      },
    });

    // 记录审核日志
    await logReviewAction(
      'policy',
      policyId,
      action,
      admin.username,
      comment,
      'pending',
      newStatus
    );

    // 通知提交人
    await import('@/lib/notification-service').then(({ createNotification }) => {
      createNotification(
        'system',
        action === 'approve' ? '审核通过' : action === 'reject' ? '审核驳回' : '需要修改',
        `您的政策 "${policy.title}" ${action === 'approve' ? '已通过审核并发布' : action === 'reject' ? '未通过审核' : '需要修改后重新提交'}${comment ? `。审核意见：${comment}` : ''}`,
        `/admin/policies/${policyId}/edit`
      );
    });

    return NextResponse.json({
      success: true,
      data: updatedPolicy,
      message: action === 'approve' ? '审核通过并发布' : action === 'reject' ? '审核驳回' : '已退回修改',
    });
  } catch (error) {
    logger.error('Error reviewing policy:', error);
    return NextResponse.json({ error: '审核失败' }, { status: 500 });
  }
}
