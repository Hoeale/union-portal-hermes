import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { logger } from '@/lib/logger';

const MAX_VERSIONS = 50;

// POST - 将内容恢复到指定版本
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; vid: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  try {
    const contentId = params.id;
    const versionId = params.vid;

    // 获取要回滚到的版本
    const targetVersion = await prisma.contentVersion.findFirst({
      where: {
        id: versionId,
        contentType: 'news',
        contentId,
      },
    });

    if (!targetVersion) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 });
    }

    // 获取当前新闻
    const news = await prisma.news.findUnique({
      where: { id: contentId },
    });

    if (!news) {
      return NextResponse.json({ error: '新闻不存在' }, { status: 404 });
    }

    // 解析目标版本的快照
    let snapshotData: any;
    try {
      snapshotData = JSON.parse(targetVersion.snapshot);
    } catch (e) {
      return NextResponse.json(
        { error: '版本快照数据损坏' },
        { status: 500 }
      );
    }

    // 获取当前最大版本号
    const latestVersion = await prisma.contentVersion.findFirst({
      where: {
        contentType: 'news',
        contentId,
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const newVersion = (latestVersion?.version || 0) + 1;

    // 更新新闻内容
    await prisma.news.update({
      where: { id: contentId },
      data: {
        title: targetVersion.title,
        content: targetVersion.content,
        category: targetVersion.category || news.category,
        imageUrl: snapshotData.imageUrl || news.imageUrl,
        isCarousel: snapshotData.isCarousel ?? news.isCarousel,
        carouselOrder: snapshotData.carouselOrder ?? news.carouselOrder,
      },
    });

    // 创建回滚版本记录
    const rollbackVersion = await prisma.contentVersion.create({
      data: {
        contentType: 'news',
        contentId,
        version: newVersion,
        title: targetVersion.title,
        content: targetVersion.content,
        category: targetVersion.category,
        snapshot: targetVersion.snapshot,
        changeLog: `回滚到版本 ${targetVersion.version}: ${targetVersion.changeLog || ''}`,
        createdBy: 'admin',
      },
    });

    // 检查是否超过最大版本数
    const versionCount = await prisma.contentVersion.count({
      where: {
        contentType: 'news',
        contentId,
      },
    });

    if (versionCount >= MAX_VERSIONS) {
      const oldestVersion = await prisma.contentVersion.findFirst({
        where: {
          contentType: 'news',
          contentId,
        },
        orderBy: { version: 'asc' },
        select: { id: true },
      });

      if (oldestVersion) {
        await prisma.contentVersion.delete({
          where: { id: oldestVersion.id },
        });
      }
    }

    // 重新验证页面
    revalidatePath('/');
    revalidatePath('/news');
    revalidatePath('/admin/news');

    return NextResponse.json({
      success: true,
      data: {
        id: rollbackVersion.id,
        version: rollbackVersion.version,
        title: rollbackVersion.title,
        changeLog: rollbackVersion.changeLog,
        createdAt: rollbackVersion.createdAt.toISOString(),
      },
      message: `已成功回滚到版本 ${targetVersion.version}`,
    });
  } catch (error) {
    logger.error('Rollback version error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
