/**
 * 添加 is_notice 字段到 news 表
 * 运行: npx tsx scripts/add-is-notice-field.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始添加 is_notice 字段...');

  // 使用原生 SQL 添加字段
  try {
    await prisma.$executeRaw`
      ALTER TABLE news 
      ADD COLUMN is_notice BOOLEAN DEFAULT FALSE
    `;
    console.log('字段添加成功');
  } catch (error: any) {
    if (error.code === 'P2010' && error.meta?.message?.includes('Duplicate column')) {
      console.log('字段已存在，跳过');
    } else {
      throw error;
    }
  }

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
