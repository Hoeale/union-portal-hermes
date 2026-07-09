'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComments, faTrash, faSpinner, faInfoCircle,
  faEye, faEyeSlash, faCheckDouble, faReply, faChartBar,
  faLightbulb, faExclamationTriangle, faThumbsUp, faQuestionCircle,
  faClock, faHourglassHalf, faCheckCircle, faBookOpen, faBookmark
} from '@fortawesome/free-solid-svg-icons';
import FeedbackReplyForm from '@/components/admin/feedback-reply-form';
import FeedbackCommentManager from '@/components/admin/feedback-comment-manager';
import FeedbackCommentsModal from '@/components/admin/feedback-comments-modal';
import FeedbackStats from '@/components/admin/feedback-stats';
import { useCsrfToken, useMessage, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface Feedback {
  id: string;
  name: string;
  contact: string;
  content: string;
  isRead: boolean;
  isPublic?: boolean;
  category?: string;
  status?: string;
  reply?: string;
  replyBy?: string;
  replyAt?: string;
  createdAt: string;
}

interface FeedbackComment {
  id: string;
  name: string;
  content: string;
  isReply: boolean;
  isVisible: boolean;
  createdAt: string;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  suggestion: { label: '建议', icon: faLightbulb, color: 'text-blue-700', bgColor: 'bg-blue-100' },
  complaint: { label: '投诉', icon: faExclamationTriangle, color: 'text-red-700', bgColor: 'bg-red-100' },
  praise: { label: '表扬', icon: faThumbsUp, color: 'text-green-700', bgColor: 'bg-green-100' },
  question: { label: '咨询', icon: faQuestionCircle, color: 'text-purple-700', bgColor: 'bg-purple-100' },
};

const STATUS_MAP: Record<string, { label: string; icon: any; color: string; bgColor: string; dotColor: string }> = {
  unread: { label: '未读', icon: faClock, color: 'text-red-700', bgColor: 'bg-red-100', dotColor: 'bg-red-500' },
  read: { label: '已读', icon: faEye, color: 'text-blue-700', bgColor: 'bg-blue-100', dotColor: 'bg-blue-500' },
};

export default function AdminFeedbackPage() {
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>(
    () => (searchParams.get('filter') as 'all' | 'unread' | 'read') || 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmIds, setDeleteConfirmIds] = useState<string[] | null>(null);
  const [viewContentId, setViewContentId] = useState<string | null>(null);
  const [viewComments, setViewComments] = useState<FeedbackComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyFeedbackId, setReplyFeedbackId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [statusUpdateConfirm, setStatusUpdateConfirm] = useState<{ id: string; newStatus: string } | null>(null);

  const selectAllRef = useRef<HTMLInputElement>(null);

  // 更新全选框的 indeterminate 状态
  useEffect(() => {
    if (selectAllRef.current) {
      const isSomeSelected = selectedIds.size > 0 && selectedIds.size < feedbacks.length;
      selectAllRef.current.indeterminate = isSomeSelected;
    }
  }, [selectedIds, feedbacks.length]);

  // 切换筛选时清空选择
  const handleFilterChange = (newFilter: 'all' | 'unread' | 'read') => {
    setFilter(newFilter);
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
    setSelectedIds(new Set());
  };

  const fetchFeedbacks = async () => {
    try {
      const params = new URLSearchParams({
        filter,
        page: page.toString(),
        pageSize: '20',
      });
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      const data = await apiClient.get<any>(`/api/admin/feedback?${params}`);
      setFeedbacks(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      
      // 获取总数和未读数（用于标签显示）
      if (data.totalCount !== undefined) {
        setTotalCount(data.totalCount);
      }
      if (data.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      logger.error('[Feedback] 获取留言失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和筛选条件变化时重新加载
  useEffect(() => {
    fetchFeedbacks();
  }, [filter, statusFilter, page]);

  const fetchComments = async (feedbackId: string) => {
    setLoadingComments(true);
    try {
      const data = await apiClient.get<any>(`/api/admin/feedback/${feedbackId}/comments`);
      setViewComments(data.data || []);
    } catch (error) {
      logger.error('Failed to fetch comments:', error);
      setViewComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await apiClient.get<any>('/api/admin/feedback/unread-count');
      setUnreadCount(data.count);
    } catch (error) {
      logger.error('Failed to fetch unread count:', error);
    }
  };

  // 查看详情时同时获取评论
  const handleViewContent = (id: string) => {
    setViewContentId(id);
    fetchComments(id);
  };

  // 单条切换已读/未读
  const handleToggleRead = async (id: string, currentIsRead: boolean) => {
    try {
      await apiClient.put('/api/admin/feedback', { id, isRead: !currentIsRead }, { csrfToken });
      fetchFeedbacks();
      fetchUnreadCount();
      showMessage('success', !currentIsRead ? '已标记为已读' : '已标记为未读');
    } catch (error: any) {
      logger.error('Failed to toggle read:', error);
      showMessage('error', error.message || '操作失败');
    }
  };

  // 更新状态
  // 请求更新状态（显示确认弹窗）
  const handleUpdateStatus = (id: string, newStatus: string) => {
    setStatusUpdateConfirm({ id, newStatus });
  };
  
  // 执行状态更新
  const executeStatusUpdate = async () => {
    if (!statusUpdateConfirm) return;
    const { id, newStatus } = statusUpdateConfirm;
      
    try {
      await apiClient.patch(`/api/admin/feedback/${id}/status`, { status: newStatus }, { csrfToken });
      fetchFeedbacks();
      fetchUnreadCount();
      showMessage('success', `状态已更新为"${STATUS_MAP[newStatus]?.label || newStatus}"`);
    } catch (error: any) {
      logger.error('Failed to update status:', error);
      showMessage('error', error.message || '更新状态失败');
    } finally {
      setStatusUpdateConfirm(null);
    }
  };
  
  // 切换展示/隐藏
  const handleTogglePublic = async (id: string, currentIsPublic: boolean) => {
    try {
      await apiClient.put('/api/admin/feedback', { id, isPublic: !currentIsPublic }, { csrfToken });
      fetchFeedbacks();
      showMessage('success', !currentIsPublic ? '已设置为展示' : '已设置为隐藏');
    } catch (error: any) {
      logger.error('Failed to toggle public:', error);
      showMessage('error', error.message || '操作失败');
    }
  };

  const handleMarkAllRead = async () => {
    setSaving(true);
    try {
      await apiClient.put('/api/admin/feedback', { action: 'markReadAll' }, { csrfToken });
      fetchFeedbacks();
      fetchUnreadCount();
      showMessage('success', '已全部标记为已读');
    } catch (error: any) {
      logger.error('Failed to mark all as read:', error);
      showMessage('error', error.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  // 选择相关
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const allIds = new Set(feedbacks.map(f => f.id));
    setSelectedIds(allIds);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const isAllSelected = feedbacks.length > 0 && selectedIds.size >= feedbacks.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < feedbacks.length;

  // 批量标记
  const handleBulkMark = async (isRead: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      await apiClient.put('/api/admin/feedback', { ids: Array.from(selectedIds), isRead }, { csrfToken });
      setSelectedIds(new Set());
      fetchFeedbacks();
      fetchUnreadCount();
      showMessage('success', `已${isRead ? '标记为已读' : '标记为未读'} ${selectedIds.size} 条`);
    } catch (error: any) {
      logger.error('Failed to bulk mark:', error);
      showMessage('error', error.message || '操作失败');
    }
  };

  // 批量删除
  const handleBulkDelete = async () => {
    const idsToDelete = deleteConfirmIds;
    if (!idsToDelete || idsToDelete.length === 0) return;
    try {
      await fetch('/api/admin/feedback', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        credentials: 'include',
        body: JSON.stringify({ ids: idsToDelete }),
      });
      setSelectedIds(prev => {
        const next = new Set(prev);
        idsToDelete.forEach(id => next.delete(id));
        return next;
      });
      fetchFeedbacks();
      fetchUnreadCount();
      showMessage('success', `已删除 ${idsToDelete.length} 条`);
    } catch (error: any) {
      logger.error('Failed to bulk delete:', error);
      showMessage('error', error.message || '删除失败');
    } finally {
      setDeleteConfirmIds(null);
    }
  };

  // 单条删除
  const handleDelete = async () => {
    const idsToDelete = deleteConfirmIds;
    if (!idsToDelete || idsToDelete.length !== 1) return;
    try {
      await apiClient.delete(`/api/admin/feedback?id=${idsToDelete[0]}`, { csrfToken });
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(idsToDelete[0]);
        return next;
      });
      fetchFeedbacks();
      fetchUnreadCount();
      showMessage('success', '已删除');
    } catch (error: any) {
      logger.error('Failed to delete:', error);
      showMessage('error', error.message || '删除失败');
    } finally {
      setDeleteConfirmIds(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 检查选中项中是否有未读/已读
  const hasUnreadInSelection = feedbacks.some(f => selectedIds.has(f.id) && !f.isRead);
  const hasReadInSelection = feedbacks.some(f => selectedIds.has(f.id) && f.isRead);

  const getReplyFeedback = () => {
    if (!replyFeedbackId) return null;
    return feedbacks.find(f => f.id === replyFeedbackId) || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-gray-400" />
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#a51b1b] flex items-center gap-3">
            <FontAwesomeIcon icon={faComments} />
            留言建议管理
          </h1>
          <p className="text-gray-600 mt-1">查看和管理用户提交的留言建议</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faCheckDouble} />
              全部标记已读 ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <FontAwesomeIcon icon={faInfoCircle} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-100">
          {[
            { id: 'all', label: '全部', count: totalCount },
            { id: 'unread', label: '未读', count: unreadCount },
            { id: 'read', label: '已读' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                filter === tab.id
                  ? 'border-[#b71c1c] text-[#b71c1c]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Additional Filters */}
        <div className="flex items-center gap-4 px-6 py-3 border-t border-gray-100 bg-gray-50/50">
          <span className="text-sm text-gray-500">筛选：</span>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            {Object.entries(STATUS_MAP).map(([key, { label, bgColor, color }]) => (
              <button
                key={key}
                onClick={() => handleStatusFilterChange(statusFilter === key ? 'all' : key)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  statusFilter === key
                    ? `${bgColor} ${color} border-current`
                    : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {feedbacks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FontAwesomeIcon icon={faComments} className="text-4xl text-gray-300 mb-3" />
              <p>暂无留言数据</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-center w-12">
                    <input
                      type="checkbox"
                      ref={selectAllRef}
                      checked={isAllSelected}
                      onChange={isAllSelected ? deselectAll : selectAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#b71c1c] focus:ring-[#b71c1c] cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">姓名</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">联系方式</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">留言内容</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">状态</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">提交时间</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((fb) => {
                  const statusInfo = (fb.status ? (STATUS_MAP[fb.status] || null) : null) || (fb.isRead ? STATUS_MAP.read : STATUS_MAP.unread);

                  return (
                    <tr
                      key={fb.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        fb.status === 'unread' || (!fb.status && !fb.isRead) ? 'bg-red-50/30' : ''
                      } ${selectedIds.has(fb.id) ? 'bg-blue-50/50' : ''}`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(fb.id)}
                          onChange={() => toggleSelect(fb.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#b71c1c] focus:ring-[#b71c1c] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{fb.name}</td>
                      <td className="px-4 py-3 text-gray-600">{fb.contact}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs">
                        <div
                          className="truncate cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={() => handleViewContent(fb.id)}
                          title="点击查看完整内容"
                        >
                          {fb.content}
                        </div>
                        {fb.reply && (
                          <div className="mt-1 text-xs text-green-600 truncate" title="已有回复">
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                            已回复
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`}></span>
                            {statusInfo.label}
                          </span>
                          {/* 状态下拉切换 */}
                          <select
                            value={fb.status || (fb.isRead ? 'read' : 'unread')}
                            onChange={(e) => handleUpdateStatus(fb.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-[#b71c1c] focus:border-transparent cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="unread">未读</option>
                            <option value="read">已读</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(fb.createdAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleTogglePublic(fb.id, fb.isPublic || false)}
                            className={`p-1.5 rounded transition-colors ${
                              fb.isPublic
                                ? 'text-purple-600 hover:bg-purple-50'
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={fb.isPublic ? '展示中（点击隐藏）' : '隐藏（点击展示）'}
                          >
                            <FontAwesomeIcon icon={fb.isPublic ? faEye : faEyeSlash} className="text-sm" />
                          </button>
                          <button
                            onClick={() => setReplyFeedbackId(fb.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="回复"
                          >
                            <FontAwesomeIcon icon={faReply} className="text-sm" />
                          </button>
                          {!fb.isRead ? (
                            <button
                              onClick={() => handleToggleRead(fb.id, false)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="标记已读"
                            >
                              <FontAwesomeIcon icon={faBookmark} className="text-sm" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleRead(fb.id, true)}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                              title="标记未读"
                            >
                              <FontAwesomeIcon icon={faBookmark} className="text-sm" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirmIds([fb.id])}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="删除"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-600">
              共 {total} 条，第 {page} / {totalPages} 页
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Operations Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              已选择 <span className="text-[#b71c1c] font-bold">{selectedIds.size}</span> 项
            </span>
            <div className="flex gap-3">
              {(hasUnreadInSelection || filter === 'unread') && (
                <button
                  onClick={() => handleBulkMark(true)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  标记已读
                </button>
              )}
              {(hasReadInSelection || filter === 'read') && (
                <button
                  onClick={() => handleBulkMark(false)}
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  标记未读
                </button>
              )}
              <button
                onClick={() => setDeleteConfirmIds(Array.from(selectedIds))}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                删除选中
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmIds && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setDeleteConfirmIds(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">确认删除</h3>
              <p className="text-sm text-gray-600 mb-6">
                {deleteConfirmIds.length === 1
                  ? '删除后无法恢复，确定要删除这条留言吗？'
                  : `确定要删除选中的 ${deleteConfirmIds.length} 条留言吗？删除后无法恢复。`}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmIds(null)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Content Modal */}
      {viewContentId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setViewContentId(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">留言详情</h3>
                <button
                  onClick={() => setViewContentId(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {(() => {
                const fb = feedbacks.find(f => f.id === viewContentId);
                if (!fb) return null;
                const statusInfo = fb.status ? STATUS_MAP[fb.status] : (fb.isRead ? STATUS_MAP.read : STATUS_MAP.unread);

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">姓名：</span>
                        <span className="font-medium text-gray-900">{fb.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">联系方式：</span>
                        <span className="font-medium text-gray-900">{fb.contact}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">提交时间：</span>
                        <span className="text-gray-700">{formatDate(fb.createdAt)}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">留言状态：</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`}></span>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">留言内容：</div>
                      <div className="bg-gray-50 rounded-lg p-4 text-gray-800 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                        {fb.content}
                      </div>
                    </div>
                    {fb.reply && (
                      <div className="border-t border-gray-200 pt-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">管理员回复：</div>
                        <div className="bg-green-50 rounded-lg p-4 text-gray-800 border border-green-100">
                          <div
                            className="whitespace-pre-wrap break-words"
                            dangerouslySetInnerHTML={{ __html: fb.reply }}
                          />
                          <div className="mt-2 text-xs text-gray-500">
                            回复人：{fb.replyBy} | 回复时间：{fb.replyAt ? formatDate(fb.replyAt) : '-'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 评论管理 */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        回复记录与管理
                      </div>
                      {loadingComments ? (
                        <div className="text-center py-4 text-gray-400">
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                          <p className="mt-2 text-sm">加载中...</p>
                        </div>
                      ) : (
                        <FeedbackCommentManager
                          feedbackId={fb.id}
                          comments={viewComments}
                          hasReply={!!fb.reply}
                          onCommentAdded={() => fetchComments(fb.id)}
                          onCommentUpdated={() => fetchComments(fb.id)}
                        />
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Reply Form Modal */}
      {replyFeedbackId && getReplyFeedback() && (
        <FeedbackReplyForm
          feedback={getReplyFeedback()!}
          onSuccess={() => {
            fetchFeedbacks();
            fetchUnreadCount();
          }}
          onClose={() => setReplyFeedbackId(null)}
        />
      )}

      {/* Stats Modal */}
      {/* 状态更新确认弹窗 */}
      {statusUpdateConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setStatusUpdateConfirm(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">确认修改状态</h3>
              <p className="text-sm text-gray-600 mb-6 text-center">
                确定要将此留言状态修改为{'\u201C'}<span className="font-semibold text-[#b71c1c]">{STATUS_MAP[statusUpdateConfirm.newStatus]?.label || statusUpdateConfirm.newStatus}</span>{'\u201D'}吗？
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setStatusUpdateConfirm(null)}
                  className="px-6 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={executeStatusUpdate}
                  className="px-6 py-2 text-sm bg-[#b71c1c] text-white rounded-lg hover:bg-[#8b0000] transition-colors font-medium"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
