import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { isAuthenticated } from '@/lib/auth';
import { withCsrfProtection } from '@/lib/csrf';
import { performSecurityCheck, sanitizeFileName, ALLOWED_FILE_TYPES } from '@/lib/file-security';
import { prisma } from '@/lib/prisma';

// 文件类型到目录的映射
const TYPE_TO_DIR = {
  image: 'uploads',
  policy: 'uploads/policies',
  service: 'uploads/services',
};

// 文件类型到媒体分类的映射
const TYPE_TO_CATEGORY = {
  image: '新闻配图',
  policy: '政策附件',
  service: '服务图片',
};

// 文件大小限制（字节）
const MAX_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  document: 100 * 1024 * 1024, // 100MB
};

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // CSRF 保护
  const csrfError = await withCsrfProtection(request);
  if (csrfError) return csrfError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'image';

    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 });
    }

    // 清理原始文件名
    const originalName = sanitizeFileName(file.name);

    // 根据 type 确定存储目录
    const uploadDir = TYPE_TO_DIR[type as keyof typeof TYPE_TO_DIR] || TYPE_TO_DIR.image;
    const fullUploadDir = join(process.cwd(), 'public', uploadDir);

    // 创建目录
    if (!existsSync(fullUploadDir)) {
      await mkdir(fullUploadDir, { recursive: true });
    }

    // 确定允许的文件类型
    const isImage = file.type.startsWith('image/');
    const allowedTypes = type === 'image' 
      ? Object.keys(ALLOWED_FILE_TYPES).filter(t => t.startsWith('image/'))
      : Object.keys(ALLOWED_FILE_TYPES);

    // 临时文件路径（用于安全扫描）
    const tempFileName = `temp-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const tempFilePath = join(fullUploadDir, tempFileName);

    try {
      // 先写入临时文件进行安全扫描
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(tempFilePath, buffer);

      // 执行完整的安全检查
      const securityCheck = await performSecurityCheck(
        file,
        tempFilePath,
        {
          allowedTypes,
          maxSize: isImage ? MAX_SIZES.image : MAX_SIZES.document,
          scanContent: true,
        }
      );

      if (!securityCheck.success) {
        // 删除临时文件
        await import('fs/promises').then(fs => fs.unlink(tempFilePath).catch(() => {}));
        return NextResponse.json(
          { error: securityCheck.error },
          { status: 400 }
        );
      }

      // 使用安全生成的文件名
      const filename = securityCheck.safeFileName!;
      const filepath = join(fullUploadDir, filename);

      // 重命名为最终文件名
      await import('fs/promises').then(fs => fs.rename(tempFilePath, filepath));

      // 返回公共 URL
      const url = `/${uploadDir}/${filename}`;

      // 注册到媒体库
      try {
        const mediaType = file.type.startsWith('image/') ? 'image'
          : file.type.startsWith('video/') ? 'video'
          : file.type.startsWith('audio/') ? 'audio'
          : 'document';
        await prisma.media.create({
          data: {
            type: mediaType,
            title: originalName,
            url,
            fileSize: file.size,
            mimeType: file.type,
            category: TYPE_TO_CATEGORY[type as keyof typeof TYPE_TO_CATEGORY] || null,
          },
        });
      } catch (dbError) {
        console.error('Failed to register media:', dbError);
      }

      return NextResponse.json({
        success: true,
        url,
        filename: originalName,
        size: file.size,
        type: file.type,
      });
    } catch (error) {
      // 清理临时文件
      await import('fs/promises').then(fs => fs.unlink(tempFilePath).catch(() => {}));
      throw error;
    }
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : '上传失败，请重试';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
