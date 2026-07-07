import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

// POST - 发布草稿
export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: '草稿 ID 不能为空' }, { status: 400 });
    }

    // 读取草稿
    const draft = await prisma.draft.findUnique({ where: { id } });
    if (!draft) {
      return NextResponse.json({ error: '草稿不存在' }, { status: 404 });
    }

    // 事务：写入目标表 + 删除草稿
    await prisma.$transaction(async (tx) => {
      if (draft.type === 'news') {
        await tx.news.create({
          data: {
            title: draft.title,
            category: draft.category,
            content: draft.content,
            imageUrl: draft.imageUrl,
            publishedAt: new Date(),
            isCarousel: false,
            status: 'pending', // 草稿发布后默认为待发布
          },
        });
      } else if (draft.type === 'policy') {
        await tx.policy.create({
          data: {
            title: draft.title,
            category: draft.category,
            content: draft.content,
            fileUrl: draft.fileUrl,
            source: draft.source || '',
            publishDate: draft.publishDate || new Date().toISOString().split('T')[0],
            isActive: true,
            orderIndex: 0,
            status: 'pending', // 草稿发布后默认为待发布
          },
        });
      }

      // 删除草稿
      await tx.draft.delete({ where: { id } });
    });

    // 重新验证相关页面
    revalidatePath('/');
    revalidatePath('/news');
    revalidatePath('/policies');

    return NextResponse.json({ success: true, message: '发布成功' });
  } catch (error) {
    logger.error('Error publishing draft:', error);
    return NextResponse.json({ error: '发布失败' }, { status: 500 });
  }
}
