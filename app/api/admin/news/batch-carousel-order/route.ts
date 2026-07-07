import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { withCsrfProtection } from '@/lib/csrf';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // 验证登录状态
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // CSRF 保护
    const csrfError = await withCsrfProtection(request);
    if (csrfError) return csrfError;

    const body = await request.json();
    const { items } = body;

    // 验证输入
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '参数错误' },
        { status: 400 }
      );
    }

    // 验证每个 item 的格式
    for (const item of items) {
      if (!item.id || item.carouselOrder === undefined || item.carouselOrder === null) {
        return NextResponse.json(
          { error: '参数格式错误，每个项目必须包含 id 和 carouselOrder' },
          { status: 400 }
        );
      }
    }

    // 使用事务批量更新轮播排序 - 优化 N+1 查询问题
    const result = await prisma.$transaction(
      items.map(item =>
        prisma.news.update({
          where: { id: item.id },
          data: {
            isCarousel: true,
            carouselOrder: item.carouselOrder,
          },
        })
      )
    );

    logger.info(`批量更新轮播排序成功: ${result.length} 条记录`);

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: result.length,
      },
    });
  } catch (error) {
    logger.error('批量更新轮播排序错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}
