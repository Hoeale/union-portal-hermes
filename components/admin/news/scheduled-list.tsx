'use client';

import { News } from '@/hooks/useNewsManagement';

interface ScheduledListProps {
  scheduledNews: News[];
  loading: boolean;
  onExecuteScheduled: () => void;
  onPublishScheduled: (id: string) => void;
  onCancelScheduled: (id: string) => void;
}

export default function ScheduledList({
  scheduledNews,
  loading,
  onExecuteScheduled,
  onPublishScheduled,
  onCancelScheduled,
}: ScheduledListProps) {
  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-3">加载中...</p>
      </div>
    );
  }

  if (scheduledNews.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        <p>暂无定时发布的新闻</p>
        <p className="text-sm mt-1">在发布新闻时可选择定时发布</p>
      </div>
    );
  }

  return (
    <div>
      <div className="px-6 py-4 border-b border-gray-200 bg-blue-50 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">定时发布列表</h3>
        <button
          onClick={onExecuteScheduled}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          立即执行到期发布
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">标题</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">分类</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">计划发布时间</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">状态</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {scheduledNews.map((item) => {
              const isExpired = item.scheduled_publish_at && new Date(item.scheduled_publish_at) <= new Date();
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{item.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-[#b71c1c]/10 text-[#b71c1c]">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {item.scheduled_publish_at ? new Date(item.scheduled_publish_at).toLocaleString('zh-CN') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                      isExpired ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isExpired ? '已到期' : '待发布'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => onPublishScheduled(item.id)}
                      className="text-green-600 hover:text-green-900 mr-4 font-medium"
                    >
                      立即发布
                    </button>
                    <button
                      onClick={() => onCancelScheduled(item.id)}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      取消定时
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
