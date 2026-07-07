/**
 * 数据导入脚本
 * 将导出的 JSON 数据导入到服务器数据库
 *
 * 使用方法: npx tsx scripts/import-data.ts <json-file-path>
 *
 * 示例: npx tsx scripts/import-data.ts data-export/data-2026-07-05T00-30-00.json
 * 注意: 服务器使用 .env，本地开发使用 .env.local
 */

import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ 请指定数据文件路径');
    console.error('用法: npx tsx scripts/import-data.ts <json-file-path>');
    console.error('示例: npx tsx scripts/import-data.ts data-export/data-2026-07-05.json');
    process.exit(1);
  }

  const dataFile = args[0];
  if (!fs.existsSync(dataFile)) {
    console.error(`❌ 文件不存在: ${dataFile}`);
    process.exit(1);
  }

  // 加载环境变量（必须在 import Prisma 之前）
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

  console.log(`\n📂 读取数据文件: ${dataFile}`);
  const rawData = fs.readFileSync(dataFile, 'utf-8');
  const data = JSON.parse(rawData);

  console.log(`📅 数据导出时间: ${data.exportTime}`);
  console.log('');

  // 确认导入
  const confirmed = await confirm('⚠️  警告: 此操作将覆盖服务器数据库中的所有内容，是否继续？');
  if (!confirmed) {
    console.log('❌ 已取消导入');
    await prisma.$disconnect();
    process.exit(0);
  }

  console.log('\n🚀 开始导入数据...\n');

  // 按依赖顺序导入

  // 1. 新闻分类
  console.log('📰 导入新闻分类...');
  await prisma.newsCategory.deleteMany();
  if (data.newsCategories?.length) {
    await prisma.newsCategory.createMany({ data: data.newsCategories });
    console.log(`   ✅ ${data.newsCategories.length} 条`);
  }

  // 2. 政策分类
  console.log('📋 导入政策分类...');
  await prisma.policyCategory.deleteMany();
  if (data.policyCategories?.length) {
    await prisma.policyCategory.createMany({ data: data.policyCategories });
    console.log(`   ✅ ${data.policyCategories.length} 条`);
  }

  // 3. 新闻（需要先删除轮播图，因为有外键依赖）
  console.log('📰 导入新闻...');
  await prisma.carouselItem.deleteMany();
  await prisma.news.deleteMany();
  if (data.news?.length) {
    // 分批导入，避免单次过大
    const batchSize = 50;
    for (let i = 0; i < data.news.length; i += batchSize) {
      const batch = data.news.slice(i, i + batchSize);
      await prisma.news.createMany({ data: batch, skipDuplicates: true });
    }
    console.log(`   ✅ ${data.news.length} 条`);
  }

  // 4. 轮播图
  console.log('🎠 导入轮播图...');
  if (data.carouselItems?.length) {
    await prisma.carouselItem.createMany({ data: data.carouselItems, skipDuplicates: true });
    console.log(`   ✅ ${data.carouselItems.length} 条`);
  }

  // 5. 政策
  console.log('📋 导入政策...');
  await prisma.policy.deleteMany();
  if (data.policies?.length) {
    const batchSize = 50;
    for (let i = 0; i < data.policies.length; i += batchSize) {
      const batch = data.policies.slice(i, i + batchSize);
      await prisma.policy.createMany({ data: batch, skipDuplicates: true });
    }
    console.log(`   ✅ ${data.policies.length} 条`);
  }

  // 6. 劳动者
  console.log('👷 导入劳动者...');
  await prisma.worker.deleteMany();
  if (data.workers?.length) {
    await prisma.worker.createMany({ data: data.workers });
    console.log(`   ✅ ${data.workers.length} 条`);
  }

  // 7. 视频
  console.log('🎬 导入视频...');
  await prisma.video.deleteMany();
  if (data.videos?.length) {
    await prisma.video.createMany({ data: data.videos });
    console.log(`   ✅ ${data.videos.length} 条`);
  }

  // 8. 服务
  console.log('🔧 导入服务...');
  await prisma.service.deleteMany();
  if (data.services?.length) {
    await prisma.service.createMany({ data: data.services });
    console.log(`   ✅ ${data.services.length} 条`);
  }

  // 9. 媒体库
  console.log('🖼️  导入媒体库...');
  await prisma.mediaReference.deleteMany();
  await prisma.media.deleteMany();
  if (data.media?.length) {
    const batchSize = 100;
    for (let i = 0; i < data.media.length; i += batchSize) {
      const batch = data.media.slice(i, i + batchSize);
      await prisma.media.createMany({ data: batch, skipDuplicates: true });
    }
    console.log(`   ✅ ${data.media.length} 条`);
  }

  // 10. 友情链接
  console.log('🔗 导入友情链接...');
  await prisma.friendlyLink.deleteMany();
  if (data.friendlyLinks?.length) {
    await prisma.friendlyLink.createMany({ data: data.friendlyLinks });
    console.log(`   ✅ ${data.friendlyLinks.length} 条`);
  }

  // 11. 站点信息
  console.log('🌐 导入站点信息...');
  await prisma.siteInfo.deleteMany();
  if (data.siteInfo?.length) {
    await prisma.siteInfo.createMany({ data: data.siteInfo });
    console.log(`   ✅ ${data.siteInfo.length} 条`);
  }

  // 12. 系统设置
  console.log('⚙️  导入系统设置...');
  await prisma.systemSetting.deleteMany();
  if (data.systemSettings?.length) {
    await prisma.systemSetting.createMany({ data: data.systemSettings });
    console.log(`   ✅ ${data.systemSettings.length} 条`);
  }

  console.log('\n✅ 数据导入完成！');
  console.log('\n⚠️  注意:');
  console.log('   - 管理员账号(Admins)未被导入（保护服务器管理员数据）');
  console.log('   - 操作日志、登录日志等未被导入');
  console.log('   - 请确保 public/uploads 目录中的图片文件也已同步');

  await prisma.$disconnect();
}

function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

main().catch(console.error);
