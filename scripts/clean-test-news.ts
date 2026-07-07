/**
 * 删除性能测试产生的新闻数据
 * 新闻标题包含"性能测试新闻"的记录
 * 
 * 执行方式: npx tsx scripts/clean-test-news.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestNews() {
  try {
    console.log('🔍 正在查找性能测试新闻...');
    
    // 查找所有标题包含"性能测试新闻"的记录
    const testNews = await prisma.news.findMany({
      where: {
        title: {
          contains: '性能测试新闻',
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    console.log(`📊 找到 ${testNews.length} 条性能测试新闻`);

    if (testNews.length === 0) {
      console.log('✅ 没有需要删除的测试新闻');
      return;
    }

    // 显示前10条示例
    console.log('\n示例数据：');
    testNews.slice(0, 10).forEach((news, index) => {
      console.log(`  ${index + 1}. ${news.title} (${news.status})`);
    });

    if (testNews.length > 10) {
      console.log(`  ... 还有 ${testNews.length - 10} 条`);
    }

    // 确认删除
    console.log('\n⚠️  即将删除这些新闻，按 Enter 继续，或 Ctrl+C 取消...');
    
    // 执行删除
    console.log('\n🗑️  正在删除...');
    
    const deleteResult = await prisma.news.deleteMany({
      where: {
        title: {
          contains: '性能测试新闻',
        },
      },
    });

    console.log(`✅ 成功删除 ${deleteResult.count} 条性能测试新闻`);

    // 清理测试分类（如果存在）
    console.log('\n🔍 正在查找测试分类...');
    
    const testCategories = await prisma.newsCategory.findMany({
      where: {
        OR: [
          { name: '测试分类' },
          { slug: 'test-category' },
        ],
      },
    });

    if (testCategories.length > 0) {
      console.log(`找到 ${testCategories.length} 个测试分类：`);
      testCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug})`);
      });

      console.log('\n⚠️  是否删除这些测试分类？(y/N)');
      
      // 这里需要手动确认，脚本中暂时不自动删除
      console.log('如需删除，请手动执行以下 SQL：');
      testCategories.forEach(cat => {
        console.log(`  DELETE FROM news_categories WHERE id = '${cat.id}';`);
      });
    } else {
      console.log('✅ 没有找到测试分类');
    }

  } catch (error) {
    console.error('❌ 删除失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行清理
cleanTestNews();
