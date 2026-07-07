import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';

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

export async function POST() {
  try {
    // 认证检查
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: '未授权访问，请先登录' }, { status: 401 });
    }

    // 查找工会地图服务
    const service = await prisma.service.findFirst({
      where: { title: { contains: '工会地图' } },
    });

    if (!service) {
      return NextResponse.json({ success: false, message: '未找到工会地图服务' }, { status: 404 });
    }

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

    return NextResponse.json({
      success: true,
      message: '数据初始化成功',
      data: {
        introText: updated.introText?.substring(0, 50),
        featuresCount: JSON.parse(updated.features || '[]').length,
        stepsCount: JSON.parse(updated.steps || '[]').length,
        tipsCount: JSON.parse(updated.tips || '[]').length,
      },
    });
  } catch (error) {
    console.error('初始化数据失败:', error);
    return NextResponse.json({ success: false, message: '初始化失败' }, { status: 500 });
  }
}
