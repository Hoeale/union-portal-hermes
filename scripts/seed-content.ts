/**
 * 初始化网站内容数据
 * 包含：通知要闻、新闻、政策文件、最美劳动者
 *
 * 使用方法:
 * npx tsx scripts/seed-content.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

// 通知要闻数据
const noticeData = [
  {
    title: '2025—2029年陕西省企事业单位民主管理工作五年规划',
    content: '<p>为深入贯彻落实党的二十大精神，推进企事业单位民主管理工作，特制定本规划...</p>',
    category: '通知要闻',
    isNotice: true,
    isActive: true,
    publishedAt: new Date('2025-11-10'),
  },
  {
    title: '印发职工代表工作指引的通知',
    content: '<p>为进一步规范职工代表工作，提高职工代表履职能力，现就有关事项通知如下...</p>',
    category: '通知要闻',
    isNotice: true,
    isActive: true,
    publishedAt: new Date('2025-11-10'),
  },
  {
    title: '关于开展2025年金秋助学活动的通知',
    content: '<p>为帮助困难职工子女顺利完成学业，现就开展2025年金秋助学活动有关事项通知如下...</p>',
    category: '通知要闻',
    isNotice: true,
    isActive: true,
    publishedAt: new Date('2025-08-01'),
  },
  {
    title: '中共中央 国务院关于深化产业工人队伍建设改革的意见',
    content: '<p>为深入贯彻落实习近平总书记关于产业工人队伍建设改革的重要指示精神...</p>',
    category: '通知要闻',
    isNotice: true,
    isActive: true,
    publishedAt: new Date('2025-06-15'),
  },
  {
    title: '关于组织收看2025年中国梦·劳动美庆祝五一国际劳动节特别节目的通知',
    content: '<p>为庆祝五一国际劳动节，弘扬劳模精神、劳动精神、工匠精神...</p>',
    category: '通知要闻',
    isNotice: true,
    isActive: true,
    publishedAt: new Date('2025-04-25'),
  },
  {
    title: '高新区总工会困难职工帮扶申报通知',
    content: '<p>为做好困难职工帮扶工作，现就申报有关事项通知如下...</p>',
    category: '公示公告',
    isNotice: true,
    isActive: true,
    publishedAt: new Date('2025-04-10'),
  },
];

// 新闻数据
const newsData = [
  {
    title: '西安高新区总工会召开2025年工作会议',
    content: '<p>近日，西安高新区总工会召开2025年工作会议，总结2024年工作，部署2025年重点任务...</p>',
    summary: '总结2024年工作，部署2025年重点任务',
    category: '新闻动态',
    isCarousel: true,
    isActive: true,
    publishedAt: new Date('2025-06-20'),
  },
  {
    title: '高新区举办职工技能大赛',
    content: '<p>为提升职工技能水平，弘扬工匠精神，高新区总工会举办了职工技能大赛...</p>',
    summary: '提升职工技能水平，弘扬工匠精神',
    category: '新闻动态',
    isCarousel: true,
    isActive: true,
    publishedAt: new Date('2025-06-15'),
  },
  {
    title: '工会慰问困难职工家庭',
    content: '<p>春节前夕，高新区总工会走访慰问困难职工家庭，送去温暖和关怀...</p>',
    summary: '走访慰问困难职工家庭',
    category: '新闻动态',
    isCarousel: true,
    isActive: true,
    publishedAt: new Date('2025-01-20'),
  },
  {
    title: '高新区新建3个职工之家',
    content: '<p>为更好地服务职工，高新区总工会在辖区新建3个职工之家...</p>',
    summary: '新建3个职工之家，更好地服务职工',
    category: '新闻动态',
    isCarousel: false,
    isActive: true,
    publishedAt: new Date('2025-05-10'),
  },
  {
    title: '工会开展法律援助服务',
    content: '<p>为维护职工合法权益，高新区总工会开展法律援助服务...</p>',
    summary: '开展法律援助服务，维护职工权益',
    category: '新闻动态',
    isCarousel: false,
    isActive: true,
    publishedAt: new Date('2025-04-15'),
  },
];

// 政策文件数据
const policyData = [
  {
    title: '工会法实施条例',
    content: '<p>根据《中华人民共和国工会法》，制定本条例...</p>',
    fileUrl: '/uploads/policies/union-law.pdf',
    isActive: true,
    publishedAt: new Date('2025-01-01'),
  },
  {
    title: '职工权益保障办法',
    content: '<p>为保障职工合法权益，促进劳动关系和谐稳定...</p>',
    fileUrl: '/uploads/policies/rights-protection.pdf',
    isActive: true,
    publishedAt: new Date('2025-02-01'),
  },
  {
    title: '困难职工帮扶管理办法',
    content: '<p>为规范困难职工帮扶工作，提高帮扶精准度...</p>',
    fileUrl: '/uploads/policies/assistance-management.pdf',
    isActive: true,
    publishedAt: new Date('2025-03-01'),
  },
];

// 最美劳动者数据
const workerData = [
  {
    name: '张明',
    title: '技术能手',
    department: '高新区某科技公司',
    imageUrl: '/uploads/workers/worker1.jpg',
    description: '张明同志在工作中刻苦钻研技术，多次获得技术比武冠军...',
    achievements: '获得省级技术能手称号，申请专利3项',
    isActive: true,
    orderIndex: 0,
  },
  {
    name: '李华',
    title: '劳动模范',
    department: '高新区某制造企业',
    imageUrl: '/uploads/workers/worker2.jpg',
    description: '李华同志在平凡的岗位上做出了不平凡的业绩...',
    achievements: '获得市级劳动模范称号，连续5年被评为优秀员工',
    isActive: true,
    orderIndex: 1,
  },
  {
    name: '王芳',
    title: '巾帼标兵',
    department: '高新区某服务企业',
    imageUrl: '/uploads/workers/worker3.jpg',
    description: '王芳同志以优质的服务赢得了客户的一致好评...',
    achievements: '获得省级巾帼标兵称号，客户满意度100%',
    isActive: true,
    orderIndex: 2,
  },
  {
    name: '赵强',
    title: '创新先锋',
    department: '高新区某研发机构',
    imageUrl: '/uploads/workers/worker4.jpg',
    description: '赵强同志勇于创新，带领团队攻克多项技术难题...',
    achievements: '获得国家级科技进步奖，发表论文10余篇',
    isActive: true,
    orderIndex: 3,
  },
];

async function main() {
  console.log('开始初始化网站内容数据...\n');

  try {
    // 1. 初始化通知要闻
    console.log('📢 初始化通知要闻...');
    for (const notice of noticeData) {
      const existing = await prisma.news.findFirst({
        where: { title: notice.title },
      });
      
      if (!existing) {
        await prisma.news.create({
          data: {
            ...notice,
            status: 'published',
          },
        });
        console.log(`  ✓ 创建: ${notice.title}`);
      } else {
        console.log(`  ⏭ 跳过: ${notice.title} (已存在)`);
      }
    }
    console.log('');

    // 2. 初始化新闻
    console.log('📰 初始化新闻...');
    for (const news of newsData) {
      const existing = await prisma.news.findFirst({
        where: { title: news.title },
      });
      
      if (!existing) {
        await prisma.news.create({
          data: {
            ...news,
            status: 'published',
          },
        });
        console.log(`  ✓ 创建: ${news.title}`);
      } else {
        console.log(`  ⏭ 跳过: ${news.title} (已存在)`);
      }
    }
    console.log('');

    // 3. 初始化政策文件
    console.log('📄 初始化政策文件...');
    for (const policy of policyData) {
      const existing = await prisma.policy.findFirst({
        where: { title: policy.title },
      });
      
      if (!existing) {
        await prisma.policy.create({
          data: policy,
        });
        console.log(`  ✓ 创建: ${policy.title}`);
      } else {
        console.log(`  ⏭ 跳过: ${policy.title} (已存在)`);
      }
    }
    console.log('');

    // 4. 初始化最美劳动者
    console.log('👷 初始化最美劳动者...');
    for (const worker of workerData) {
      const existing = await prisma.worker.findFirst({
        where: { name: worker.name },
      });
      
      if (!existing) {
        await prisma.worker.create({
          data: worker,
        });
        console.log(`  ✓ 创建: ${worker.name} - ${worker.title}`);
      } else {
        console.log(`  ⏭ 跳过: ${worker.name} (已存在)`);
      }
    }
    console.log('');

    console.log('✅ 网站内容数据初始化完成！');
    console.log(`\n统计:`);
    console.log(`  - 通知要闻: ${noticeData.length} 条`);
    console.log(`  - 新闻动态: ${newsData.length} 条`);
    console.log(`  - 政策文件: ${policyData.length} 条`);
    console.log(`  - 最美劳动者: ${workerData.length} 条`);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
