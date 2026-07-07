const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    // 删除旧表
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS policy_categories');
    console.log('✓ 已删除旧表');
    
    // 重新创建表（字段名 isActive 不用 @map，所以数据库列名就是 isActive）
    await prisma.$executeRawUnsafe(`
      CREATE TABLE policy_categories (
        _id VARCHAR(36) NOT NULL,
        name VARCHAR(50) NOT NULL,
        order_index INT NOT NULL DEFAULT 0,
        isActive BOOLEAN NOT NULL DEFAULT true,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (_id),
        UNIQUE INDEX policy_categories_name_key(name),
        INDEX policy_categories_is_active_idx(isActive)
      )
    `);
    console.log('✓ 已创建新表（字段 isActive 正确）');
    
    // 插入分类数据
    const categories = ['权益保障', '社会保障', '劳动法规', '安全生产', '福利待遇', '奖励待遇', '其他'];
    for (let i = 0; i < categories.length; i++) {
      await prisma.$executeRawUnsafe(
        'INSERT INTO policy_categories (_id, name, order_index, isActive) VALUES (UUID(), ?, ?, true)',
        categories[i],
        i
      );
      console.log(`✓ 插入分类: ${categories[i]}`);
    }
    
    // 验证
    const result = await prisma.policyCategory.findMany({
      orderBy: { orderIndex: 'asc' }
    });
    console.log('\n政策分类列表:', result.map(c => c.name));
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
