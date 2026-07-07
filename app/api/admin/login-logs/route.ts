import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, parsePagination, createPaginationResponse } from '@/lib/api-helpers';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

// GET - 获取登录日志列表
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || '';
    const loginType = searchParams.get('loginType') || 'all';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const pagination = parsePagination(request);

    const where: Prisma.LoginLogWhereInput = {};

    if (username) {
      where.username = { contains: username };
    }

    if (loginType !== 'all') {
      where.loginType = loginType;
    }

    if (startDate || endDate) {
      where.loginAt = {};
      if (startDate) {
        where.loginAt.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.loginAt.lte = endDateTime;
      }
    }

    const [total, logs] = await Promise.all([
      prisma.loginLog.count({ where }),
      prisma.loginLog.findMany({
        where,
        orderBy: { loginAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    return NextResponse.json({
      success: true,
      ...createPaginationResponse(logs, total, pagination),
    });
  } catch (error) {
    logger.error('Failed to fetch login logs:', error);
    return NextResponse.json({ error: 'Failed to fetch login logs' }, { status: 500 });
  }
});

// DELETE - 清理旧日志（90天前的日志）
export const DELETE = withAuth(async () => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deleted = await prisma.loginLog.deleteMany({
      where: { loginAt: { lt: ninetyDaysAgo } },
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
