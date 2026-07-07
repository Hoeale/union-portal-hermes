import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLinks() {
  console.log('开始更新友情链接...');

  try {
    // 1. 修改"全国总工会"为"中华全国总工会"
    await prisma.friendlyLink.updateMany({
      where: { title: '全国总工会' },
      data: { title: '中华全国总工会' },
    });
    console.log('✓ 已将"全国总工会"更新为"中华全国总工会"');

    // 2. 更新西安市总工会URL
    await prisma.friendlyLink.updateMany({
      where: { title: '西安市总工会' },
      data: { url: 'https://www.xaszgh.cn/' },
    });
    console.log('✓ 已更新西安市总工会URL为 https://www.xaszgh.cn/');

    // 3. 修改"西安高新区管委会"为"西安高新技术产业开发区管理委员会"
    const result = await prisma.friendlyLink.updateMany({
      where: { title: '西安高新区管委会' },
      data: {
        title: '西安高新技术产业开发区管理委员会',
        url: 'https://xdz.xa.gov.cn/',
      },
    });
    console.log('✓ 已将"西安高新区管委会"更新为"西安高新技术产业开发区管理委员会"');

    // 4. 删除"中国教育网"和"陕西教育网"
    const deletedEducation = await prisma.friendlyLink.deleteMany({
      where: {
        title: { in: ['中国教育网', '陕西教育网'] },
      },
    });
    console.log(`✓ 已删除 ${deletedEducation.count} 个教育相关链接`);

    // 显示当前所有友情链接
    const allLinks = await prisma.friendlyLink.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    console.log('\n当前友情链接列表:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    allLinks.forEach((link, index) => {
      console.log(`${index + 1}. ${link.title} - ${link.url}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('更新友情链接时出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateLinks()
  .then(() => {
    console.log('\n✓ 友情链接更新完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ 更新失败:', error);
    process.exit(1);
  });
