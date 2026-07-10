import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { withCsrfProtection } from '@/lib/csrf';
import { logger } from '@/lib/logger';
import { deleteCache, CACHE_KEYS } from '@/lib/cache';

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
    const { action, ids, data } = body;

    // 验证输入
    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: '参数错误' },
        { status: 400 }
      );
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // 批量操作 - 使用批量查询优化 N+1 问题
    switch (action) {
      case 'publish':
        // 批量发布 - 使用 updateMany 单次查询
        const publishResult = await prisma.news.updateMany({
          where: { id: { in: ids } },
          data: { status: 'published' },
        });
        successCount = publishResult.count;
        failCount = ids.length - publishResult.count;
        if (failCount > 0) {
          errors.push(`${failCount} 条新闻发布失败`);
        }
        break;

      case 'unpublish':
        // 批量下架 - 使用 updateMany 单次查询
        const unpublishResult = await prisma.news.updateMany({
          where: { id: { in: ids } },
          data: { status: 'pending' },
        });
        successCount = unpublishResult.count;
        failCount = ids.length - unpublishResult.count;
        if (failCount > 0) {
          errors.push(`${failCount} 条新闻下架失败`);
        }
        break;

      case 'delete':
        // 批量删除 - 使用 deleteMany 单次查询
        const deleteResult = await prisma.news.deleteMany({
          where: { id: { in: ids } },
        });
        successCount = deleteResult.count;
        failCount = ids.length - deleteResult.count;
        if (failCount > 0) {
          errors.push(`${failCount} 条新闻删除失败`);
        }
        break;

      case 'update_category':
        // 批量修改分类 - 使用 updateMany 单次查询
        if (!data?.category) {
          return NextResponse.json(
            { error: '请指定要修改的分类' },
            { status: 400 }
          );
        }
        const categoryResult = await prisma.news.updateMany({
          where: { id: { in: ids } },
          data: { category: data.category },
        });
        successCount = categoryResult.count;
        failCount = ids.length - categoryResult.count;
        if (failCount > 0) {
          errors.push(`${failCount} 条新闻分类修改失败`);
        }
        break;

      case 'set_carousel':
        // 批量设置轮播图 - 使用 updateMany 单次查询
        const setCarouselResult = await prisma.news.updateMany({
          where: { id: { in: ids } },
          data: { isCarousel: true },
        });
        successCount = setCarouselResult.count;
        failCount = ids.length - setCarouselResult.count;
        if (failCount > 0) {
          errors.push(`${failCount} 条新闻设置轮播失败`);
        }
        break;

      case 'unset_carousel':
        // 批量取消轮播图 - 使用 updateMany 单次查询
        const unsetCarouselResult = await prisma.news.updateMany({
          where: { id: { in: ids } },
          data: { isCarousel: false },
        });
        successCount = unsetCarouselResult.count;
        failCount = ids.length - unsetCarouselResult.count;
        if (failCount > 0) {
          errors.push(`${failCount} 条新闻取消轮播失败`);
        }
        break;

      default:
        return NextResponse.json(
          { error: '不支持的操作类型' },
          { status: 400 }
        );
    }

    // 清除仪表盘缓存
    await deleteCache(CACHE_KEYS.DASHBOARD);

    return NextResponse.json({
      success: true,
      data: {
        successCount,
        failCount,
        errors: errors.slice(0, 10), // 只返回前10个错误
      },
    });
  } catch (error) {
    logger.error('Batch action error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}
