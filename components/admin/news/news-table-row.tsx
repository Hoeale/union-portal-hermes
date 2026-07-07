'use client';

import { useRouter } from 'next/navigation';
import { CheckSquare, Square } from 'lucide-react';
import { News } from '@/hooks/useNewsManagement';

interface NewsTableRowProps {
  item: News;
  categoryFilter: string;
  isSelected: boolean;
  onSelect: () => void;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onPreview: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleNotice: (id: string, isNotice: boolean | undefined) => void;
}

export default function NewsTableRow({
  item,
  categoryFilter,
  isSelected,
  onSelect,
  onPublish,
  onUnpublish,
  onPreview,
  onDelete,
  onToggleNotice,
}: NewsTableRowProps) {
  const router = useRouter();

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-4">
        <button onClick={onSelect} className="text-gray-600 hover:text-[#b71c1c] transition-colors">
          {isSelected ? (
            <CheckSquare className="w-5 h-5" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center">
          {item.image_url && (
            <img
              src={item.image_url}
              alt=""
              className="h-12 w-12 rounded-lg object-cover mr-4"
            />
          )}
          <div className="text-sm font-medium max-w-xs truncate">
            {item.status === 'published' ? (
              <a
                href={`/view/${new Date(item.published_at).toISOString().slice(0, 10).replace(/-/g, '')}/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 hover:text-[#b71c1c] hover:underline"
              >
                {item.title}
              </a>
            ) : (
              <button
                onClick={() => onPreview(item.id)}
                className="text-gray-900 hover:text-[#b71c1c] hover:underline text-left"
              >
                {item.title}
              </button>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-[#b71c1c]/10 text-[#b71c1c]">
          {item.category}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
          item.status === 'published'
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {item.status === 'published' ? '已发布' : '待发布'}
        </span>
      </td>
      <td className="px-6 py-4">
        {item.status === 'pending' ? (
          <span className="text-sm text-gray-400">—</span>
        ) : item.is_carousel ? (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            是
          </span>
        ) : (
          <span className="text-sm text-gray-400">否</span>
        )}
      </td>
      {(categoryFilter === '通知要闻' || categoryFilter === '公示公告') && (
        <td className="px-6 py-4">
          {item.status === 'pending' ? (
            <span className="text-sm text-gray-400">—</span>
          ) : (
            <button
              onClick={() => onToggleNotice(item.id, item.is_notice)}
              className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                item.is_notice
                  ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={item.is_notice ? '点击取消展示到通知公告' : '点击展示到通知公告'}
            >
              {item.is_notice ? (
                <>
                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  是
                </>
              ) : (
                '否'
              )}
            </button>
          )}
        </td>
      )}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-500">
          {new Date(item.published_at).toLocaleDateString('zh-CN')}
        </div>
      </td>
      <td className="px-6 py-4 text-right text-sm font-medium">
        {item.status === 'pending' && (
          <button onClick={() => onPublish(item.id)} className="text-orange-600 hover:text-orange-900 mr-4 font-medium">
            发布
          </button>
        )}
        {item.status === 'published' && (
          <button onClick={() => onUnpublish(item.id)} className="text-purple-600 hover:text-purple-900 mr-4 font-medium">
            撤回
          </button>
        )}
        <button onClick={() => onPreview(item.id)} className="text-green-600 hover:text-green-900 mr-4 font-medium">
          预览
        </button>
        <button onClick={() => router.push(`/admin/news/${item.id}/edit`)} className="text-blue-600 hover:text-blue-900 mr-4 font-medium">
          编辑
        </button>
        <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900 font-medium">
          删除
        </button>
      </td>
    </tr>
  );
}
