import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 允许的视频MIME类型
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
];

// 最大文件大小：100MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // 验证身份
    const isAuthed = await isAuthenticated();
    if (!isAuthed) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '没有上传文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '只支持 MP4、WebM、OGG 格式的视频' },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: '视频大小不能超过 100MB' },
        { status: 400 }
      );
    }

    // 创建 uploads/videos 目录
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'videos');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const originalName = file.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5.-]/g, '_');
    const filename = `${timestamp}-${randomString}-${originalName}`;
    const filepath = join(uploadsDir, filename);

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // 返回公开URL
    const url = `/uploads/videos/${filename}`;

    // 注册到媒体库
    try {
      await prisma.media.create({
        data: {
          type: 'video',
          title: file.name,
          url,
          fileSize: file.size,
          mimeType: file.type,
          category: '视频文件',
        },
      });
    } catch (dbError) {
      console.error('Failed to register video to media library:', dbError);
    }

    return NextResponse.json({
      success: true,
      url,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: '视频上传失败，请重试' },
      { status: 500 }
    );
  }
}
