import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { getAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 文件扩展名到媒体类型的映射
const EXT_TO_TYPE: Record<string, string> = {
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.gif': 'image',
  '.webp': 'image',
  '.svg': 'image',
  '.mp4': 'video',
  '.webm': 'video',
  '.ogg': 'video',
  '.mov': 'video',
  '.mp3': 'audio',
  '.wav': 'audio',
  '.pdf': 'document',
  '.doc': 'document',
  '.docx': 'document',
  '.xls': 'document',
  '.xlsx': 'document',
};

// MIME 类型映射
const EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

// 目录到分类的映射
const DIR_TO_CATEGORY: Record<string, string> = {
  'workers': '劳动者图片',
  'videos': '视频文件',
  'policies': '政策附件',
  'services': '服务图片',
  'media': '媒体上传',
};

// 扫描目录并返回文件列表
async function scanDirectory(dir: string, baseUrl: string, category: string | null): Promise<Array<{
  url: string;
  title: string;
  type: string;
  mimeType: string;
  fileSize: number;
  category: string | null;
}>> {
  const results: Array<{
    url: string;
    title: string;
    type: string;
    mimeType: string;
    fileSize: number;
    category: string | null;
  }> = [];

  try {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const ext = extname(entry).toLowerCase();
      const mediaType = EXT_TO_TYPE[ext];
      
      if (!mediaType) continue; // 跳过不支持的文件类型
      
      try {
        const stats = await stat(fullPath);
        
        results.push({
          url: `${baseUrl}/${entry}`,
          title: entry,
          type: mediaType,
          mimeType: EXT_TO_MIME[ext] || 'application/octet-stream',
          fileSize: stats.size,
          category,
        });
      } catch (err) {
        // 跳过无法访问的文件
        console.warn(`Cannot access file: ${fullPath}`);
      }
    }
  } catch (err) {
    // 目录不存在，跳过
  }

  return results;
}

// POST: 同步媒体库 - 扫描 uploads 目录并补充缺失的媒体记录
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const uploadsBase = join(process.cwd(), 'public', 'uploads');
    
    // 获取数据库中已有的所有 URL
    const existingMedia = await prisma.media.findMany({
      select: { url: true },
    });
    const existingUrls = new Set(existingMedia.map(m => m.url));

    // 扫描各个上传目录
    const allFiles: Array<{
      url: string;
      title: string;
      type: string;
      mimeType: string;
      fileSize: number;
      category: string | null;
    }> = [];

    // 扫描主 uploads 目录（新闻配图等）
    const mainFiles = await scanDirectory(uploadsBase, '/uploads', '新闻配图');
    allFiles.push(...mainFiles);

    // 扫描子目录
    const subDirs = ['workers', 'videos', 'policies', 'services', 'media'];
    for (const subDir of subDirs) {
      const dirPath = join(uploadsBase, subDir);
      const category = DIR_TO_CATEGORY[subDir] || null;
      const files = await scanDirectory(dirPath, `/uploads/${subDir}`, category);
      allFiles.push(...files);
    }

    // 过滤出不在数据库中的文件
    const newFiles = allFiles.filter(f => !existingUrls.has(f.url));

    // 批量创建媒体记录
    let created = 0;
    if (newFiles.length > 0) {
      // 分批处理，每批 50 条
      const batchSize = 50;
      for (let i = 0; i < newFiles.length; i += batchSize) {
        const batch = newFiles.slice(i, i + batchSize);
        
        await prisma.media.createMany({
          data: batch.map(f => ({
            type: f.type,
            title: f.title,
            url: f.url,
            fileSize: f.fileSize,
            mimeType: f.mimeType,
            category: f.category,
          })),
          skipDuplicates: true,
        });
        
        created += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      totalScanned: allFiles.length,
      existingRecords: existingUrls.size,
      newRecords: created,
      message: created > 0 
        ? `同步完成：扫描 ${allFiles.length} 个文件，新增 ${created} 条记录`
        : `同步完成：扫描 ${allFiles.length} 个文件，无需新增记录`,
    });
  } catch (error) {
    console.error('Media sync error:', error);
    return NextResponse.json({ error: '同步失败' }, { status: 500 });
  }
}

// GET: 获取同步状态（不执行同步，只统计）
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const uploadsBase = join(process.cwd(), 'public', 'uploads');
    
    // 获取数据库中已有的记录数
    const existingCount = await prisma.media.count();

    // 扫描各个上传目录统计文件数
    const mainFiles = await scanDirectory(uploadsBase, '/uploads', '新闻配图');
    let totalFiles = mainFiles.length;

    const subDirs = ['workers', 'videos', 'policies', 'services', 'media'];
    for (const subDir of subDirs) {
      const dirPath = join(uploadsBase, subDir);
      const files = await scanDirectory(dirPath, `/uploads/${subDir}`, null);
      totalFiles += files.length;
    }

    return NextResponse.json({
      success: true,
      totalFiles,
      existingRecords: existingCount,
      needsSync: totalFiles > existingCount,
    });
  } catch (error) {
    console.error('Media sync status error:', error);
    return NextResponse.json({ error: '获取状态失败' }, { status: 500 });
  }
}
