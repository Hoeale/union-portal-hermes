'use client';

import { CheckSquare, Square } from 'lucide-react';
import BatchActionsBar from '@/components/admin/batch-actions-bar';
import { News } from '@/hooks/useNewsManagement';
import NewsTableRow from './news-table-row';
import Pagination from './pagination';

interface NewsListProps {
  news: News[];
  loading: boolean;
  total: number;
  currentPage: number;
  totalPages: number;
  categoryFilter: string;
  selectedIds: string[];
  onSelectAll: () => void;
  onSelectOne: (id: string) => void;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onPreview: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onToggleNotice: (id: string, isNotice: boolean | undefined) => void;
  onPageChange: (page: number) => void;
  onBatchActionComplete: () => void;
}

export default function NewsList({
  news,
  loading,
  total,
  currentPage,
  totalPages,
  categoryFilter,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onPublish,
  onUnpublish,
  onPreview,
  onDelete,
  onToggleNotice,
  onPageChange,
  onBatchActionComplete,
}: NewsListProps) {
  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#b71c1c]"></div>
        <p className="mt-3">加载中...</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <p className="mt-3 text-lg font-medium">暂无新闻数据</p>
        <p className="text-sm mt-1">点击上方按钮发布第一条新闻</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-4 w-10">
                <button onClick={onSelectAll} className="text-gray-600 hover:text-[#b71c1c] transition-colors">
                  {selectedIds.length === news.length && news.length > 0 ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">标题</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">分类</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">轮播</th>
              {(categoryFilter === '通知要闻' || categoryFilter === '公示公告') && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">是否展示</th>
              )}
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">发布时间</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {news.map((item) => (
              <NewsTableRow
                key={item.id}
                item={item}
                categoryFilter={categoryFilter}
                isSelected={selectedIds.includes(item.id)}
                onSelect={() => onSelectOne(item.id)}
                onPublish={onPublish}
                onUnpublish={onUnpublish}
                onPreview={onPreview}
                onDelete={onDelete}
                onToggleNotice={onToggleNotice}
              />
            ))}
          </tbody>
        </table>
      </div>

      {selectedIds.length > 0 && (
        <BatchActionsBar
          selectedIds={selectedIds}
          onClearSelection={() => {}}
          onActionComplete={onBatchActionComplete}
          apiEndpoint="/api/admin/news/batch-action"
          actions={{
            publish: { label: '发布', value: 'publish' },
            unpublish: { label: '撤回', value: 'unpublish' },
            delete: { label: '删除', value: 'delete' },
            updateCategory: { label: '修改分类', value: 'update_category', options: [
              { label: '动态', value: '动态' },
              { label: '通知', value: '通知' },
              { label: '公告', value: '公告' },
            ]},
            setCarousel: { label: '设轮播', value: 'set_carousel' },
            unsetCarousel: { label: '取消轮播', value: 'unset_carousel' },
          }}
        />
      )}

      <Pagination
        total={total}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
}
