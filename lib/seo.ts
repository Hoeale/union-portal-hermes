import { Metadata } from 'next';

interface SEOConfig {
  title: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  noIndex?: boolean;
}

const SITE_CONFIG = {
  name: '西安高新区总工会',
  description: '西安高新区总工会官方网站，提供工会服务、政策资讯、职工权益保障等信息。',
  url: process.env.NEXT_PUBLIC_BASE_URL || 'https://zgh.xa.gov.cn',
  logo: '/logo.png',
  twitterHandle: '@xazgh',
};

/**
 * 生成 SEO 元数据
 */
export function generateSEO(config: SEOConfig): Metadata {
  const {
    title,
    description = SITE_CONFIG.description,
    keywords = [],
    image = `${SITE_CONFIG.url}/header-bg.png`,
    url,
    type = 'website',
    publishedAt,
    modifiedAt,
    author = SITE_CONFIG.name,
    noIndex = false,
  } = config;

  const fullTitle = title === SITE_CONFIG.name 
    ? title 
    : `${title} | ${SITE_CONFIG.name}`;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: ['西安高新区', '总工会', '工会服务', '职工权益', ...keywords],
    authors: [{ name: author }],
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,
    
    // Open Graph
    openGraph: {
      title: fullTitle,
      description,
      url: url || SITE_CONFIG.url,
      siteName: SITE_CONFIG.name,
      locale: 'zh_CN',
      type,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedAt && { publishedTime: publishedAt }),
      ...(modifiedAt && { modifiedTime: modifiedAt }),
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: SITE_CONFIG.twitterHandle,
    },

    // Robots
    robots: noIndex 
      ? { index: false, follow: false }
      : { 
          index: true, 
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },

    // 其他元数据
    alternates: {
      canonical: url,
    },
    
    // 应用图标
    icons: {
      icon: '/favicon.png',
      shortcut: '/favicon.png',
      apple: '/logo.png',
    },

    // 验证（需要替换为实际的验证代码）
    verification: {
      // google: 'your-google-verification-code',
      // baidu: 'your-baidu-verification-code',
    },
  };

  return metadata;
}

/**
 * 生成新闻页面的 SEO 配置
 */
export function generateNewsSEO(news: {
  title: string;
  content?: string;
  imageUrl?: string | null;
  publishedAt: Date;
  updatedAt?: Date;
  id: string;
  category?: string;
}): Metadata {
  const description = news.content 
    ? news.content.replace(/<[^>]*>/g, '').slice(0, 160) + '...'
    : SITE_CONFIG.description;

  return generateSEO({
    title: news.title,
    description,
    keywords: [news.category || '新闻', '工会新闻'],
    image: news.imageUrl || `${SITE_CONFIG.url}/header-bg.png`,
    url: `${SITE_CONFIG.url}/news/${news.id}`,
    type: 'article',
    publishedAt: news.publishedAt.toISOString(),
    modifiedAt: news.updatedAt?.toISOString(),
  });
}

/**
 * 生成政策页面的 SEO 配置
 */
export function generatePolicySEO(policy: {
  title: string;
  content?: string;
  publishDate: string;
  id: string;
  category: string;
}): Metadata {
  const description = policy.content 
    ? policy.content.replace(/<[^>]*>/g, '').slice(0, 160) + '...'
    : SITE_CONFIG.description;

  return generateSEO({
    title: policy.title,
    description,
    keywords: [policy.category, '政策', '工会政策'],
    url: `${SITE_CONFIG.url}/policies/${policy.id}`,
    type: 'article',
    publishedAt: new Date(policy.publishDate).toISOString(),
  });
}

/**
 * 生成服务页面的 SEO 配置
 */
export function generateServiceSEO(service: {
  title: string;
  description?: string;
  id: string;
}): Metadata {
  return generateSEO({
    title: service.title,
    description: service.description || `${service.title} - ${SITE_CONFIG.name}`,
    keywords: ['工会服务', '职工服务'],
    url: `${SITE_CONFIG.url}/services/${service.id}`,
    type: 'website',
  });
}

/**
 * 默认页面 SEO
 */
export function getDefaultSEO(): Metadata {
  return generateSEO({
    title: SITE_CONFIG.name,
  });
}

export { SITE_CONFIG };
