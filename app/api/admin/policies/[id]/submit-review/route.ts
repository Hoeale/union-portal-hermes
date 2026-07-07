import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminPermissions, logReviewAction } from '@/lib/permission';
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

    const policyId = params.id;

    // 获取政策当前状态
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      return NextResponse.json({ error: '政策不存在' }, { status: 404 });
    }

    if (policy.status === 'published') {
      return NextResponse.json({ error: '已发布的政策无法提交审核' }, { status: 400 });
    }

    // 更新状态为待审核
    const updatedPolicy = await prisma.policy.update({
      where: { id: policyId },
      data: {
        status: 'pending',
      },
    });

    // 记录审核日志
    await logReviewAction(
      'policy',
      policyId,
      'submit',
      admin.username,
      '提交审核',
      'draft',
      'pending'
    );

    return NextResponse.json({
      success: true,
      data: updatedPolicy,
    });
  } catch (error) {
    logger.error('Error submitting policy for review:', error);
    return NextResponse.json({ error: '提交审核失败' }, { status: 500 });
  }
}
