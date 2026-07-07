'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, ArrowRight } from 'lucide-react';

interface NoticeNews {
  id: string;
  title: string;
  category: string;
  published_at: string;
}

export default function Announcements() {
  const [notices, setNotices] = useState<NoticeNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/news?is_notice=true&limit=6');
      if (!response.ok) throw new Error('Failed to fetch notices');
      const data = await response.json();
      setNotices(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 置顶公告区域 */}
      <div className="card p-6 border-l-4 border-l-[hsl(var(--accent))]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg gradient-warm flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-[hsl(var(--foreground))]">重要公告</h3>
            <p className="text-sm text-[hsl(var(--foreground-muted))]">最新通知事项</p>
          </div>
        </div>

        {/* 通知公告列表 */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 skeleton rounded-lg" />
              ))}
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-8 text-[hsl(var(--foreground-muted))]">
              暂无通知公告
            </div>
          ) : (
            notices.map((item) => (
              <a
                key={item.id}
                href={`/view/${new Date(item.published_at).toISOString().slice(0,10).replace(/-/g,'')}/${item.id.replace(/-/g,'').substring(0,5)}`}
                className={cn(
                  'group flex items-center gap-3 p-3 rounded-lg transition-all duration-300',
                  'hover:bg-[hsl(var(--primary))]/5 hover:shadow-sm'
                )}
              >
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--accent))] flex-shrink-0" />
                <span className="flex-1 text-sm text-[hsl(var(--foreground))] line-clamp-1 group-hover:text-[hsl(var(--primary))] transition-colors">
                  {item.title}
                </span>
                <span className="flex items-center gap-1 text-xs text-[hsl(var(--foreground-muted))] flex-shrink-0">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.published_at).toLocaleDateString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </span>
                <ArrowRight className="w-4 h-4 text-[hsl(var(--primary))] opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
