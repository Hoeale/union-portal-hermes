/**
 * 服务器数据初始化脚本
 * 用于填充轮播图新闻、友情链接、通知公告等必要数据
 *
 * 注意: 所有字段名必须与 prisma/schema.prisma 中的定义一致（camelCase）
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('  服务器数据初始化');
  console.log('========================================\n');

  // 0. 初始化管理员账号
  console.log('0. 初始化管理员账号...');
  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    await prisma.admin.create({
      data: {
        username: process.env.ADMIN_USERNAME || 'admin',
        passwordHash: await bcrypt.hash(password, 10),
        role: 'admin',
      },
    });
    console.log('   ✅ 管理员账号初始化完成');
    console.log(`   ℹ️  默认账号: ${process.env.ADMIN_USERNAME || 'admin'} / ${password}\n`);
  } else {
    console.log('   ℹ️ 管理员账号已存在，跳过\n');
  }

  // 1. 初始化友情链接
  console.log('1. 初始化友情链接...');
  const existingLinks = await prisma.friendlyLink.count();
  if (existingLinks === 0) {
    const defaultLinks = [
      { title: '中华全国总工会', url: 'https://www.acftu.org/', orderIndex: 0, isRequired: true },
      { title: '陕西省总工会', url: 'http://www.shxgh.org/', orderIndex: 1, isRequired: true },
      { title: '西安市总工会', url: 'https://www.xaszgh.cn/', orderIndex: 2, isRequired: true },
      { title: '西安高新区管委会', url: 'https://xdz.xa.gov.cn/', orderIndex: 3, isRequired: false },
    ];

    await prisma.friendlyLink.createMany({ data: defaultLinks });
    console.log('   ✅ 友情链接初始化完成\n');
  } else {
    console.log('   ℹ️ 友情链接已存在，跳过\n');
  }

  // 2. 初始化通知公告数据
  console.log('2. 初始化通知公告数据...');
  const noticeCount = await prisma.news.count({
    where: { category: '通知' },
  });

  if (noticeCount === 0) {
    const defaultNotices = [
      {
        title: '关于举办高新区职工技能竞赛的通知',
        content: '为提升职工技能水平，高新区总工会将举办职工技能竞赛...',
        category: '通知',
        publishedAt: new Date(),
        status: 'published' as const,
        isCarousel: false,
      },
      {
        title: '高新区工会会员福利发放公告',
        content: '请各位会员及时领取本季度工会福利...',
        category: '通知',
        publishedAt: new Date(),
        status: 'published' as const,
        isCarousel: false,
      },
      {
        title: '关于征集职工文化作品的通知',
        content: '为丰富职工文化生活，现面向全区征集文化作品...',
        category: '通知',
        publishedAt: new Date(),
        status: 'published' as const,
        isCarousel: false,
      },
    ];

    await prisma.news.createMany({ data: defaultNotices });
    console.log('   ✅ 通知公告初始化完成\n');
  } else {
    console.log('   ℹ️ 通知公告已存在，跳过\n');
  }

  // 3. 初始化轮播图新闻
  console.log('3. 初始化轮播图新闻...');
  const carouselCount = await prisma.news.count({
    where: { isCarousel: true },
  });

  if (carouselCount === 0) {
    const defaultCarouselNews = [
      {
        title: '高新区总工会召开年度工作会议',
        content: '总结过去一年的工作成果，部署新年度工作任务...',
        category: '动态',
        publishedAt: new Date(),
        status: 'published' as const,
        isCarousel: true,
        imageUrl: '/uploads/carousel-1.jpg',
        carouselOrder: 1,
      },
      {
        title: '慰问困难职工，送去温暖关怀',
        content: '高新区总工会走访慰问困难职工家庭...',
        category: '动态',
        publishedAt: new Date(Date.now() - 86400000),
        status: 'published' as const,
        isCarousel: true,
        imageUrl: '/uploads/carousel-2.jpg',
        carouselOrder: 2,
      },
      {
        title: '职工技能竞赛圆满落幕',
        content: '本次竞赛吸引了众多职工参与，展现了高新区职工风采...',
        category: '动态',
        publishedAt: new Date(Date.now() - 172800000),
        status: 'published' as const,
        isCarousel: true,
        imageUrl: '/uploads/carousel-3.jpg',
        carouselOrder: 3,
      },
    ];

    await prisma.news.createMany({ data: defaultCarouselNews });
    console.log('   ✅ 轮播图新闻初始化完成\n');
  } else {
    console.log('   ℹ️ 轮播图新闻已存在，跳过\n');
  }

  // 4. 初始化办事服务数据
  console.log('4. 初始化办事服务数据...');
  const serviceCount = await prisma.service.count();

  if (serviceCount === 0) {
    const defaultServices = [
      { title: '工会地图', description: '查看高新区各级工会组织分布', process: '', requirements: '', orderIndex: 0, isActive: true },
      { title: '入会申请', description: '在线申请加入工会组织', process: '', requirements: '', orderIndex: 1, isActive: true },
      { title: '转会办理', description: '办理工会组织关系转移', process: '', requirements: '', orderIndex: 2, isActive: true },
      { title: '职工诉求', description: '提交职工诉求和建议', process: '', requirements: '', orderIndex: 3, isActive: true },
      { title: '求学圆梦', description: '职工学历提升帮助计划', process: '', requirements: '', orderIndex: 4, isActive: true },
      { title: '女职工评优', description: '优秀女职工评选活动', process: '', requirements: '', orderIndex: 5, isActive: true },
      { title: '困难帮扶', description: '困难职工帮扶救助', process: '', requirements: '', orderIndex: 6, isActive: true },
    ];

    await prisma.service.createMany({ data: defaultServices });
    console.log('   ✅ 办事服务数据初始化完成\n');
  } else {
    console.log('   ℹ️ 办事服务数据已存在，跳过\n');
  }

  // 5. 初始化工会简介（使用 SiteInfo 模型）
  console.log('5. 初始化工会概况数据...');
  const existingIntro = await prisma.siteInfo.findUnique({
    where: { key: 'union_introduction' },
  });

  if (!existingIntro) {
    await prisma.siteInfo.create({
      data: {
        key: 'union_introduction',
        content: `<p>西安高新区总工会是高新区党工委领导下的职工自愿结合的工人阶级群众组织，是党联系职工群众的桥梁和纽带。</p><p>高新区总工会成立于2019年11月，多年来始终坚持"组织起来、切实维权"的工作方针，围绕中心、服务大局，在维护职工合法权益、构建和谐劳动关系、促进高新区经济社会发展等方面发挥了重要作用。</p>`,
      },
    });
    console.log('   ✅ 工会概况数据初始化完成\n');
  } else {
    console.log('   ℹ️ 工会概况数据已存在，跳过\n');
  }

  console.log('========================================');
  console.log('  数据初始化完成！');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
