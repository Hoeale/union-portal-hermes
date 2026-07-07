import { prisma } from '../lib/prisma';

async function updateLayoutConfig() {
  try {
    // 获取现有的 home_sections 配置
    const config = await prisma.siteInfo.findUnique({
      where: { key: 'home_sections' },
    });

    if (config) {
      const homeSections = JSON.parse(config.content);
      
      // 找到 notice-panel 并更新 limit
      const noticePanel = homeSections.find((s: any) => s.id === 'notice-panel');
      if (noticePanel && noticePanel.config) {
        noticePanel.config.limit = 6;
        // 删除不再使用的 category 字段
        delete noticePanel.config.category;
        
        // 更新数据库
        await prisma.siteInfo.update({
          where: { key: 'home_sections' },
          data: { content: JSON.stringify(homeSections) },
        });
        
        console.log('已更新 home_sections 配置，通知公告显示数量改为 6');
      } else {
        console.log('未找到 notice-panel 配置');
      }
    } else {
      console.log('数据库中没有 home_sections 配置，使用默认配置');
    }
  } catch (error) {
    console.error('更新失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLayoutConfig();
