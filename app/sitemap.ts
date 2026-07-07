import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * 动态生成 sitemap.xml
 * 包含所有公开页面的 URL
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://zgh.xa.gov.cn';

  // 静态页面
  const staticPages = [
    { url: `${baseUrl}/`, changefreq: 'daily', priority: 1.0 },
    { url: `${baseUrl}/about`, changefreq: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/services`, changefreq: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/feedback`, changefreq: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/search`, changefreq: 'weekly', priority: 0.6 },
  ];

  // 获取已发布的新闻
  const news = await prisma.news.findMany({
    where: { status: 'published' },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 1000, // 最多1000条
  });

  const newsPages = news.map(item => ({
    url: `${baseUrl}/news/${item.id}`,
    lastModified: item.createdAt,
    changefreq: 'weekly' as const,
    priority: 0.7,
  }));

  // 获取已发布的政策
  const policies = await prisma.policy.findMany({
    where: { status: 'published' },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 1000,
  });

  const policyPages = policies.map(item => ({
    url: `${baseUrl}/policies/${item.id}`,
    lastModified: item.updatedAt,
    changefreq: 'monthly' as const,
    priority: 0.8,
  }));

  // 获取服务页面
  const services = await prisma.service.findMany({
    where: { isActive: true },
    select: { id: true, updatedAt: true },
    orderBy: { orderIndex: 'asc' },
  });

  const servicePages = services.map(item => ({
    url: `${baseUrl}/services/${item.id}`,
    lastModified: item.updatedAt,
    changefreq: 'monthly' as const,
    priority: 0.8,
  }));

  // 获取视频
  const videos = await prisma.video.findMany({
    where: { isActive: true },
    select: { id: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const videoPages = videos.map(item => ({
    url: `${baseUrl}/videos/${item.id}`,
    lastModified: item.updatedAt,
    changefreq: 'weekly' as const,
    priority: 0.6,
  }));

  // 合并所有页面
  return [
    ...staticPages,
    ...newsPages,
    ...policyPages,
    ...servicePages,
    ...videoPages,
  ];
}
