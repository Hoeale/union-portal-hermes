/**
 * 初始化缺失的数据
 * - 轮播图数据
 * - 工会概况数据
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initData() {
  console.log('开始初始化数据...\n');

  try {
    // 1. 检查并创建轮播图数据
    console.log('1. 检查轮播图数据...');
    const carouselCount = await prisma.carouselItem.count();
    console.log(`   当前轮播图数量: ${carouselCount}`);

    if (carouselCount === 0) {
      console.log('   创建默认轮播图数据...');

      // 先检查是否有新闻数据
      const news = await prisma.news.findMany({
        where: { isCarousel: true },
        orderBy: { carouselOrder: 'asc' },
        take: 4,
      });

      if (news.length > 0) {
        // 使用已有的新闻创建轮播图
        for (let i = 0; i < news.length; i++) {
          await prisma.carouselItem.create({
            data: {
              newsId: news[i].id,
              title: news[i].title,
              imageUrl: news[i].imageUrl || '/header-bg.png',
              displayOrder: i + 1,
            },
          });
        }
        console.log(`   ✓ 创建了 ${news.length} 条轮播图`);
      } else {
        // 创建默认轮播图
        const defaultCarousel = [
          {
            title: '陕西省总工会召开主席办公会议',
            imageUrl: '/header-bg.png',
          },
          {
            title: '五一劳动奖评选表彰工作',
            imageUrl: '/header-bg.png',
          },
          {
            title: '全省职工技能大赛',
            imageUrl: '/header-bg.png',
          },
        ];

        for (let i = 0; i < defaultCarousel.length; i++) {
          await prisma.carouselItem.create({
            data: {
              newsId: '00000000-0000-0000-0000-00000000000' + (i + 1),
              title: defaultCarousel[i].title,
              imageUrl: defaultCarousel[i].imageUrl,
              displayOrder: i + 1,
            },
          });
        }
        console.log(`   ✓ 创建了 ${defaultCarousel.length} 条默认轮播图`);
      }
    } else {
      console.log('   ✓ 轮播图数据已存在，跳过');
    }

    // 2. 检查并创建工会概况数据
    console.log('\n2. 检查工会概况数据...');
    const siteInfo = await prisma.siteInfo.findUnique({
      where: { key: 'union_introduction' },
    });

    if (!siteInfo) {
      console.log('   创建工会概况数据...');
      await prisma.siteInfo.create({
        data: {
          key: 'union_introduction',
          content: `<h2>西安高新区总工会简介</h2>
<p>西安高新区总工会是高新区党工委领导下的职工自愿结合的工人阶级群众组织，是党联系职工群众的桥梁和纽带。</p>

<h3>主要职责</h3>
<ul>
<li>维护职工合法权益</li>
<li>参与协调劳动关系</li>
<li>组织职工参与民主管理</li>
<li>开展职工教育培训</li>
<li>丰富职工文化生活</li>
</ul>

<h3>服务对象</h3>
<p>高新区内所有企事业单位职工，包括企业职工、机关事业单位职工、新就业形态劳动者等。</p>`,
        },
      });
      console.log('   ✓ 工会概况数据创建成功');
    } else {
      console.log('   ✓ 工会概况数据已存在，跳过');
    }

    // 3. 检查办事服务数据
    console.log('\n3. 检查办事服务数据...');
    const serviceCount = await prisma.service.count();
    console.log(`   当前服务数量: ${serviceCount}`);

    if (serviceCount === 0) {
      console.log('   创建默认服务数据...');
      const defaultServices = [
        {
          title: '工会地图',
          description: '查找附近工会组织',
          process: '1. 打开工会地图功能\n2. 定位当前位置\n3. 查看附近工会\n4. 前往办理',
          requirements: '无需材料，直接前往',
        },
        {
          title: '入会申请',
          description: '申请加入工会组织',
          process: '1. 准备入会材料\n2. 填写申请表\n3. 现场提交申请\n4. 审核通过后成为会员',
          requirements: '身份证原件及复印件、一寸照片2张、劳动合同',
        },
        {
          title: '转会申请',
          description: '工会关系转移办理',
          process: '1. 准备转移材料\n2. 原工会确认\n3. 新工会接收\n4. 完成转移',
          requirements: '身份证、工会会员证、新单位劳动合同',
        },
        {
          title: '职工诉求',
          description: '反映意见建议',
          process: '1. 准备诉求材料\n2. 现场提交申请\n3. 工会受理调查\n4. 结果反馈',
          requirements: '身份证、诉求材料',
        },
      ];

      for (let i = 0; i < defaultServices.length; i++) {
        await prisma.service.create({
          data: {
            ...defaultServices[i],
            orderIndex: i + 1,
            isActive: true,
          },
        });
      }
      console.log(`   ✓ 创建了 ${defaultServices.length} 条服务`);
    } else {
      console.log('   ✓ 服务数据已存在，跳过');
    }

    console.log('\n✅ 数据初始化完成！');

  } catch (error) {
    console.error('\n❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initData();
