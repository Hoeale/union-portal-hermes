'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faNewspaper, faFileAlt, faCalendar, faTag, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

interface Draft {
  id: string;
  type: 'news' | 'policy';
  title: string;
  category: string;
  content: string;
  imageUrl: string | null;
  fileUrl: string | null;
  source: string | null;
  publishDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DraftPreviewPage() {
  const params = useParams();
  const draftId = params?.id as string;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draftId) return;

    const fetchDraft = async () => {
      try {
        const response = await fetch(`/api/draft/${draftId}`);
        if (!response.ok) throw new Error('Failed to fetch draft');
        const result = await response.json();
        if (result.success) {
          setDraft(result.data);
        } else {
          setError('草稿不存在或已被删除');
        }
      } catch (err) {
        console.error('Error fetching draft:', err);
        setError('加载草稿失败');
      } finally {
        setLoading(false);
      }
    };

    fetchDraft();
  }, [draftId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-gray-400 mb-4" />
          <p className="text-gray-500">正在加载草稿...</p>
        </div>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{error || '草稿不存在'}</h2>
          <Link
            href="/admin/drafts"
            className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-[#b71c1c] text-white rounded-lg hover:bg-[#9a1616] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            返回草稿箱
          </Link>
        </div>
      </div>
    );
  }

  const isNews = draft.type === 'news';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/drafts"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              返回草稿箱
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              isNews
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800'
            }`}>
              {isNews ? '新闻草稿' : '政策草稿'}
            </span>
            <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
              草稿预览
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon
                icon={isNews ? faNewspaper : faFileAlt}
                className={`text-2xl ${isNews ? 'text-blue-600' : 'text-purple-600'}`}
              />
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                isNews ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {draft.category}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-[#1e2b3c]">
              {draft.title}
            </h1>
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
              {draft.publishDate && (
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendar} />
                  发布日期：{draft.publishDate}
                </span>
              )}
              {draft.source && (
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faTag} />
                  来源：{draft.source}
                </span>
              )}
            </div>
            <div className="mt-4 text-xs text-gray-400">
              最后更新：{new Date(draft.updatedAt).toLocaleString('zh-CN')}
            </div>
          </div>

          {/* Featured Image */}
          {draft.imageUrl && (
            <div className="px-8 py-6 border-b border-gray-200">
              <img
                src={draft.imageUrl}
                alt={draft.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Content */}
          <div className="px-8 py-8">
            <div
              className="rich-text-content max-w-none"
              dangerouslySetInnerHTML={{ __html: draft.content }}
            />
          </div>

          {/* File Attachment */}
          {draft.fileUrl && (
            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-2">附件</h3>
              <a
                href={draft.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <FontAwesomeIcon icon={faFileAlt} />
                查看文件
              </a>
            </div>
          )}
        </div>

        {/* Info Notice */}
        <div className="mt-6 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            预览提示
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>这是草稿的预览效果，实际发布后可能会有一些样式调整</li>
            <li>请仔细检查内容、格式和附件是否正确</li>
            <li>确认无误后，返回草稿箱点击&apos;发布&apos;按钮正式发布</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
