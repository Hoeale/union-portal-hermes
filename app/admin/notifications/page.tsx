'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell, faComment, faCalendar, faExclamationTriangle,
  faInfoCircle, faCheckDouble, faSpinner, faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useCsrfToken, useMessage, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

const NOTIFICATION_CONFIG: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
  feedback: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: faComment,
    label: '反馈',
  },
  schedule: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: faCalendar,
    label: '定时',
  },
  content_expired: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: faExclamationTriangle,
    label: '过期',
  },
  system: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    icon: faInfoCircle,
    label: '系统',
  },
};

export default function AdminNotificationsPage() {
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [filter, page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      });
      if (filter === 'unread') {
        params.set('isRead', 'false');
      } else if (filter === 'read') {
        params.set('isRead', 'true');
      }

      const data = await apiClient.get<any>(`/api/admin/notifications?${params}`);
      setNotifications(data.data || []);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      logger.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await apiClient.get<any>('/api/admin/notifications/unread-count');
      setUnreadCount(data.count);
    } catch (error) {
      logger.error('Failed to fetch unread count:', error);
    }
  };


  // 标记单个通知为已读
  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.put(`/api/admin/notifications/${id}/read`, {}, { csrfToken });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      fetchUnreadCount();
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
    }
  };

  // 全部标记已读
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      showMessage('info', '没有未读通知');
      return;
    }

    try {
      setSaving(true);
      await apiClient.put('/api/admin/notifications/read-all', {}, { csrfToken });
      showMessage('success', '已全部标记为已读');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      fetchUnreadCount();
    } catch (error: any) {
      logger.error('Failed to mark all as read:', error);
      showMessage('error', error.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleString('zh-CN');
  };

  // 点击通知
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理系统通知和提醒
          </p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          disabled={saving || unreadCount === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          ) : (
            <FontAwesomeIcon icon={faCheckDouble} />
          )}
          全部标记已读
          {unreadCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-red-500 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 提示消息 */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : message.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 筛选标签 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setFilter('all');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              全部 ({total})
            </button>
            <button
              onClick={() => {
                setFilter('unread');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              未读
            </button>
            <button
              onClick={() => {
                setFilter('read');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              已读
            </button>
          </div>
        </div>

        {/* 通知列表 */}
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FontAwesomeIcon icon={faBell} className="text-4xl mb-3" />
              <p className="text-sm">暂无通知</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.system;

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* 类型图标 */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${config.bgColor} ${config.color}`}
                    >
                      <FontAwesomeIcon icon={config.icon} className="text-lg" />
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                          {config.label}
                        </span>
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                        )}
                      </div>
                      <p
                        className="text-sm text-gray-600 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: notification.message }}
                      />
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{formatTime(notification.createdAt)}</span>
                        {notification.isRead && notification.readAt && (
                          <span>
                            已读于 {new Date(notification.readAt).toLocaleString('zh-CN')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="标记已读"
                      >
                        <FontAwesomeIcon icon={faCheckDouble} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              共 {total} 条记录，第 {page} / {totalPages} 页
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
