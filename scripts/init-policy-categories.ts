import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('初始化政策分类表...');

  // 从实际政策数据中获取分类
  const policies = await prisma.policy.findMany({
    select: { category: true },
    distinct: ['category']
  });

  const uniqueCategories = [...new Set(policies.map(p => p.category).filter(Boolean))];
  console.log('从政策数据中提取的分类:', uniqueCategories);

  // 创建分类记录
  for (let i = 0; i < uniqueCategories.length; i++) {
    try {
      await prisma.policyCategory.create({
        data: {
          id: uuidv4(),
          name: uniqueCategories[i],
          orderIndex: i,
          isActive: true
        }
      });
      console.log(`✓ 创建分类: ${uniqueCategories[i]}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⚠ 分类已存在: ${uniqueCategories[i]}`);
      } else {
        console.error(`✗ 创建失败: ${uniqueCategories[i]}`, error.message);
      }
    }
  }

  // 验证创建结果
  const allCategories = await prisma.policyCategory.findMany({
    orderBy: { orderIndex: 'asc' }
  });
  console.log('\n最终分类列表:', allCategories.map(c => c.name));

  await prisma.$disconnect();
}

main().catch(console.error);
