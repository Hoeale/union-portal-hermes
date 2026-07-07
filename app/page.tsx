import V2LayoutWrapper from '@/components/v2/layout-wrapper';
import HeroCarousel from '@/components/hero-carousel';
import NoticeSection from '@/components/v2/notice-section';
import ServicePanel from '@/components/v2/service-panel';
import ServiceGrid from '@/components/v2/service-grid';
import { prisma } from '@/lib/prisma';

interface HomeSectionConfig {
  [key: string]: any;
}

interface HomeSection {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  order: number;
  config?: HomeSectionConfig;
}

interface CarouselNews {
  id: string;
  title: string;
  category: string | null;
  image_url: string | null;
  published_at: string;
  link_url?: string | null;
  source?: 'news' | 'carousel';
}

interface NoticeNews {
  id: string;
  title: string;
  published_at: string;
}

// 获取首页布局配置
async function getHomeSections(): Promise<HomeSection[]> {
  try {
    const homeSectionsConfig = await prisma.siteInfo.findUnique({
      where: { key: 'home_sections' },
    });
    
    if (homeSectionsConfig?.content) {
      const sections = JSON.parse(homeSectionsConfig.content) as HomeSection[];
      return sections
        .filter((s) => s.visible)
        .sort((a, b) => a.order - b.order);
    }
  } catch (error) {
    console.error('Failed to fetch home sections:', error);
  }

  // 默认配置
  return [
    { id: 'header', name: '顶部导航栏', description: '', visible: true, order: 0 },
    { id: 'hero-carousel', name: '头条轮播区', description: '', visible: true, order: 1, config: { limit: 5, sideLimit: 5, autoRotate: true, interval: 5000 } },
    { id: 'notice-panel', name: '通知要闻+服务面板', description: '', visible: true, order: 2, config: { title: '通知要闻', limit: 6, showServicePanel: true } },
    { id: 'service-grid', name: '办事服务区', description: '', visible: true, order: 3 },
  ];
}

// 获取轮播新闻
async function getCarouselNews(limit: number = 10): Promise<CarouselNews[]> {
  try {
    const news = await prisma.news.findMany({
      where: {
        status: 'published',
        isCarousel: true,
      },
      orderBy: { carouselOrder: 'asc' },
      take: limit,
      select: {
        id: true,
        title: true,
        category: true,
        imageUrl: true,
        publishedAt: true,
      },
    });

    return news.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      image_url: item.imageUrl,
      published_at: item.publishedAt.toISOString(),
      link_url: null,
      source: 'carousel' as const,
    }));
  } catch (error) {
    console.error('Failed to fetch carousel news:', error);
    return [];
  }
}

// 获取通知公告
async function getNoticeNews(limit: number = 6): Promise<NoticeNews[]> {
  try {
    const news = await prisma.news.findMany({
      where: {
        status: 'published',
        isNotice: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        publishedAt: true,
      },
    });

    return news.map((item) => ({
      id: item.id,
      title: item.title,
      published_at: item.publishedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Failed to fetch notice news:', error);
    return [];
  }
}

export default async function HomePage() {
  const sections = await getHomeSections();
  
  // 获取轮播新闻和通知公告数据
  const carouselNews = await getCarouselNews(10);
  const noticeNews = await getNoticeNews(6);

  // 渲染各个区块
  const renderSection = (section: HomeSection) => {
    const config = section.config || {};

    switch (section.id) {
      case 'header':
        // Header 已经在 V2LayoutWrapper 中渲染，这里跳过
        return null;

      case 'hero-carousel':
        return (
          <div key={section.id} className="mb-9">
            <HeroCarousel
              news={carouselNews}
              limit={config.limit || 5}
              sideLimit={config.sideLimit || 5}
              autoRotate={config.autoRotate !== false}
              interval={config.interval || 5000}
            />
          </div>
        );

      case 'news-sections':
        // 已删除：新闻动态和区总动态已并入轮播图右侧
        // 保留此区块以兼容配置，但不再渲染
        return null;

      case 'notice-panel':
        return (
          <div key={section.id} className="flex gap-6 mb-10">
            <NoticeSection
              notices={noticeNews}
              title={config.title || '通知要闻'}
              limit={config.limit || 6}
            />
            {config.showServicePanel !== false && <ServicePanel />}
          </div>
        );

      case 'service-grid':
        return (
          <div key={section.id}>
            <ServiceGrid />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <V2LayoutWrapper>
      {sections.map((section) => renderSection(section))}
    </V2LayoutWrapper>
  );
}
