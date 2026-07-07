import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, parsePagination, createPaginationResponse } from '@/lib/api-helpers';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

// GET - 获取操作日志列表
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const adminName = searchParams.get('adminName') || '';
    const moduleName = searchParams.get('module') || 'all';
    const action = searchParams.get('action') || 'all';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const pagination = parsePagination(request);

    const where: Prisma.OperationLogWhereInput = {};

    // 操作人搜索
    if (adminName) {
      where.adminName = { contains: adminName };
    }

    // 模块筛选
    if (moduleName !== 'all') {
      where.module = moduleName;
    }

    // 操作行为筛选
    if (action !== 'all') {
      where.action = action;
    }

    // 日期范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    const [total, logs] = await Promise.all([
      prisma.operationLog.count({ where }),
      prisma.operationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    return NextResponse.json({
      success: true,
      ...createPaginationResponse(logs, total, pagination),
    });
  } catch (error) {
    logger.error('Failed to fetch operation logs:', error);
    return NextResponse.json({ error: 'Failed to fetch operation logs' }, { status: 500 });
  }
});

// DELETE - 清理旧日志（90天前的日志）
export const DELETE = withAuth(async () => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deleted = await prisma.operationLog.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    });

    return NextResponse.json({
      success: true,
      message: `成功清理 ${deleted.count} 条旧日志`,
    });
  } catch (error) {
    logger.error('Failed to clean old logs:', error);
    return NextResponse.json({ error: 'Failed to clean old logs' }, { status: 500 });
  }
});
