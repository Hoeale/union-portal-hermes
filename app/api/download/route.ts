import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

// GET - Serve file download with rate limiting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    const downloadName = searchParams.get('filename');

    if (!filePath) {
      return NextResponse.json(
        { error: '文件路径不能为空' },
        { status: 400 }
      );
    }

    // 安全检查：防止路径遍历攻击
    // 去掉开头的斜杠，避免 path.resolve 将其当作绝对路径处理
    const normalizedPath = path.normalize(filePath)
      .replace(/^([\/\\])+/, '')  // 去掉开头的斜杠
      .replace(/^(\.\.[\/\\])+/, ''); // 防止路径遍历
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    const fullPath = path.resolve(process.cwd(), 'public', normalizedPath);

    // 确保文件在 uploads 目录内
    if (!fullPath.startsWith(uploadsDir)) {
      return NextResponse.json(
        { error: '非法的文件路径' },
        { status: 403 }
      );
    }

    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: '文件不存在或已被删除' },
        { status: 404 }
      );
    }

    // 读取文件
    const fileBuffer = fs.readFileSync(fullPath);
    // 优先使用传入的原始文件名，否则使用磁盘上的文件名
    const fileName = downloadName || path.basename(fullPath);

    // 根据扩展名设置 Content-Type
    const ext = path.extname(fileName).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    // 返回文件
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}
