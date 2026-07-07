'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faArrowLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface News {
  id: string;
  title: string;
  category: string;
  content: string;
  imageUrl: string | null;
  status: 'pending' | 'published';
  publishedAt: string;
  createdAt: string;
}

export default function NewsPreviewPage() {
  const params = useParams();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`/api/preview/news/${params.id}`);
        if (!response.ok) {
          throw new Error('新闻不存在');
        }
        const result = await response.json();
        setNews(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-gray-400 mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '新闻不存在'}</p>
          <a href="/admin/news" className="text-blue-600 hover:underline">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            返回新闻管理
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航栏 */}
      <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <a href="/admin/news" className="flex items-center gap-2 hover:text-gray-300">
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>返回新闻管理</span>
          </a>
        </div>
        <div className="flex items-center gap-3">
          <FontAwesomeIcon icon={faEye} className="text-yellow-400" />
          <span className="text-sm text-gray-300">预览模式</span>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            news.status === 'published'
              ? 'bg-green-500/20 text-green-300'
              : 'bg-yellow-500/20 text-yellow-300'
          }`}>
            {news.status === 'published' ? '已发布' : '待发布'}
          </span>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <article>
          {/* 标题 */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{news.title}</h1>

          {/* 元信息 */}
          <div className="flex items-center gap-4 mb-8 text-sm text-gray-600">
            <span className="px-3 py-1 bg-gray-100 rounded-full">{news.category}</span>
            <span>
              发布时间：{new Date(news.publishedAt).toLocaleDateString('zh-CN')}
            </span>
          </div>

          {/* 封面图 */}
          {news.imageUrl && (
            <img
              src={news.imageUrl}
              alt={news.title}
              className="w-full h-96 object-cover rounded-lg mb-8"
            />
          )}

          {/* 正文内容 */}
          <div
            className="rich-text-content max-w-none"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />
        </article>

        {/* 底部提示 */}
        <div className="mt-16 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>提示：</strong>这是预览模式，内容尚未发布或处于待发布状态。
            {news.status === 'pending' && '请在管理后台确认发布。'}
          </p>
        </div>
      </div>
    </div>
  );
}
