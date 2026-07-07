/**
 * 直接初始化新闻分类（无需API调用）
 * 在部署时直接操作数据库
 *
 * 使用方法:
 * npx tsx scripts/init-news-categories.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  console.log('========================================');
  console.log('  初始化新闻分类');
  console.log('========================================\n');

  try {
    // 检查是否已有分类
    const existingCount = await prisma.newsCategory.count();
    
    if (existingCount > 0) {
      console.log(`ℹ️  已有 ${existingCount} 个分类，检查是否需要更新...`);
      
      // 获取现有分类
      const existing = await prisma.newsCategory.findMany();
      const existingNames = existing.map(c => c.name);
      
      // 检查是否包含所有必需的分类
      const requiredCategories = [
        { name: '新闻动态', slug: 'news', color: '#b71c1c', orderIndex: 1 },
        { name: '通知要闻', slug: 'notices', color: '#1565c0', orderIndex: 2 },
        { name: '公示公告', slug: 'announcements', color: '#2e7d32', orderIndex: 3 },
      ];
      
      let added = 0;
      for (const cat of requiredCategories) {
        if (!existingNames.includes(cat.name)) {
          await prisma.newsCategory.create({ data: cat });
          console.log(`  ✓ 新增: ${cat.name}`);
          added++;
        }
      }
      
      if (added === 0) {
        console.log('  ✓ 所有分类已存在，无需更新\n');
      } else {
        console.log(`  ✓ 新增 ${added} 个分类\n`);
      }
    } else {
      // 创建所有默认分类
      const defaultCategories = [
        { name: '新闻动态', slug: 'news', color: '#b71c1c', orderIndex: 1 },
        { name: '通知要闻', slug: 'notices', color: '#1565c0', orderIndex: 2 },
        { name: '公示公告', slug: 'announcements', color: '#2e7d32', orderIndex: 3 },
      ];

      await prisma.newsCategory.createMany({
        data: defaultCategories,
        skipDuplicates: true,
      });

      console.log(`  ✓ 创建 ${defaultCategories.length} 个分类:`);
      defaultCategories.forEach(cat => {
        console.log(`    - ${cat.name}`);
      });
      console.log('');
    }

    // 迁移旧分类数据
    console.log('📦 迁移旧分类数据...');
    const migrations = [
      { old: '动态', new: '新闻动态' },
      { old: '工会动态', new: '新闻动态' },
      { old: '通知', new: '通知要闻' },
      { old: '公告', new: '公示公告' },
    ];

    let totalMigrated = 0;
    for (const m of migrations) {
      const result = await prisma.news.updateMany({
        where: { category: m.old },
        data: { category: m.new },
      });
      if (result.count > 0) {
        console.log(`  ✓ ${m.old} → ${m.new}: ${result.count} 条`);
        totalMigrated += result.count;
      }
    }

    if (totalMigrated > 0) {
      console.log(`  总计迁移: ${totalMigrated} 条\n`);
    } else {
      console.log('  ⏭ 无需迁移\n');
    }

    // 显示当前分类统计
    const categories = await prisma.newsCategory.findMany({
      orderBy: { orderIndex: 'asc' },
    });
    
    console.log('📊 当前分类:');
    for (const cat of categories) {
      const count = await prisma.news.count({ where: { category: cat.name } });
      console.log(`  - ${cat.name}: ${count} 条`);
    }

    console.log('\n========================================');
    console.log('  初始化完成！');
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
