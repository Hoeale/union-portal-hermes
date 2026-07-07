'use client';

import Link from 'next/link';
import { Rss, Users, ArrowRight } from 'lucide-react';
import { useSWR } from '@/lib/swr';

interface News {
  id: string;
  title: string;
  category: '动态' | '公告' | '政策';
  published_at: string;
}

interface NewsSectionProps {
  title: string;
  icon: any;
  category?: '动态' | '公告' | '政策';
  limit?: number;
}

export default function NewsSection({ title, icon, category, limit = 5 }: NewsSectionProps) {
  const categoryParam = category || '';
  const { data: news, isLoading: loading } = useSWR<News[]>(
    `/api/news?category=${categoryParam}&limit=${limit}&is_carousel=false`
  );

  return (
    <div className="card-base p-5">
      <div className="flex justify-between items-center title-bordered">
        <h2 className="text-xl font-bold text-[#222]">
          {icon}
          {title}
        </h2>
        <Link href="/news" className="text-[#7f8c8d] text-sm no-underline">
          更多 <ArrowRight className="inline w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="news-item bg-gray-100 h-8 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <ul className="list-none m-0 p-0">
          {news?.map((item) => (
            <li key={item.id} className="news-item">
              <Link
                href={`/view/${new Date(item.published_at).toISOString().slice(0,10).replace(/-/g,'')}/${item.id.replace(/-/g,'').substring(0,5)}`}
                className="flex-1 text-[#2c3e50] text-sm no-underline truncate hover:text-[#b71c1c]"
              >
                {item.title}
              </Link>
              <span className="text-[#999] text-xs ml-2.5 whitespace-nowrap">
                {new Date(item.published_at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                }).replace(/\//g, '-')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
