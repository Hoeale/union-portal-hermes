/**
 * 安全的数据更新脚本
 * 只新增默认数据，不删除或覆盖用户已有数据
 *
 * 使用方法:
 * npx tsx scripts/seed-content-safe.ts [--force]
 *
 * 参数:
 * --force: 强制重置所有数据（危险！会删除用户数据）
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

// 解析命令行参数
const args = process.argv.slice(2);
const forceMode = args.includes('--force');

// 默认新闻数据
const defaultNews = [
  {
    title: '西安高新区总工会召开2025年工作会议',
    content: '<p>近日，西安高新区总工会召开2025年工作会议...</p>',
    summary: '总结2024年工作，部署2025年重点任务',
    category: '新闻动态',
    isCarousel: true,
    isActive: true,
    publishedAt: new Date('2025-06-20'),
  },
  // ... 其他默认新闻
];

// 默认通知数据
const defaultNotices = [
  {
    title: '2025—2029年陕西省企事业单位民主管理工作五年规划',
    content: '<p>为深入贯彻落实党的二十大精神...</p>',
    category: '通知要闻',
    isNotice: true,
    isActive: true,
    publishedAt: new Date('2025-11-10'),
  },
  // ... 其他默认通知
];

async function main() {
  console.log('========================================');
  console.log('  安全数据更新');
  console.log('========================================\n');

  if (forceMode) {
    console.log('⚠️  警告: 强制模式已启用，将删除所有用户数据！\n');
    // 强制模式下才删除数据
    await prisma.news.deleteMany({});
    await prisma.policy.deleteMany({});
    await prisma.worker.deleteMany({});
    console.log('✓ 已清空所有数据\n');
  }

  // 1. 安全创建新闻（只创建不存在的）
  console.log('📰 更新新闻数据...');
  let newsCreated = 0;
  let newsSkipped = 0;
  
  for (const news of defaultNews) {
    const existing = await prisma.news.findFirst({
      where: { title: news.title }
    });
    
    if (!existing) {
      await prisma.news.create({
        data: { ...news, status: 'published' }
      });
      console.log(`  ✓ 创建: ${news.title}`);
      newsCreated++;
    } else {
      console.log(`  ⏭ 跳过: ${news.title} (用户数据)`);
      newsSkipped++;
    }
  }
  console.log(`  统计: 创建 ${newsCreated} 条, 跳过 ${newsSkipped} 条\n`);

  // 2. 安全创建通知
  console.log('📢 更新通知数据...');
  let noticeCreated = 0;
  let noticeSkipped = 0;
  
  for (const notice of defaultNotices) {
    const existing = await prisma.news.findFirst({
      where: { title: notice.title }
    });
    
    if (!existing) {
      await prisma.news.create({
        data: { ...notice, status: 'published' }
      });
      console.log(`  ✓ 创建: ${notice.title}`);
      noticeCreated++;
    } else {
      console.log(`  ⏭ 跳过: ${notice.title} (用户数据)`);
      noticeSkipped++;
    }
  }
  console.log(`  统计: 创建 ${noticeCreated} 条, 跳过 ${noticeSkipped} 条\n`);

  // 3. 显示用户数据统计
  const userNewsCount = await prisma.news.count();
  console.log('📊 当前数据总量:');
  console.log(`  - 新闻/通知: ${userNewsCount} 条\n`);

  console.log('========================================');
  console.log('  更新完成！');
  console.log('========================================');
  console.log('\n提示: 如需强制重置数据，请使用 --force 参数');
}

main()
  .catch((e) => {
    console.error('更新失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
