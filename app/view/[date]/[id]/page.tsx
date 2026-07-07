import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import FrontendWrapper from '@/components/frontend-wrapper';
import { ArrowLeft, Calendar, Eye } from 'lucide-react';

interface PageProps {
  params: Promise<{ date: string; id: string }>;
}

// 数据库分类 -> 前端显示名 映射
const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  '动态': '工会动态',
  '通知': '通知要闻',
  '公告': '公示公告',
  '政策': '政策文件',
};

function getCategoryDisplayName(category: string): string {
  return CATEGORY_DISPLAY_MAP[category] || category;
}

// 分类样式配置
const CATEGORY_STYLES: Record<string, string> = {
  '动态': 'bg-blue-50 text-blue-700 border-blue-200',
  '通知': 'bg-purple-50 text-purple-700 border-purple-200',
  '公告': 'bg-orange-50 text-orange-700 border-orange-200',
  '政策': 'bg-green-50 text-green-700 border-green-200',
};

function getCategoryStyle(category: string): string {
  return CATEGORY_STYLES[category] || 'bg-gray-50 text-gray-700 border-gray-200';
}

async function incrementViewCount(newsId: string) {
  try {
    await prisma.news.update({
      where: { id: newsId },
      data: { viewCount: { increment: 1 } },
    });
  } catch (error) {
    console.error('Failed to increment view count:', error);
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date, id } = await params;
  
  const targetDate = new Date(`${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`);
  const news = await prisma.news.findFirst({
    where: {
      publishedAt: {
        gte: targetDate,
        lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000 - 1),
      },
    },
    select: { title: true, content: true },
  });

  if (!news) {
    return { title: '新闻不存在 - 工会门户' };
  }

  return {
    title: `${news.title} - 工会门户`,
    description: news.content.substring(0, 160).replace(/<[^>]*>/g, ''),
  };
}

async function NewsDetailContent({ news, viewCount }: { news: any; viewCount: number }) {
  const category = news.category;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--primary))] transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          返回新闻中心
        </Link>

        <article className="card overflow-hidden animate-fade-in">
          <div className="p-6 lg:p-8 border-b border-[hsl(var(--card-border))]">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getCategoryStyle(category)}`}>
                {getCategoryDisplayName(category)}
              </span>
              <time className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(news.publishedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
              <span className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {viewCount} 次阅读
              </span>
            </div>
            <h1 className="text-2xl lg:text-4xl font-bold text-[hsl(var(--foreground))] leading-tight">
              {news.title}
            </h1>
          </div>

          {news.imageUrl && (
            <div className="relative w-full h-64 lg:h-96 bg-gray-100">
              <Image
                src={news.imageUrl}
                alt={news.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6 lg:p-8">
            <div
              className="rich-text-content max-w-none text-[hsl(var(--foreground-muted))] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />
          </div>
        </article>
      </div>
    </div>
  );
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { date, id } = await params;
  const targetDate = new Date(`${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`);
  
  const newsList = await prisma.news.findMany({
    where: {
      publishedAt: {
        gte: targetDate,
        lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000 - 1),
      },
    },
    orderBy: { publishedAt: 'desc' },
  });

  const shortId = id.padStart(5, '0');
  const news = newsList.find(n => {
    const newsShortId = n.id.replace(/-/g, '').substring(0, 5);
    return newsShortId === shortId || n.id.endsWith(id);
  });

  if (!news) notFound();

  await incrementViewCount(news.id);

  const updatedNews = await prisma.news.findUnique({
    where: { id: news.id },
    select: { viewCount: true },
  });

  return (
    <FrontendWrapper>
      <NewsDetailContent news={news} viewCount={updatedNews?.viewCount ?? 0} />
    </FrontendWrapper>
  );
}
