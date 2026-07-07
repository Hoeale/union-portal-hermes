import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import { withCsrfProtection } from '@/lib/csrf';
import { deleteCache, CACHE_KEYS } from '@/lib/cache';

// 强制动态渲染，因为 PUT 方法需要处理用户输入
export const dynamic = 'force-dynamic';

// 默认站点信息
const DEFAULT_SITE_INFO = {
  address: '陕西省西安市高新区锦业路都市之门A座1410室',
  phone: '',
};

// 默认V2 Header配置
const DEFAULT_V2_HEADER = {
  title: '西安高新区总工会',
  subtitle: 'XI\'AN HIGH-TECH ZONE FEDERATION OF TRADE UNIONS',
  logo: '/logo.png',
  background_image: '/header-bg.png',
};

// 默认V2 TopBar配置
const DEFAULT_V2_TOPBAR = {
  show_welcome: true,
  welcome_message: '欢迎访问西安高新区总工会门户网站',
  show_links: true,
  links: [
    { text: '不忘初心·牢记使命', url: '#' },
  ],
};

// 默认V2服务面板配置
const DEFAULT_V2_SERVICE_PANEL = {
  title: '工会服务',
  items: [
    { icon: 'weixin', label: '公众号', href: '#' },
  ],
  qrcode_image: '/qrcode-placeholder.png',
  qrcode_text: '关注我们的公众号',
};

// 默认V2服务网格配置
const DEFAULT_V2_SERVICE_GRID = {
  title: '办事服务',
  more_link: '/services',
  items: [
    { icon: 'map', label: '工会地图', href: '/services/map' },
    { icon: 'user-plus', label: '入会', href: '/services/join' },
    { icon: 'exchange-alt', label: '转会', href: '/services/transfer' },
    { icon: 'comment-dots', label: '职工诉求', href: '/services/appeal' },
    { icon: 'graduation-cap', label: '求学圆梦', href: '/services/education' },
    { icon: 'female', label: '女职工评优', href: '/services/female' },
    { icon: 'heart', label: '困难职工', href: '/services/difficulty' },
    { icon: 'ellipsis-h', label: '更多服务', href: '/services' },
  ],
  buttons: [],
};

// 默认页脚配置
const DEFAULT_FOOTER_CONFIG = {
  organization_name: '西安高新区总工会',
  organization_name_en: "Xi'an High-Tech Zones Federation of Trade Unions",
  organization_description: '维护职工合法权益，竭诚服务职工群众，促进劳动关系和谐稳定，推动高新区高质量发展。',
  logo_url: '/logo.png',
  contact_email: 'contact@example.com',
  contact_email_label: '联系我们',
  copyright_text: '西安高新区总工会',
  copyright_show_year: true,
  copyright_reserved: '版权所有',
  show_footer: true,
  show_friendly_links: true,
  privacy_policy_url: '#',
  terms_url: '#',
  sitemap_url: '#',
};

// 默认布局配置
const DEFAULT_LAYOUT_CONFIG = {
  modules: [
    { id: 'carousel', name: '轮播图', visible: true, zone: 'top', order: 0 },
    { id: 'news', name: '工会动态', visible: true, zone: 'left', order: 0 },
    { id: 'services', name: '办事服务', visible: true, zone: 'left', order: 1 },
    { id: 'announcements', name: '公告栏', visible: true, zone: 'right', order: 0 },
    { id: 'videos', name: '视频中心', visible: true, zone: 'bottom', order: 0 },
  ],
  nav_items: [
    { id: 'home', name: '首页', href: '/', visible: true, order: 0 },
    { id: 'about', name: '工会概况', href: '/about', visible: true, order: 1 },
    { id: 'news', name: '新闻中心', href: '/news', visible: true, order: 2 },
    { id: 'videos', name: '视频中心', href: '/videos', visible: false, order: 3 },
    { id: 'services', name: '办事服务', href: '/services', visible: true, order: 4 },
    { id: 'policies', name: '政策文件', href: '/policies', visible: true, order: 5 },
    { id: 'workers', name: '最美劳动者', href: '/workers', visible: true, order: 6 },
  ],
};

// GET - 获取站点信息
export async function GET(request: NextRequest) {
  // 使用 cookies() 强制动态路由，确保 PUT 方法可用
  const { cookies } = await import('next/headers');
  await cookies();
  
  try {
    const [siteInfoConfig, v2HeaderConfig, v2ServicePanelConfig, v2ServiceGridConfig, footerConfig, layoutConfig] = await Promise.all([
      prisma.siteInfo.findUnique({ where: { key: 'site_info' } }),
      prisma.siteInfo.findUnique({ where: { key: 'v2_header' } }),
      prisma.siteInfo.findUnique({ where: { key: 'v2_service_panel' } }),
      prisma.siteInfo.findUnique({ where: { key: 'v2_service_grid' } }),
      prisma.siteInfo.findUnique({ where: { key: 'footer_config' } }),
      prisma.siteInfo.findUnique({ where: { key: 'layout_config' } }),
    ]);

    return NextResponse.json({
      site_info: siteInfoConfig ? JSON.parse(siteInfoConfig.content) : DEFAULT_SITE_INFO,
      v2_header: v2HeaderConfig ? JSON.parse(v2HeaderConfig.content) : DEFAULT_V2_HEADER,
      v2_service_panel: v2ServicePanelConfig ? JSON.parse(v2ServicePanelConfig.content) : DEFAULT_V2_SERVICE_PANEL,
      v2_service_grid: v2ServiceGridConfig ? JSON.parse(v2ServiceGridConfig.content) : DEFAULT_V2_SERVICE_GRID,
      footer_config: footerConfig ? JSON.parse(footerConfig.content) : DEFAULT_FOOTER_CONFIG,
      layout_config: layoutConfig ? JSON.parse(layoutConfig.content) : DEFAULT_LAYOUT_CONFIG,
    });
  } catch (error) {
    console.error('Error fetching site info:', error);
    return NextResponse.json({
      site_info: DEFAULT_SITE_INFO,
      v2_header: DEFAULT_V2_HEADER,
      v2_service_panel: DEFAULT_V2_SERVICE_PANEL,
      v2_service_grid: DEFAULT_V2_SERVICE_GRID,
      footer_config: DEFAULT_FOOTER_CONFIG,
      layout_config: DEFAULT_LAYOUT_CONFIG,
    });
  }
}

// PUT - 更新站点信息
export async function PUT(request: NextRequest) {
  try {
    // 认证检查
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: '未授权访问，请先登录' }, { status: 401 });
    }

    // CSRF 保护
    const csrfError = await withCsrfProtection(request);
    if (csrfError) return csrfError;

    const body = await request.json();
    
    // 支持更新所有配置 key
    const allowedKeys = ['site_info', 'footer_config', 'v2_header', 'v2_service_panel', 'v2_service_grid', 'layout_config'];
    const updates = [];
    
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        updates.push(
          prisma.siteInfo.upsert({
            where: { key },
            update: { content: JSON.stringify(body[key]) },
            create: { key, content: JSON.stringify(body[key]) },
          })
        );
      }
    }
    
    // 兼容旧版单条更新
    if (updates.length === 0 && body.key) {
      const key = body.key;
      const data = body.data || body;
      updates.push(
        prisma.siteInfo.upsert({
          where: { key },
          update: { content: JSON.stringify(data) },
          create: { key, content: JSON.stringify(data) },
        })
      );
    }
    
    if (updates.length > 0) {
      await Promise.all(updates);
      
      // 清除布局配置缓存，确保前端立即读取新数据
      await deleteCache(CACHE_KEYS.LAYOUT_CONFIG);
    }

    return NextResponse.json({
      success: true,
      message: '配置已保存',
    });
  } catch (error) {
    console.error('Error updating site info:', error);
    return NextResponse.json(
      { success: false, error: '更新站点信息失败' },
      { status: 500 }
    );
  }
}
