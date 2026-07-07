import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import { logger } from '@/lib/logger';

// GET - 获取指定版本的详细内容
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; vid: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  try {
    const contentId = params.id;
    const versionId = params.vid;

    const version = await prisma.contentVersion.findFirst({
      where: {
        id: versionId,
        contentType: 'news',
        contentId,
      },
    });

    if (!version) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 });
    }

    // 解析快照获取完整数据
    let snapshotData = {};
    try {
      snapshotData = JSON.parse(version.snapshot);
    } catch (e) {
      logger.error('Parse snapshot error:', e);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: version.id,
        version: version.version,
        title: version.title,
        content: version.content,
        category: version.category,
        changeLog: version.changeLog,
        createdBy: version.createdBy,
        createdAt: version.createdAt.toISOString(),
        snapshot: snapshotData,
      },
    });
  } catch (error) {
    logger.error('Get version detail error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE - 删除指定版本
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; vid: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  try {
    const contentId = params.id;
    const versionId = params.vid;

    const version = await prisma.contentVersion.findFirst({
      where: {
        id: versionId,
        contentType: 'news',
        contentId,
      },
    });

    if (!version) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 });
    }

    await prisma.contentVersion.delete({
      where: { id: versionId },
    });

    return NextResponse.json({
      success: true,
      message: '版本已删除',
    });
  } catch (error) {
    logger.error('Delete version error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
