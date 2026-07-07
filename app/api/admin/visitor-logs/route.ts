import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, parsePagination, createPaginationResponse } from '@/lib/api-helpers';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

// GET - 获取游客访问日志列表
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url') || '';
    const ip = searchParams.get('ip') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const pagination = parsePagination(request);

    const where: Prisma.PageViewWhereInput = {};

    if (url) {
      where.OR = [
        { url: { contains: url } },
        { title: { contains: url } },
      ];
    }

    if (ip) {
      where.ip = { contains: ip };
    }

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
      prisma.pageView.count({ where }),
      prisma.pageView.findMany({
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
    logger.error('Failed to fetch visitor logs:', error);
    return NextResponse.json({ error: 'Failed to fetch visitor logs' }, { status: 500 });
  }
});

// DELETE - 清理旧日志（90天前的日志）
export const DELETE = withAuth(async () => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deleted = await prisma.pageView.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    });

    return NextResponse.json({
      success: true,
      message: `成功清理 ${deleted.count} 条旧访问记录`,
    });
  } catch (error) {
    logger.error('Failed to clean old visitor logs:', error);
    return NextResponse.json({ error: 'Failed to clean old visitor logs' }, { status: 500 });
  }
});
