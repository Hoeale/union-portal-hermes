import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import FrontendWrapper from '@/components/frontend-wrapper';
import { ArrowLeft, Calendar } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const news = await prisma.news.findUnique({
    where: { id },
    select: { title: true, content: true },
  });

  if (!news) {
    return {
      title: '新闻不存在 - 工会门户',
    };
  }

  return {
    title: `${news.title} - 工会门户`,
    description: news.content.substring(0, 160).replace(/<[^>]*>/g, ''),
  };
}

async function NewsDetailContent({ id }: { id: string }) {
  const news = await prisma.news.findUnique({
    where: { id },
  });

  if (!news) {
    notFound();
  }

  // Transform to match the component format
  const newsItem = {
    ...news,
    image_url: news.imageUrl,
    is_carousel: news.isCarousel,
    carousel_order: news.carouselOrder,
    published_at: news.publishedAt.toISOString(),
    created_at: news.createdAt.toISOString(),
  };

  const categoryStyles = {
    动态: 'bg-blue-50 text-blue-700 border-blue-200',
    公告: 'bg-orange-50 text-orange-700 border-orange-200',
    政策: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <Link
          href={`/news?category=${encodeURIComponent(newsItem.category || '新闻动态')}`}
          className="inline-flex items-center gap-2 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--primary))] transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          返回{newsItem.category || '新闻动态'}
        </Link>

        {/* 新闻详情卡片 */}
        <article className="card overflow-hidden animate-fade-in">
          {/* 标题区域 */}
          <div className="p-6 lg:p-8 border-b border-[hsl(var(--card-border))]">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
                  categoryStyles[newsItem.category as keyof typeof categoryStyles]
                }`}
              >
                {newsItem.category}
              </span>
              <time className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(newsItem.published_at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
            <h1 className="text-2xl lg:text-4xl font-bold text-[hsl(var(--foreground))] leading-tight">
              {newsItem.title}
            </h1>
          </div>

          {/* 图片 */}
          {newsItem.image_url && (
            <div className="relative w-full h-64 lg:h-96 bg-gray-100">
              <Image
                src={newsItem.image_url}
                alt={newsItem.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                className="object-cover"
              />
            </div>
          )}

          {/* 内容 */}
          <div className="p-6 lg:p-8">
            <div
              className="rich-text-content max-w-none text-[hsl(var(--foreground-muted))] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: newsItem.content }}
            />
          </div>
        </article>
      </div>
    </div>
  );
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <FrontendWrapper>
      <NewsDetailContent id={id} />
    </FrontendWrapper>
  );
}
