'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Eye, ArrowRight } from 'lucide-react';

interface News {
  id: string;
  title: string;
  category: '动态' | '通知' | '公告' | '政策';
  content: string;
  image_url: string | null;
  is_carousel: boolean;
  carousel_order: number | null;
  published_at: string;
  created_at: string;
}

interface NewsListProps {
  category?: '动态' | '通知' | '公告' | '政策' | 'all';
  limit?: number;
  showMoreLink?: boolean;
  moreLinkHref?: string;
  className?: string;
}

export default function NewsList({
  category = 'all',
  limit = 8,
  showMoreLink = false,
  moreLinkHref = '/news',
  className,
}: NewsListProps) {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'动态' | '通知' | '公告' | '政策' | 'all'>(
    category
  );

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, limit]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const categoryParam = selectedCategory === 'all' ? '' : selectedCategory;
      const response = await fetch(`/api/news?category=${categoryParam}&limit=${limit}&is_carousel=false`);
      if (!response.ok) throw new Error('Failed to fetch news');
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions: { value: '动态' | '通知' | '公告' | '政策' | 'all'; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: '动态', label: '工会动态' },
    { value: '通知', label: '通知要闻' },
    { value: '公告', label: '通知公告' },
    { value: '政策', label: '政策文件' },
  ];

  const categoryStyles = {
    动态: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
    },
    通知: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
    },
    公告: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
    },
    政策: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      dot: 'bg-green-500',
    },
  };

  return (
    <div className={cn('card overflow-hidden', className)}>
      {/* 标题和过滤器 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-[hsl(var(--card-border))] bg-gradient-to-r from-[hsl(var(--background))] to-white">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-[hsl(var(--primary))] rounded-full" />
          <h2 className="text-xl lg:text-2xl font-bold text-[hsl(var(--foreground))]">
            {category === 'all' ? '新闻资讯' : categoryOptions.find(o => o.value === category)?.label}
          </h2>
        </div>

        {category === 'all' && (
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedCategory(option.value)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                  selectedCategory === option.value
                    ? 'bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary))]/30'
                    : 'bg-white text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--primary))]/10 hover:text-[hsl(var(--primary))] border border-[hsl(var(--card-border))]'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 新闻列表 */}
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl">
                <div className="w-24 h-16 skeleton rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton rounded w-3/4" />
                  <div className="h-3 skeleton rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-[hsl(var(--foreground-muted))]">暂无新闻</p>
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  'group flex gap-4 p-4 rounded-xl transition-all duration-300 border border-transparent',
                  'hover:border-[hsl(var(--card-border))] hover:shadow-lg',
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* 缩略图 */}
                {item.image_url && (
                  <div className="flex-shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-24 h-20 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                )}

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-[hsl(var(--foreground))] line-clamp-2 flex-1 group-hover:text-[hsl(var(--primary))] transition-colors">
                      <a
                        href={`/view/${new Date(item.published_at).toISOString().slice(0,10).replace(/-/g,'')}/${item.id.replace(/-/g,'').substring(0,5)}`}
                        className="block"
                      >
                        {item.title}
                      </a>
                    </h3>
                    <span
                      className={cn(
                        'flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold',
                        categoryStyles[item.category].bg,
                        categoryStyles[item.category].text,
                        categoryStyles[item.category].border
                      )}
                    >
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[hsl(var(--foreground-muted))]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.published_at).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Hover indicator */}
                <div className="flex items-center text-[hsl(var(--primary))] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 查看更多 */}
        {showMoreLink && news.length >= limit && (
          <div className="mt-6 text-center">
            <a
              href={moreLinkHref}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[hsl(var(--primary))] text-white rounded-xl font-semibold shadow-lg shadow-[hsl(var(--primary))]/30 hover:shadow-xl hover:shadow-[hsl(var(--primary))]/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              查看更多新闻
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
