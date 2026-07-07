/**
 * 办事服务数据种子脚本
 * 与前端的 8 个服务入口保持一致
 *
 * 使用方法:
 * npx tsx scripts/seed-services.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

// 办事服务数据 - 与前端 service-config.ts 保持一致
const serviceData = [
  {
    title: '工会地图',
    description: '查找附近工会组织，了解各工会的服务范围和联系方式',
    process: '<h3>使用流程</h3><ol><li>打开工会地图页面</li><li>输入您的位置或允许获取当前位置</li><li>查看附近的工会组织</li><li>点击工会组织查看详情和联系方式</li></ol>',
    requirements: '<p>无需准备材料，直接访问即可。</p>',
    isActive: true,
    orderIndex: 0,
    // 结构化字段
    introText: '通过工会地图，您可以方便地查找附近的工会组织，了解各工会的服务范围和联系方式。无论您身在何处，都能快速找到就近的工会服务站点，享受工会提供的各项服务。',
    features: JSON.stringify([
      { title: '查找工会', description: '根据您的位置，查找附近的工会组织', color: 'blue' },
      { title: '服务范围', description: '了解各工会的服务覆盖区域和业务范围', color: 'green' },
      { title: '联系方式', description: '获取工会的联系电话、地址等详细信息', color: 'orange' },
      { title: '导航服务', description: '一键导航到工会所在地', color: 'purple' },
    ]),
    steps: JSON.stringify([
      { order: 1, title: '打开地图', description: '进入工会地图页面' },
      { order: 2, title: '定位搜索', description: '允许定位或手动输入位置' },
      { order: 3, title: '查看结果', description: '浏览附近的工会组织' },
    ]),
    tips: JSON.stringify([
      '请确保您的浏览器允许获取位置信息',
      '建议使用最新版本的浏览器以获得最佳体验',
      '如遇定位不准确，可手动输入地址搜索',
    ]),
  },
  {
    title: '入会申请',
    description: '申请加入工会，享受工会服务和权益保障',
    process: '<h3>入会流程</h3><ol><li>提交入会申请</li><li>准备相关材料</li><li>现场审核办理</li><li>领取会员证</li></ol>',
    requirements: '<h3>所需材料</h3><ul><li>身份证原件及复印件</li><li>劳动合同或工作证明</li><li>近期一寸免冠照片2张</li><li>入会申请表</li></ul>',
    isActive: true,
    orderIndex: 1,
    // 结构化字段
    introText: '加入工会，您将享受到工会提供的各项服务和权益保障。工会是职工之家，为您提供法律援助、困难帮扶、技能培训等多项服务。',
    features: JSON.stringify([
      { title: '权益保障', description: '享受工会提供的法律援助和权益维护服务', color: 'red' },
      { title: '困难帮扶', description: '遇到困难时可申请工会帮扶救助', color: 'orange' },
      { title: '技能培训', description: '参加工会组织的各类技能提升培训', color: 'blue' },
      { title: '文化活动', description: '参与工会组织的文体活动和福利发放', color: 'green' },
    ]),
    steps: JSON.stringify([
      { order: 1, title: '在线申请', description: '填写入会申请表' },
      { order: 2, title: '准备材料', description: '准备身份证、劳动合同等材料' },
      { order: 3, title: '现场审核', description: '到工会现场提交材料审核' },
      { order: 4, title: '领取会员证', description: '审核通过后领取会员证' },
    ]),
    tips: JSON.stringify([
      '请确保填写的信息真实准确',
      '准备好所有材料后再到现场办理',
      '会员证请妥善保管，享受服务时需出示',
    ]),
  },
  {
    title: '转会申请',
    description: '工会关系转移办理，保障会员权益连续性',
    process: '<h3>转会流程</h3><ol><li>提交转移申请</li><li>会籍接续办理</li><li>权益延续确认</li><li>档案转移</li></ol>',
    requirements: '<h3>所需材料</h3><ul><li>原工会会员证</li><li>新单位工作证明</li><li>工会关系转移申请表</li><li>身份证复印件</li></ul>',
    isActive: true,
    orderIndex: 2,
    // 结构化字段
    introText: '工作单位变更时，您可以将工会关系转移到新单位，确保会员权益的连续性。转移后，您的会籍、缴费记录等信息将得到保留。',
    features: JSON.stringify([
      { title: '会籍保留', description: '转会后原会籍信息完整保留', color: 'blue' },
      { title: '权益延续', description: '会员权益不受单位变更影响', color: 'green' },
      { title: '快速办理', description: '线上线下结合，办理便捷高效', color: 'orange' },
      { title: '档案转移', description: '会员档案同步转移至新单位', color: 'purple' },
    ]),
    steps: JSON.stringify([
      { order: 1, title: '提交申请', description: '填写工会关系转移申请' },
      { order: 2, title: '原单位确认', description: '原工会出具转会证明' },
      { order: 3, title: '新单位接收', description: '新工会接收并办理入会' },
      { order: 4, title: '完成转移', description: '领取新会员证，转会完成' },
    ]),
    tips: JSON.stringify([
      '请在离职后30天内办理转会手续',
      '确保原单位工会已出具转会证明',
      '转会期间会员权益不受影响',
    ]),
  },
  {
    title: '职工诉求',
    description: '反映您的意见建议，我们竭诚为您服务',
    process: '<h3>诉求处理流程</h3><ol><li>提交诉求申请</li><li>意见建议反馈</li><li>处理进度查询</li><li>结果反馈通知</li></ol>',
    requirements: '<h3>提交内容</h3><ul><li>诉求标题</li><li>详细描述诉求内容</li><li>相关证明材料（如有）</li><li>联系方式以便反馈</li></ul>',
    isActive: true,
    orderIndex: 3,
    // 结构化字段
    introText: '职工诉求通道是工会倾听职工心声、维护职工权益的重要渠道。您可以通过此渠道反映工作中遇到的问题、提出意见建议，工会将及时受理并反馈处理结果。',
    features: JSON.stringify([
      { title: '在线提交', description: '随时随地提交您的诉求', color: 'blue' },
      { title: '进度查询', description: '实时查看诉求处理进度', color: 'green' },
      { title: '隐私保护', description: '严格保护您的个人信息', color: 'purple' },
      { title: '及时反馈', description: '专人跟进，及时反馈结果', color: 'orange' },
    ]),
    steps: JSON.stringify([
      { order: 1, title: '填写诉求', description: '详细描述您的诉求内容' },
      { order: 2, title: '提交申请', description: '提交诉求并等待受理' },
      { order: 3, title: '工会处理', description: '工会调查核实并处理' },
      { order: 4, title: '结果反馈', description: '收到处理结果通知' },
    ]),
    tips: JSON.stringify([
      '请如实填写诉求内容，提供相关证据',
      '留下准确的联系方式以便反馈',
      '复杂诉求可能需要较长时间处理，请耐心等待',
    ]),
  },
  {
    title: '求学圆梦',
    description: '工会助力职工学历提升，实现求学梦想',
    process: '<h3>申请流程</h3><ol><li>了解学历提升补贴政策</li><li>选择合作院校和专业</li><li>提交报名申请</li><li>参加入学考试</li><li>享受学历提升补贴</li></ol>',
    requirements: '<h3>申请条件</h3><ul><li>工会会员身份</li><li>在职职工</li><li>符合报考学历要求</li><li>单位同意报考证明</li></ul>',
    isActive: true,
    orderIndex: 4,
    // 结构化字段
    introText: '求学圆梦行动是工会帮助职工提升学历、实现职业发展的重要项目。符合条件的职工可享受学费补贴，通过在职学习获得国家承认的学历证书。',
    features: JSON.stringify([
      { title: '学费补贴', description: '符合条件的职工可享受学费补贴', color: 'green' },
      { title: '合作院校', description: '多所知名院校合作，专业丰富', color: 'blue' },
      { title: '在职学习', description: '灵活的学习方式，工作学习两不误', color: 'orange' },
      { title: '国家承认', description: '学历证书国家承认，学信网可查', color: 'purple' },
    ]),
    steps: JSON.stringify([
      { order: 1, title: '了解政策', description: '咨询学历提升补贴政策' },
      { order: 2, title: '选择院校', description: '选择合作院校和专业' },
      { order: 3, title: '提交申请', description: '提交报名申请材料' },
      { order: 4, title: '参加考试', description: '参加入学考试并录取' },
      { order: 5, title: '享受补贴', description: '入学后申请学费补贴' },
    ]),
    tips: JSON.stringify([
      '提前了解合作院校和专业设置',
      '准备好学历证明和工作证明',
      '补贴申请有时间限制，请及时办理',
    ]),
  },
  {
    title: '女职工评优申报',
    description: '评选表彰优秀女职工，展现巾帼风采',
    process: '<h3>评选流程</h3><ol><li>优秀女职工申报</li><li>巾帼建功评选</li><li>三八红旗手推荐</li><li>荣誉表彰</li></ol>',
    requirements: '<h3>申报材料</h3><ul><li>申报表</li><li>个人事迹材料</li><li>工作单位推荐意见</li><li>相关荣誉证书复印件</li></ul>',
    isActive: true,
    orderIndex: 5,
    // 结构化字段
    introText: '女职工评优申报是展示女职工风采、弘扬劳模精神的重要平台。通过评选表彰，激励广大女职工立足岗位、建功立业，为社会发展贡献巾帼力量。',
    features: JSON.stringify([
      { title: '荣誉表彰', description: '获得工会系统荣誉称号', color: 'pink' },
      { title: '事迹宣传', description: '优秀事迹广泛宣传报道', color: 'purple' },
      { title: '典型引领', description: '发挥先进典型的示范引领作用', color: 'red' },
      { title: '权益保障', description: '优先享受工会各项服务', color: 'orange' },
    ]),
    steps: JSON.stringify([
      { order: 1, title: '个人申报', description: '填写申报表，准备事迹材料' },
      { order: 2, title: '单位推荐', description: '所在单位审核并出具推荐意见' },
      { order: 3, title: '工会评审', description: '工会组织专家评审' },
      { order: 4, title: '公示表彰', description: '公示无异议后予以表彰' },
    ]),
    tips: JSON.stringify([
      '事迹材料要真实、具体、生动',
      '提供相关荣誉证书作为支撑材料',
      '注意申报截止时间，提前准备材料',
    ]),
  },
  {
    title: '困难职工申报',
    description: '工会帮扶在您身边，共渡难关温暖相伴',
    process: '<h3>申报流程</h3><ol><li>困难职工认定</li><li>应急救助申请</li><li>长期帮扶计划</li><li>子女助学帮扶</li></ol>',
    requirements: '<h3>所需材料</h3><ul><li>困难职工认定表</li><li>家庭收入证明</li><li>医疗诊断证明（因病致困）</li><li>身份证和工会会员证复印件</li></ul>',
    isActive: true,
    orderIndex: 6,
    // 结构化字段
    introText: '困难职工帮扶是工会关心关爱职工的重要举措。对于因各种原因导致生活困难的职工，工会将提供应急救助、定期帮扶、子女助学等多种形式的帮助。',
    features: JSON.stringify([
      { title: '应急救助', description: '突发困难时提供紧急救助金', color: 'red' },
      { title: '定期帮扶', description: '建立长期帮扶机制，定期慰问', color: 'orange' },
      { title: '子女助学', description: '困难职工子女享受助学金', color: 'blue' },
      { title: '医疗帮扶', description: '因病致困职工享受医疗帮扶', color: 'green' },
    ]),
    steps: JSON.stringify([
      { order: 1, title: '提交申请', description: '填写困难职工认定申请表' },
      { order: 2, title: '材料审核', description: '提交相关证明材料' },
      { order: 3, title: '入户调查', description: '工会工作人员入户核实' },
      { order: 4, title: '认定帮扶', description: '审核通过后纳入帮扶范围' },
    ]),
    tips: JSON.stringify([
      '如实提供家庭收入和支出情况',
      '保留好医疗诊断证明和费用单据',
      '困难情况变化时及时向工会报告',
    ]),
  },
  {
    title: '更多服务',
    description: '查看全部服务项目，持续更新中',
    process: '<p>更多服务项目持续更新中，敬请关注。</p>',
    requirements: '<p>敬请期待</p>',
    isActive: true,
    orderIndex: 7,
    // 结构化字段
    introText: '工会将持续推出更多服务项目，为职工提供更加全面、便捷的服务。敬请关注工会网站和公众号，获取最新服务信息。',
    features: JSON.stringify([
      { title: '服务拓展', description: '不断拓展服务领域和内容', color: 'blue' },
      { title: '便捷办理', description: '线上线下结合，办理更便捷', color: 'green' },
      { title: '个性化服务', description: '根据职工需求提供个性化服务', color: 'purple' },
      { title: '持续优化', description: '根据反馈不断优化服务体验', color: 'orange' },
    ]),
    steps: JSON.stringify([
      { order: 1, title: '关注动态', description: '关注工会网站和公众号' },
      { order: 2, title: '了解服务', description: '查看新推出的服务项目' },
      { order: 3, title: '申请办理', description: '根据需要申请相关服务' },
    ]),
    tips: JSON.stringify([
      '关注工会公众号获取最新服务信息',
      '有任何服务需求可向工会反映',
      '您的建议是我们改进服务的动力',
    ]),
  },
];

async function main() {
  console.log('开始同步办事服务数据...');

  try {
    // 使用 upsert 确保数据存在，避免 deleteMany 导致的短暂数据丢失
    for (const service of serviceData) {
      const upserted = await prisma.service.upsert({
        where: { title: service.title },
        update: {
          description: service.description,
          process: service.process,
          requirements: service.requirements,
          isActive: service.isActive,
          orderIndex: service.orderIndex,
          // 结构化字段
          introText: service.introText,
          features: service.features,
          steps: service.steps,
          tips: service.tips,
        },
        create: service,
      });
      console.log(`✓ 同步服务: ${upserted.title}`);
    }

    console.log('\n办事服务数据同步完成！');
    console.log(`共创建 ${serviceData.length} 条服务记录`);
  } catch (error) {
    console.error('同步失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
/**
 * 办事服务数据种子脚本
 * 与前端的 8 个服务入口保持一致
 *
 * 使用方法:
 * npx tsx scripts/seed-services.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

// 办事服务数据 - 与前端 service-config.ts 保持一致
const serviceData = [
  {
    title: '工会地图',
    description: '查找附近工会组织',
    process: '<h3>使用流程</h3><ol><li>打开工会地图页面</li><li>输入您的位置或允许获取当前位置</li><li>查看附近的工会组织</li><li>点击工会组织查看详情和联系方式</li></ol>',
    requirements: '<p>无需准备材料，直接访问即可。</p>',
    isActive: true,
    orderIndex: 0,
  },
  {
    title: '入会申请',
    description: '申请加入工会',
    process: '<h3>入会流程</h3><ol><li>提交入会申请</li><li>准备相关材料</li><li>现场审核办理</li><li>领取会员证</li></ol>',
    requirements: '<h3>所需材料</h3><ul><li>身份证原件及复印件</li><li>劳动合同或工作证明</li><li>近期一寸免冠照片2张</li><li>入会申请表</li></ul>',
    isActive: true,
    orderIndex: 1,
  },
  {
    title: '工会关系转移',
    description: '工会关系转移办理',
    process: '<h3>转会流程</h3><ol><li>提交转移申请</li><li>会籍接续办理</li><li>权益延续确认</li><li>档案转移</li></ol>',
    requirements: '<h3>所需材料</h3><ul><li>原工会会员证</li><li>新单位工作证明</li><li>工会关系转移申请表</li><li>身份证复印件</li></ul>',
    isActive: true,
    orderIndex: 2,
  },
  {
    title: '职工诉求',
    description: '反映您的意见建议',
    process: '<h3>诉求处理流程</h3><ol><li>提交诉求申请</li><li>意见建议反馈</li><li>处理进度查询</li><li>结果反馈通知</li></ol>',
    requirements: '<h3>提交内容</h3><ul><li>诉求标题</li><li>详细描述诉求内容</li><li>相关证明材料（如有）</li><li>联系方式以便反馈</li></ul>',
    isActive: true,
    orderIndex: 3,
  },
  {
    title: '求学圆梦',
    description: '职工学历提升计划',
    process: '<h3>申请流程</h3><ol><li>了解学历提升补贴政策</li><li>选择合作院校和专业</li><li>提交报名申请</li><li>参加入学考试</li><li>享受学历提升补贴</li></ol>',
    requirements: '<h3>申请条件</h3><ul><li>工会会员身份</li><li>在职职工</li><li>符合报考学历要求</li><li>单位同意报考证明</li></ul>',
    isActive: true,
    orderIndex: 4,
  },
  {
    title: '女职工评优申报',
    description: '女职工优秀评选',
    process: '<h3>评选流程</h3><ol><li>优秀女职工申报</li><li>巾帼建功评选</li><li>三八红旗手推荐</li><li>荣誉表彰</li></ol>',
    requirements: '<h3>申报材料</h3><ul><li>申报表</li><li>个人事迹材料</li><li>工作单位推荐意见</li><li>相关荣誉证书复印件</li></ul>',
    isActive: true,
    orderIndex: 5,
  },
  {
    title: '困难职工申报',
    description: '困难帮扶申请',
    process: '<h3>申报流程</h3><ol><li>困难职工认定</li><li>应急救助申请</li><li>长期帮扶计划</li><li>子女助学帮扶</li></ol>',
    requirements: '<h3>所需材料</h3><ul><li>困难职工认定表</li><li>家庭收入证明</li><li>医疗诊断证明（因病致困）</li><li>身份证和工会会员证复印件</li></ul>',
    isActive: true,
    orderIndex: 6,
  },
  {
    title: '更多服务',
    description: '查看全部服务项目',
    process: '<p>更多服务项目持续更新中，敬请关注。</p>',
    requirements: '<p>敬请期待</p>',
    isActive: true,
    orderIndex: 7,
  },
];

async function main() {
  console.log('开始同步办事服务数据...');

  try {
    // 使用 upsert 确保数据存在，避免 deleteMany 导致的短暂数据丢失
    for (const service of serviceData) {
      const upserted = await prisma.service.upsert({
        where: { title: service.title },
        update: {
          description: service.description,
          process: service.process,
          requirements: service.requirements,
          isActive: service.isActive,
          orderIndex: service.orderIndex,
        },
        create: service,
      });
      console.log(`✓ 同步服务: ${upserted.title}`);
    }

    console.log('\n办事服务数据同步完成！');
    console.log(`共创建 ${serviceData.length} 条服务记录`);
  } catch (error) {
    console.error('同步失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
