const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateServiceFields() {
  try {
    console.log('开始为 services 表添加 icon, gradient, routePath 字段...');

    // 添加 icon 字段
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE services ADD COLUMN icon VARCHAR(50)
      `);
      console.log('✓ 添加 icon 字段成功');
    } catch (error) {
      if (error.message.includes('Duplicate column')) {
        console.log('○ icon 字段已存在，跳过');
      } else {
        throw error;
      }
    }

    // 添加 gradient 字段
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE services ADD COLUMN gradient VARCHAR(100)
      `);
      console.log('✓ 添加 gradient 字段成功');
    } catch (error) {
      if (error.message.includes('Duplicate column')) {
        console.log('○ gradient 字段已存在，跳过');
      } else {
        throw error;
      }
    }

    // 添加 routePath 字段
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE services ADD COLUMN routePath VARCHAR(100)
      `);
      console.log('✓ 添加 routePath 字段成功');
    } catch (error) {
      if (error.message.includes('Duplicate column')) {
        console.log('○ routePath 字段已存在，跳过');
      } else {
        throw error;
      }
    }

    // 为现有服务填充默认值
    console.log('\n开始填充默认图标和渐变色...');
    
    const defaults = [
      { title: '工会地图', icon: 'faMapMarkedAlt', gradient: 'from-blue-500 to-blue-600' },
      { title: '入会申请', icon: 'faUserPlus', gradient: 'from-green-500 to-green-600' },
      { title: '转会申请', icon: 'faExchangeAlt', gradient: 'from-indigo-500 to-indigo-600' },
      { title: '职工诉求', icon: 'faCommentDots', gradient: 'from-orange-500 to-orange-600' },
      { title: '求学圆梦', icon: 'faGraduationCap', gradient: 'from-purple-500 to-purple-600' },
      { title: '女职工评优申报', icon: 'faFemale', gradient: 'from-pink-500 to-pink-600' },
      { title: '困难职工申报', icon: 'faHandHoldingHeart', gradient: 'from-red-500 to-red-600' },
    ];

    for (const item of defaults) {
      const result = await prisma.$executeRawUnsafe(`
        UPDATE services 
        SET icon = ?, gradient = ?
        WHERE title = ? AND (icon IS NULL OR icon = '')
      `, item.icon, item.gradient, item.title);
      
      console.log(`✓ ${item.title}: ${item.icon} / ${item.gradient} (更新 ${result} 条)`);
    }

    console.log('\n✓ 数据迁移完成');
  } catch (error) {
    console.error('✗ 迁移失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateServiceFields();
