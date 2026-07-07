const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('创建 policy_categories 表...');

  // 建表
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`policy_categories\` (
      \`_id\` VARCHAR(36) NOT NULL,
      \`name\` VARCHAR(50) NOT NULL,
      \`order_index\` INT NOT NULL DEFAULT 0,
      \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`_id\`),
      UNIQUE INDEX \`policy_categories_name_key\`(\`name\`),
      INDEX \`policy_categories_is_active_idx\`(\`is_active\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ 表创建成功');

  // 插入合理的政策分类（避免与新闻中心的"公示公告"冲突）
  const defaultCategories = [
    '权益保障',
    '社会保障',
    '劳动法规',
    '安全生产',
    '福利待遇',
    '奖励待遇',
    '其他'
  ];

  for (let i = 0; i < defaultCategories.length; i++) {
    try {
      await prisma.$executeRawUnsafe(
        "INSERT INTO `policy_categories` (`_id`, `name`, `order_index`, `is_active`) VALUES (UUID(), ?, ?, 1)",
        defaultCategories[i],
        i
      );
      console.log(`✓ 插入分类: ${defaultCategories[i]}`);
    } catch (e) {
      console.log(`⚠ 跳过（可能已存在）: ${defaultCategories[i]}`);
    }
  }

  // 验证
  const result = await prisma.$queryRawUnsafe(
    'SELECT name, order_index FROM policy_categories ORDER BY order_index'
  );
  console.log('\n分类列表:', result);

  await prisma.$disconnect();
  console.log('✓ 政策分类初始化完成');
}

main().catch(e => { console.error(e); process.exit(1); });
