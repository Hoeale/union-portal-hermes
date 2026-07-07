'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCalendarAlt, faTimesCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useCsrfToken, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface ScheduledItem {
  id: string;
  title: string;
  category: string;
  scheduledPublishAt: string;
  status?: string;
}

interface ScheduledData {
  news: ScheduledItem[];
  policies: ScheduledItem[];
  videos: ScheduledItem[];
  total: number;
}

export default function ScheduledPage() {
  const csrfToken = useCsrfToken();
  const [data, setData] = useState<ScheduledData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<any>('/api/admin/scheduled-content?type=all');
      setData(result.data);
    } catch (error) {
      logger.error('Failed to fetch scheduled content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = async (id: string, type: 'news' | 'policy' | 'video') => {
    if (!confirm('确定要取消这条定时发布吗？')) return;

    setCancelling(id);
    try {
      await apiClient.delete(`/api/admin/${type === 'news' ? 'news' : type === 'policy' ? 'policies' : 'videos'}/${id}/schedule`, { csrfToken });
      fetchData();
    } catch (error) {
      logger.error('Failed to cancel schedule:', error);
      alert('取消失败');
    } finally {
      setCancelling(null);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (dateStr: string) => {
    return new Date(dateStr) <= new Date();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-3">加载中...</p>
      </div>
    );
  }

  const allItems = [
    ...(data?.news || []).map((item) => ({ ...item, type: 'news' as const })),
    ...(data?.policies || []).map((item) => ({ ...item, type: 'policy' as const })),
    ...(data?.videos || []).map((item) => ({ ...item, type: 'video' as const })),
  ].sort((a, b) => new Date(a.scheduledPublishAt).getTime() - new Date(b.scheduledPublishAt).getTime());

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-[#1e2b3c]">待发布内容</h1>
        <p className="text-gray-500 mt-1">
          共 {data?.total || 0} 条内容已设置定时发布
        </p>
      </div>

      {/* 列表 */}
      {allItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FontAwesomeIcon icon={faCalendarAlt} className="text-5xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">暂无待发布内容</h3>
          <p className="text-gray-500 mt-2">在编辑新闻/政策/视频时可设置定时发布</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">标题</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">计划发布时间</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allItems.map((item) => {
                const expired = isExpired(item.scheduledPublishAt);
                return (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        item.type === 'news' ? 'bg-blue-100 text-blue-700' :
                        item.type === 'policy' ? 'bg-purple-100 text-purple-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.type === 'news' ? '新闻' : item.type === 'policy' ? '政策' : '视频'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <FontAwesomeIcon icon={faClock} className="mr-2 text-gray-400" />
                        {formatTime(item.scheduledPublishAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center text-sm ${
                        expired ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        <FontAwesomeIcon
                          icon={expired ? faCheckCircle : faClock}
                          className="mr-1"
                        />
                        {expired ? '已到期' : '待发布'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleCancel(item.id, item.type)}
                        disabled={cancelling === item.id}
                        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faTimesCircle} className="mr-1" />
                        取消
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
