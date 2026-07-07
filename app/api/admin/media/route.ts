import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { logOperation } from '@/lib/operation-logger';

// 获取媒体列表
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [total, media] = await Promise.all([
      prisma.media.count({ where }),
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: media,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Get media error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 上传媒体（支持 JSON 和 FormData 两种方式）
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let type: string;
    let title: string;
    let url: string;
    let thumbnailUrl: string | null = null;
    let fileSize: number;
    let mimeType: string;
    let width: number | null = null;
    let height: number | null = null;
    let tags: string[] | null = null;
    let category: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      // FormData 方式（文件上传）
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const titleFromForm = formData.get('title') as string;

      if (!file) {
        return NextResponse.json({ error: '没有上传文件' }, { status: 400 });
      }

      // 确定媒体类型
      type = file.type.startsWith('image/') ? 'image'
        : file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio'
        : 'document';

      title = titleFromForm || file.name;
      fileSize = file.size;
      mimeType = file.type;

      // 保存文件到 uploads 目录
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'media');
      await mkdir(uploadDir, { recursive: true });

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const ext = file.name.split('.').pop() || 'bin';
      const filename = `${timestamp}-${randomString}.${ext}`;
      const filepath = join(uploadDir, filename);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      url = `/uploads/media/${filename}`;
    } else {
      // JSON 方式（外部链接）
      const body = await request.json();
      type = body.type;
      title = body.title;
      url = body.url;
      thumbnailUrl = body.thumbnailUrl || null;
      fileSize = body.fileSize || 0;
      mimeType = body.mimeType;
      width = body.width || null;
      height = body.height || null;
      tags = body.tags || null;
      category = body.category || null;

      if (!type || !title || !url || !mimeType) {
        return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
      }
    }

    const media = await prisma.media.create({
      data: {
        type,
        title,
        url,
        thumbnailUrl,
        fileSize: fileSize || 0,
        mimeType,
        width,
        height,
        tags: tags ? JSON.stringify(tags) : null,
        category,
      },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'media',
      action: 'upload',
      targetId: media.id,
      targetType: 'media',
      targetTitle: title,
    });

    return NextResponse.json({ success: true, data: media });
  } catch (error) {
    console.error('Create media error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 批量删除媒体
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: '请指定要删除的媒体ID' }, { status: 400 });
    }

    const idList = ids.split(',');

    // 获取旧数据用于日志
    const oldMedia = await prisma.media.findMany({
      where: { id: { in: idList } },
    });

    await prisma.media.deleteMany({
      where: { id: { in: idList } },
    });

    // 同时删除引用关系
    await prisma.mediaReference.deleteMany({
      where: { mediaId: { in: idList } },
    });

    // 记录操作日志
    for (const media of oldMedia) {
      await logOperation({
        request,
        module: 'media',
        action: 'delete',
        targetId: media.id,
        targetType: 'media',
        targetTitle: media.title,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete media error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
