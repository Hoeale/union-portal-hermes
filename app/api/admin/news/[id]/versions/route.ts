import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import { logger } from '@/lib/logger';

const MAX_VERSIONS = 50;

// GET - 获取某内容的所有版本列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  try {
    const contentId = params.id;

    const versions = await prisma.contentVersion.findMany({
      where: {
        contentType: 'news',
        contentId,
      },
      orderBy: {
        version: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: versions.map((v) => ({
        id: v.id,
        version: v.version,
        title: v.title,
        category: v.category,
        changeLog: v.changeLog,
        createdBy: v.createdBy,
        createdAt: v.createdAt.toISOString(),
      })),
      total: versions.length,
    });
  } catch (error) {
    logger.error('Get versions error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST - 手动保存当前版本
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  try {
    const contentId = params.id;
    const body = await request.json();
    const { changeLog, createdBy } = body;

    // 获取当前内容
    const news = await prisma.news.findUnique({
      where: { id: contentId },
    });

    if (!news) {
      return NextResponse.json({ error: '新闻不存在' }, { status: 404 });
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

    // 创建快照
    const snapshot = JSON.stringify({
      id: news.id,
      title: news.title,
      category: news.category,
      content: news.content,
      imageUrl: news.imageUrl,
      isCarousel: news.isCarousel,
      carouselOrder: news.carouselOrder,
      status: news.status,
      publishedAt: news.publishedAt,
    });

    // 检查是否超过最大版本数
    const versionCount = await prisma.contentVersion.count({
      where: {
        contentType: 'news',
        contentId,
      },
    });

    // 如果超过限制，删除最旧的版本
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

    // 创建新版本
    const version = await prisma.contentVersion.create({
      data: {
        contentType: 'news',
        contentId,
        version: newVersion,
        title: news.title,
        content: news.content,
        category: news.category,
        snapshot,
        changeLog: changeLog || `保存版本 ${newVersion}`,
        createdBy: createdBy || 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: version.id,
        version: version.version,
        title: version.title,
        changeLog: version.changeLog,
        createdBy: version.createdBy,
        createdAt: version.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Save version error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
