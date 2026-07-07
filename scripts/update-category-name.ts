/**
 * 更新分类名称：工会动态 → 新闻动态
 * 运行: npx tsx scripts/update-category-name.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始更新分类名称...');

  // 1. 更新分类表中的名称
  const categoryResult = await prisma.newsCategory.updateMany({
    where: { name: '工会动态' },
    data: { name: '新闻动态' },
  });
  console.log(`分类表更新: ${categoryResult.count} 条记录`);

  // 2. 更新新闻表中的分类名称
  const newsResult = await prisma.news.updateMany({
    where: { category: '工会动态' },
    data: { category: '新闻动态' },
  });
  console.log(`新闻表更新: ${newsResult.count} 条记录`);

  console.log('完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
