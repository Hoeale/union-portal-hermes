'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NewsEditor from '@/components/admin/news-editor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface NewsData {
  title: string;
  category: '动态' | '通知' | '公告';
  content: string;
  image_url: string;
  image_source_type: 'local' | 'external';
  is_carousel: boolean;
  carousel_order: number;
  status: 'pending' | 'published';
  publish_status?: string;
  scheduled_publish_at?: string | null;
  publishedAt?: string;
}

export default function NewsEditPage() {
  const params = useParams();
  const router = useRouter();
  const newsId = params.id as string;

  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const result = await apiClient.get<{success: boolean; data: Partial<NewsData>; error?: string}>(`/api/admin/news?id=${newsId}`);
        if (result.success && result.data) {
          const item = result.data;
          setNewsData({
            title: item.title || '',
            category: item.category || '动态',
            content: item.content || '',
            image_url: item.image_url || '',
            image_source_type: item.image_source_type || 'local',
            is_carousel: item.is_carousel || false,
            carousel_order: item.carousel_order || 0,
            status: item.status || 'pending',
            publish_status: item.publish_status,
            scheduled_publish_at: item.scheduled_publish_at,
            publishedAt: item.publishedAt,
          });
        } else {
          throw new Error(result.error || '新闻不存在');
        }
      } catch (err: unknown) {
        logger.error('Failed to fetch news:', err);
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    if (newsId) {
      fetchNews();
    }
  }, [newsId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-gray-400 mb-4" />
          <p className="text-gray-500">正在加载新闻数据...</p>
        </div>
      </div>
    );
  }

  if (error || !newsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '新闻不存在'}</p>
          <button
            onClick={() => router.push('/admin/news')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            返回新闻列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <NewsEditor
      mode="edit"
      newsId={newsId}
      initialData={newsData}
    />
  );
}
