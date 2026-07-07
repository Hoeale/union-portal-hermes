'use client';

import Link from 'next/link';
import { Megaphone, Volume2, Calendar, FileText } from 'lucide-react';
import { useSWR } from '@/lib/swr';

interface News {
  id: string;
  title: string;
  published_at: string;
}

interface NoticeSectionProps {
  title?: string;       // 标题，默认 "通知公告"
  category?: string;    // 新闻分类，默认 "公告"
  limit?: number;       // 显示数量，默认 3
  notices?: News[];     // SSR 模式传入的数据
}

export default function NoticeSection({ title = '通知公告', limit = 6, notices: propNotices }: NoticeSectionProps) {
  // 如果传入了 props 数据（SSR 模式），直接使用
  const shouldFetch = !propNotices || propNotices.length === 0;
  
  const { data: fetchedNotices, isLoading: loading } = useSWR<News[]>(
    shouldFetch ? `/api/news?is_notice=true&limit=${limit}` : null
  );
  
  const notices = propNotices && propNotices.length > 0 ? propNotices : (fetchedNotices || []);

  const getIcon = (index: number) => {
    const icons = [Volume2, Calendar, FileText];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="w-5 h-5 text-[#c0392b] mr-3" />;
  };

  return (
    <div className="flex-[2] bg-[#fbfdff] rounded-2xl border border-[#dee6ed] p-6">
      <div className="flex items-center justify-between border-b-2 border-[#b71c1c] pb-3 mb-5">
        <h3 className="text-xl font-bold">
          <Megaphone className="inline text-[#b71c1c] mr-2 w-6 h-6" />
          {title}
        </h3>
        <Link href="/news" className="text-sm text-[#b71c1c] hover:text-[#8b0000]" prefetch={true}>
          更多 →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="bg-gray-100 h-10 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {notices.slice(0, limit).map((item, index) => (
            <div key={item.id} className="flex items-center py-3 border-b border-dashed border-[#d9e1e8]">
              {getIcon(index)}
              <Link
                href={`/view/${new Date(item.published_at).toISOString().slice(0,10).replace(/-/g,'')}/${item.id.replace(/-/g,'').substring(0,5)}`}
                className="flex-1 text-[#1f2d3d] text-base font-medium no-underline truncate hover:text-[#b71c1c]"
              >
                {item.title}
              </Link>
              <span className="text-[#999] text-xs ml-2 whitespace-nowrap">
                {new Date(item.published_at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                }).replace(/\//g, '-')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
