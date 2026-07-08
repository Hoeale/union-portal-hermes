import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

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

// 默认V2服务面板配置
const DEFAULT_V2_SERVICE_PANEL = {
  title: '欢迎关注',
  qrcode_text: '扫码关注西安高新工会',
  qrcode_image_1: '/uploads/wechat-qrcode.jpg',
  qrcode_label_1: '微信公众号',
  qrcode_image_2: '/uploads/video-qrcode.jpg',
  qrcode_label_2: '视频号',
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

// 默认首页区块配置
const DEFAULT_HOME_SECTIONS = [
  { id: 'header', name: '顶部导航栏', description: '包含Logo、导航菜单等', visible: true, order: 0, config: {} },
  { id: 'hero-carousel', name: '头条轮播区', description: '首页顶部图片轮播区域', visible: true, order: 1, config: { limit: 5, sideLimit: 5, autoRotate: true, interval: 5000 } },
  { id: 'news-sections', name: '新闻动态区', description: '工会新闻、时政新闻等', visible: false, order: 2, config: { layout: 'horizontal', sections: [{ title: '新闻动态', category: '动态', limit: 5, icon: 'rss' }, { title: '区总动态', category: '动态', limit: 5, icon: 'users' }] } },
  { id: 'notice-panel', name: '通知要闻+服务面板', description: '通知要闻、工会动态', visible: true, order: 3, config: { title: '通知要闻/公示公告', limit: 6, showServicePanel: true } },
  { id: 'service-grid', name: '办事服务区', description: '工会服务入口网格', visible: true, order: 4, config: { title: '办事服务', iconCount: 8, buttonCount: 2 } },
];

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

// GET - 获取布局配置（公开，无需认证）
export async function GET() {
  try {
    // 检查缓存
    const cacheKey = CACHE_KEYS.LAYOUT_CONFIG;
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const [layoutConfig, siteInfoConfig, v2HeaderConfig, v2ServicePanelConfig, v2ServiceGridConfig, homeSectionsConfig, footerConfig, feedbackButtonConfig] = await Promise.all([
      prisma.siteInfo.findUnique({
        where: { key: 'layout_config' },
      }),
      prisma.siteInfo.findUnique({
        where: { key: 'site_info' },
      }),
      prisma.siteInfo.findUnique({
        where: { key: 'v2_header' },
      }),
      prisma.siteInfo.findUnique({
        where: { key: 'v2_service_panel' },
      }),
      prisma.siteInfo.findUnique({
        where: { key: 'v2_service_grid' },
      }),
      prisma.siteInfo.findUnique({
        where: { key: 'home_sections' },
      }),
      prisma.siteInfo.findUnique({
        where: { key: 'footer_config' },
      }),
      prisma.siteInfo.findUnique({
        where: { key: 'show_feedback_button' },
      }),
    ]);

    const layout = layoutConfig ? JSON.parse(layoutConfig.content) : DEFAULT_LAYOUT_CONFIG;
    const siteInfo = siteInfoConfig ? JSON.parse(siteInfoConfig.content) : DEFAULT_SITE_INFO;
    const v2Header = v2HeaderConfig ? JSON.parse(v2HeaderConfig.content) : DEFAULT_V2_HEADER;
    const v2ServicePanel = v2ServicePanelConfig ? JSON.parse(v2ServicePanelConfig.content) : DEFAULT_V2_SERVICE_PANEL;
    const v2ServiceGrid = v2ServiceGridConfig ? JSON.parse(v2ServiceGridConfig.content) : DEFAULT_V2_SERVICE_GRID;
    const homeSections = homeSectionsConfig ? JSON.parse(homeSectionsConfig.content) : DEFAULT_HOME_SECTIONS;
    const footerConfigData = footerConfig ? JSON.parse(footerConfig.content) : DEFAULT_FOOTER_CONFIG;
    const showFeedbackButton = feedbackButtonConfig ? feedbackButtonConfig.content === 'true' : true;

    const responseData = {
      ...layout,
      home_sections: homeSections,
      site_info: siteInfo,
      v2_header: v2Header,
      v2_service_panel: v2ServicePanel,
      v2_service_grid: v2ServiceGrid,
      footer_config: footerConfigData,
      show_feedback_button: showFeedbackButton,
    };

    // 缓存结果
    await setCache(cacheKey, responseData, CACHE_TTL.LONG);

    // 禁用浏览器/CDN缓存，确保后台修改后立即生效
    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error fetching layout config:', error);
    return NextResponse.json({
      ...DEFAULT_LAYOUT_CONFIG,
      home_sections: DEFAULT_HOME_SECTIONS,
      site_info: DEFAULT_SITE_INFO,
      v2_header: DEFAULT_V2_HEADER,
      v2_service_panel: DEFAULT_V2_SERVICE_PANEL,
      v2_service_grid: DEFAULT_V2_SERVICE_GRID,
      footer_config: DEFAULT_FOOTER_CONFIG,
      show_feedback_button: true,
    });
  }
}
