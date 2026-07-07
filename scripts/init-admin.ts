/**
 * 管理员和示例数据初始化脚本
 *
 * 使用方法:
 * 1. 确保 .env.local 已配置 DATABASE_URL
 * 2. 运行: npm run init-admin
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['query', 'error'],
});

/**
 * 初始化管理员账户
 */
async function initAdmin() {
  console.log('开始初始化管理员账户...\n');

  // 从环境变量获取管理员账户，否则使用默认值
  const defaultAdmin = {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  };

  try {
    // 检查管理员是否已存在
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: defaultAdmin.username },
    });

    if (existingAdmin) {
      console.log(`管理员账户 "${defaultAdmin.username}" 已存在，跳过创建`);
      console.log(`用户名: ${defaultAdmin.username}`);
      console.log(`默认密码: ${defaultAdmin.password}`);
      console.log('\n⚠️  请登录后立即修改默认密码！\n');
      return;
    }

    // 创建新管理员
    const passwordHash = await bcrypt.hash(defaultAdmin.password, 10);

    await prisma.admin.create({
      data: {
        username: defaultAdmin.username,
        passwordHash: passwordHash,
      },
    });

    console.log('✓ 管理员账户创建成功');
    console.log(`  用户名: ${defaultAdmin.username}`);
    console.log(`  默认密码: ${defaultAdmin.password}`);
    console.log('\n⚠️  请登录后立即修改默认密码！\n');
  } catch (error) {
    console.error('初始化管理员账户失败:', error);
    throw error;
  }
}

/**
 * 初始化工会简介等站点信息
 */
async function initSiteInfo() {
  console.log('开始初始化站点信息...\n');

  try {
    // 检查是否已有工会简介
    const existingIntro = await prisma.siteInfo.findUnique({
      where: { key: 'union_introduction' },
    });

    if (existingIntro) {
      console.log('数据库中已存在工会简介，跳过创建');
      return;
    }

    // 默认工会简介
    const defaultUnionIntroduction = `<p>西安高新区总工会成立于2019年11月，自成立以来，始终坚守以职工为中心的服务导向，聚焦职工急难愁盼，扎实推进维权服务、困难帮扶、法律援助、心理咨询等一系列暖心举措，着力打造职工信赖依靠的"职工之家"。</p><p class="mt-4">与此同时，工会积极锚定区域发展大局，充分发挥桥梁纽带作用，团结动员区内广大职工投身科技创新与经济建设主战场。通过常态化组织劳动竞赛、技能培训、文体活动等多元化载体，既有效提升了职工队伍的专业素养与综合能力，又丰富了职工的精神文化生活，为加快推动"四个高新"高质量发展和世界领先科技园区建设注入工会力量。</p>`;

    await prisma.siteInfo.create({
      data: {
        key: 'union_introduction',
        content: defaultUnionIntroduction,
      },
    });

    console.log('✓ 成功创建工会简介');
  } catch (error) {
    console.error('初始化站点信息失败:', error);
    throw error;
  }
}

/**
 * 初始化示例数据
 */
async function initSampleData() {
  console.log('开始初始化示例数据...\n');

  try {
    // 示例新闻数据
    const sampleNews = [
      {
        title: '西安高新区总工会召开2026年度工作会议',
        category: '动态',
        content: `2026年4月9日，西安高新区总工会在管委会会议室召开2026年度工作会议。
会议总结了2025年工会工作成果，部署了2026年重点工作任务。
区总工会主席、副主席及各部门负责人参加了会议。
会议强调，要深入贯彻党的二十大精神，切实维护职工合法权益，
推动高新区工会工作再上新台阶。`,
        imageUrl: null,
        isCarousel: true,
        carouselOrder: 1,
      },
      {
        title: '关于开展2026年"五一"劳动节系列活动的通知',
        category: '公告',
        content: `各基层工会组织：

为庆祝"五一"国际劳动节，弘扬劳模精神、劳动精神、工匠精神，
高新区总工会决定在全区范围内开展"五一"劳动节系列活动。
现将有关事项通知如下：

一、活动主题
致敬劳动者 奋进新征程

二、活动时间
2026年4月20日-5月10日

三、活动内容
1. 劳模先进事迹宣讲会
2. 职工技能大赛
3. 文艺汇演
4. 职工篮球比赛

请各基层工会组织积极响应，精心组织，确保活动圆满成功。

西安高新区总工会
2026年4月9日`,
        imageUrl: null,
        isCarousel: true,
        carouselOrder: 2,
      },
      {
        title: '高新区职工服务中心正式启用',
        category: '动态',
        content: `4月8日，西安高新区职工服务中心正式启用。
该中心位于锦业路1号，服务面积2000平方米，
设有法律服务、心理咨询、困难帮扶等多个服务窗口。
中心的启用将进一步优化职工服务资源配置，
为全区职工提供更加便捷高效的服务。`,
        imageUrl: null,
        isCarousel: true,
        carouselOrder: 3,
      },
      {
        title: '关于印发《高新区职工技能提升补贴办法》的通知',
        category: '政策',
        content: `各企业工会：

为鼓励职工提升职业技能水平，经研究，特制定《高新区职工技能提升补贴办法》。
现印发给你们，请认真贯彻执行。

本办法自发布之日起施行，适用于高新区辖区内所有企业职工。
职工参加职业技能培训并取得相应证书的，可申请500-3000元不等的补贴。

详细办法请登录高新区总工会官网查看。

西安高新区总工会
2026年4月1日`,
        imageUrl: null,
        isCarousel: true,
        carouselOrder: 4,
      },
    ];

    // 检查是否已有示例数据
    const existingNews = await prisma.news.findFirst();

    if (existingNews) {
      console.log('数据库中已存在新闻数据，跳过示例数据创建');
      return;
    }

    // 插入示例新闻
    const insertedNews = await prisma.news.createMany({
      data: sampleNews,
    });

    console.log(`✓ 成功创建 ${insertedNews.count} 条示例新闻`);

    // 示例友情链接数据
    const sampleLinks = [
      { title: '全国总工会', url: 'http://www.acftu.org/', isRequired: false, orderIndex: 1 },
      { title: '陕西省总工会', url: 'http://www.shxgh.org/', isRequired: false, orderIndex: 2 },
      { title: '西安市总工会', url: 'http://www.xagh.org/', isRequired: false, orderIndex: 3 },
      { title: '西安高新区管委会', url: 'http://www.xdz.gov.cn/', isRequired: false, orderIndex: 4 },
      { title: '中国教育网', url: 'http://www.edu.cn/', isRequired: true, orderIndex: 5 },
      { title: '陕西教育网', url: 'http://www.snedu.gov.cn/', isRequired: true, orderIndex: 6 },
    ];

    // 检查是否已有友情链接
    const existingLinks = await prisma.friendlyLink.findFirst();

    if (existingLinks) {
      console.log('数据库中已存在友情链接数据，跳过示例数据创建');
      return;
    }

    // 插入示例友情链接
    await prisma.friendlyLink.createMany({
      data: sampleLinks,
    });

    console.log(`✓ 成功创建 6 条示例友情链接`);
    console.log('\n示例数据初始化完成！\n');
  } catch (error) {
    console.error('初始化示例数据失败:', error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('西安高新区总工会 - 数据库初始化脚本');
  console.log('========================================\n');

  try {
    // 初始化管理员
    await initAdmin();

    // 初始化站点信息
    await initSiteInfo();

    // 询问是否创建示例数据
    console.log('是否创建示例数据？(包含示例新闻和友情链接)');
    console.log('提示: 在生产环境请选择 "否"');

    // 自动创建示例数据
    await initSampleData();

    console.log('========================================');
    console.log('✓ 数据库初始化完成！');
    console.log('========================================\n');
    console.log('管理后台登录地址: http://localhost:3000/admin/login');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('\n请登录后立即修改默认密码！\n');
  } catch (error) {
    console.error('\n初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行主函数
main();
