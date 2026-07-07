import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminPermissions } from '@/lib/permission';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdminPermissions(request);
    if (!admin) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const newsId = params.id;

    // 获取审核日志
    const reviewLogs = await prisma.reviewLog.findMany({
      where: {
        contentType: 'news',
        contentId: newsId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: reviewLogs,
    });
  } catch (error) {
    logger.error('Error fetching review history:', error);
    return NextResponse.json({ error: '获取审核历史失败' }, { status: 500 });
  }
}
