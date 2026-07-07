import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 工会地图的结构化数据
const MAP_SERVICE_DATA = {
  introText: '通过工会地图，您可以方便地查找附近的工会组织，了解各工会的服务范围和联系方式。无论您身在何处，都能快速找到就近的工会服务站点，享受工会提供的各项服务。',
  features: JSON.stringify([
    { title: '查找工会', description: '根据您的位置，查找附近的工会组织', color: 'blue' },
    { title: '服务范围', description: '了解各工会的服务覆盖区域和业务范围', color: 'green' },
    { title: '联系方式', description: '获取工会的联系电话、地址等详细信息', color: 'orange' },
    { title: '导航服务', description: '一键导航到工会所在地', color: 'purple' },
  ]),
  steps: JSON.stringify([
    { order: 1, title: '打开地图', description: '进入工会地图功能' },
    { order: 2, title: '定位位置', description: '系统自动定位当前位置' },
    { order: 3, title: '查找工会', description: '查看附近工会组织' },
    { order: 4, title: '前往办理', description: '前往就近工会办理业务' },
  ]),
  tips: JSON.stringify([
    '请确保已开启设备定位功能，以便准确定位您的位置',
    '建议在前往工会前先电话联系，确认办公时间和所需材料',
    '所有业务均需到现场办理，请携带齐全材料前往',
  ]),
};

async function main() {
  console.log('开始初始化工会地图服务数据...\n');

  // 查找工会地图服务
  const service = await prisma.service.findFirst({
    where: { title: { contains: '工会地图' } },
  });

  if (!service) {
    console.log('未找到工会地图服务，跳过');
    return;
  }

  console.log(`找到服务：${service.title}`);
  console.log('当前数据状态：');
  console.log('- introText:', service.introText ? '有数据' : '空');
  console.log('- features:', service.features ? '有数据' : '空');
  console.log('- steps:', service.steps ? '有数据' : '空');
  console.log('- tips:', service.tips ? '有数据' : '空');
  console.log('');

  // 更新数据
  const updated = await prisma.service.update({
    where: { id: service.id },
    data: {
      introText: MAP_SERVICE_DATA.introText,
      features: MAP_SERVICE_DATA.features,
      steps: MAP_SERVICE_DATA.steps,
      tips: MAP_SERVICE_DATA.tips,
      showIntro: true,
      showFeatures: true,
      showSteps: true,
      showTips: true,
    },
  });

  console.log('✅ 数据更新成功！');
  console.log('');
  console.log('更新后的数据：');
  console.log('- 简介文本：', updated.introText?.substring(0, 50) + '...');
  
  const features = JSON.parse(updated.features || '[]');
  console.log('- 服务特点：', features.length, '项');
  features.forEach((f: any) => console.log(`  • ${f.title}: ${f.description}`));
  
  const steps = JSON.parse(updated.steps || '[]');
  console.log('- 流程步骤：', steps.length, '项');
  steps.forEach((s: any) => console.log(`  ${s.order}. ${s.title}: ${s.description}`));
  
  const tips = JSON.parse(updated.tips || '[]');
  console.log('- 温馨提示：', tips.length, '项');
  tips.forEach((t: string) => console.log(`  • ${t}`));
}

main()
  .catch((e) => {
    console.error('❌ 错误：', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
