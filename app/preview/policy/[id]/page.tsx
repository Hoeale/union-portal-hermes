'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faArrowLeft, faSpinner, faFileAlt, faCalendar, faBuilding } from '@fortawesome/free-solid-svg-icons';

interface Policy {
  id: string;
  title: string;
  category: string;
  content: string;
  fileUrl: string | null;
  source: string;
  publishDate: string;
  status: 'pending' | 'published';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PolicyPreviewPage() {
  const params = useParams();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await fetch(`/api/preview/policy/${params.id}`);
        if (!response.ok) {
          throw new Error('政策不存在');
        }
        const result = await response.json();
        setPolicy(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
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

  if (error || !policy) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '政策不存在'}</p>
          <a href="/admin/policies" className="text-blue-600 hover:underline">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            返回政策管理
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
          <a href="/admin/policies" className="flex items-center gap-2 hover:text-gray-300">
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>返回政策管理</span>
          </a>
        </div>
        <div className="flex items-center gap-3">
          <FontAwesomeIcon icon={faEye} className="text-yellow-400" />
          <span className="text-sm text-gray-300">预览模式</span>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            policy.status === 'published'
              ? 'bg-green-500/20 text-green-300'
              : 'bg-yellow-500/20 text-yellow-300'
          }`}>
            {policy.status === 'published' ? '已发布' : '待发布'}
          </span>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <article>
          {/* 标题 */}
          <h1 className="text-4xl font-bold text-gray-900 mb-6">{policy.title}</h1>

          {/* 元信息 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FontAwesomeIcon icon={faFileAlt} className="text-gray-400" />
              <span>{policy.category}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
              <span>{policy.publishDate}</span>
            </div>
            {policy.source && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FontAwesomeIcon icon={faBuilding} className="text-gray-400" />
                <span>{policy.source}</span>
              </div>
            )}
          </div>

          {/* 文件链接 */}
          {policy.fileUrl && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <a
                href={policy.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faFileAlt} />
                <span>查看完整文件</span>
              </a>
            </div>
          )}

          {/* 正文内容 */}
          <div
            className="rich-text-content max-w-none"
            dangerouslySetInnerHTML={{ __html: policy.content }}
          />
        </article>

        {/* 底部提示 */}
        <div className="mt-16 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>提示：</strong>这是预览模式，内容尚未发布或处于待发布状态。
            {policy.status === 'pending' && '请在管理后台确认发布。'}
          </p>
        </div>
      </div>
    </div>
  );
}
