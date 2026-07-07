/**
 * 数据导出脚本
 * 将本地数据库的所有内容数据导出为 JSON 文件
 * 用于同步到服务器
 *
 * 使用方法: npx tsx scripts/export-data.ts
 * 注意: 本地开发使用 .env.local，服务器使用 .env
 */

import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const EXPORT_DIR = path.join(process.cwd(), 'data-export');

async function main() {
  // 加载本地环境变量（必须在 import Prisma 之前）
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envLocalPath)) {
    config({ path: envLocalPath, override: true });
    console.log('📝 使用 .env.local 配置');
  } else if (fs.existsSync(envPath)) {
    config({ path: envPath, override: true });
    console.log('📝 使用 .env 配置');
  }

  // 动态导入 Prisma（确保环境变量已加载）
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  console.log('🚀 开始导出数据...\n');

  // 创建导出目录
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const exportFile = path.join(EXPORT_DIR, `data-${timestamp}.json`);

  // 导出所有数据（带错误处理，某些表可能不存在）
  const safeQuery = async (fn: () => Promise<any[]>, name: string): Promise<any[]> => {
    try {
      return await fn();
    } catch (e: any) {
      if (e.code === 'P2021' || e.code === 'P2010') {
        console.log(`   ⚠️  表 ${name} 不存在，跳过`);
        return [];
      }
      throw e;
    }
  };

  const data = {
    exportTime: new Date().toISOString(),
    version: '1.0',

    // 新闻相关
    newsCategories: await safeQuery(() => prisma.newsCategory.findMany({ orderBy: { orderIndex: 'asc' } }), 'news_categories'),
    news: await safeQuery(() => prisma.news.findMany({ orderBy: { publishedAt: 'desc' } }), 'news'),
    carouselItems: await safeQuery(() => prisma.carouselItem.findMany({ orderBy: { displayOrder: 'asc' } }), 'carousel_items'),

    // 政策相关
    policyCategories: await safeQuery(() => prisma.policyCategory.findMany({ orderBy: { orderIndex: 'asc' } }), 'policy_categories'),
    policies: await safeQuery(() => prisma.policy.findMany({ orderBy: { orderIndex: 'asc' } }), 'policies'),

    // 劳动者
    workers: await safeQuery(() => prisma.worker.findMany({ orderBy: { orderIndex: 'asc' } }), 'workers'),

    // 视频
    videos: await safeQuery(() => prisma.video.findMany({ orderBy: { orderIndex: 'asc' } }), 'videos'),

    // 服务
    services: await safeQuery(() => prisma.service.findMany({ orderBy: { orderIndex: 'asc' } }), 'services'),

    // 媒体库
    media: await safeQuery(() => prisma.media.findMany({ orderBy: { createdAt: 'desc' } }), 'media'),

    // 友情链接
    friendlyLinks: await safeQuery(() => prisma.friendlyLink.findMany({ orderBy: { orderIndex: 'asc' } }), 'friendly_links'),

    // 站点信息
    siteInfo: await safeQuery(() => prisma.siteInfo.findMany(), 'site_info'),

    // 系统设置
    systemSettings: await safeQuery(() => prisma.systemSetting.findMany(), 'system_settings'),
  };

  // 统计数据
  console.log('📊 数据统计:');
  console.log(`   新闻分类: ${data.newsCategories.length} 条`);
  console.log(`   新闻: ${data.news.length} 条`);
  console.log(`   轮播图: ${data.carouselItems.length} 条`);
  console.log(`   政策分类: ${data.policyCategories.length} 条`);
  console.log(`   政策: ${data.policies.length} 条`);
  console.log(`   劳动者: ${data.workers.length} 条`);
  console.log(`   视频: ${data.videos.length} 条`);
  console.log(`   服务: ${data.services.length} 条`);
  console.log(`   媒体: ${data.media.length} 条`);
  console.log(`   友情链接: ${data.friendlyLinks.length} 条`);
  console.log(`   站点信息: ${data.siteInfo.length} 条`);
  console.log(`   系统设置: ${data.systemSettings.length} 条`);

  // 写入文件
  fs.writeFileSync(exportFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n✅ 数据已导出到: ${exportFile}`);
  console.log(`   文件大小: ${(fs.statSync(exportFile).size / 1024).toFixed(2)} KB`);

  // 同时导出 uploads 目录中的图片列表
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const fileList = path.join(EXPORT_DIR, `files-${timestamp}.json`);

  if (fs.existsSync(uploadsDir)) {
    const files = getAllFiles(uploadsDir);
    const relativeFiles = files.map(f => path.relative(process.cwd(), f));
    fs.writeFileSync(fileList, JSON.stringify(relativeFiles, null, 2), 'utf-8');
    console.log(`\n📁 发现 ${relativeFiles.length} 个上传文件`);
    console.log(`   文件列表: ${fileList}`);
  }

  console.log('\n📦 下一步: 将 data-*.json 和 public/uploads 目录一起上传到服务器');
  console.log('   然后在服务器上运行: npx tsx scripts/import-data.ts data-export/data-*.json');

  await prisma.$disconnect();
}

function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

main().catch(console.error);
