import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { withCsrfProtection } from '@/lib/csrf';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // CSRF 保护
    const csrfError = await withCsrfProtection(request);
    if (csrfError) return csrfError;

    const body = await request.json();
    const { action, ids, data } = body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    switch (action) {
      case 'publish':
        for (const id of ids) {
          try {
            await prisma.policy.update({ where: { id }, data: { status: 'published' } });
            successCount++;
          } catch { failCount++; errors.push(`发布失败: ID ${id}`); }
        }
        break;

      case 'unpublish':
        for (const id of ids) {
          try {
            await prisma.policy.update({ where: { id }, data: { status: 'pending' } });
            successCount++;
          } catch { failCount++; errors.push(`下架失败: ID ${id}`); }
        }
        break;

      case 'delete':
        for (const id of ids) {
          try {
            await prisma.policy.delete({ where: { id } });
            successCount++;
          } catch { failCount++; errors.push(`删除失败: ID ${id}`); }
        }
        break;

      case 'update_category':
        if (!data?.category) {
          return NextResponse.json({ error: '请指定要修改的分类' }, { status: 400 });
        }
        for (const id of ids) {
          try {
            await prisma.policy.update({ where: { id }, data: { category: data.category } });
            successCount++;
          } catch { failCount++; errors.push(`修改分类失败: ID ${id}`); }
        }
        break;

      default:
        return NextResponse.json({ error: '不支持的操作类型' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { successCount, failCount, errors: errors.slice(0, 10) },
    });
  } catch (error) {
    logger.error('Batch action error:', error);
    return NextResponse.json({ error: '服务器错误，请重试' }, { status: 500 });
  }
}
