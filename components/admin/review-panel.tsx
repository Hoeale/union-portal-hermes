'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle, faTimesCircle, faEdit, faClock,
  faComment, faHistory
} from '@fortawesome/free-solid-svg-icons';
import { useCsrfToken } from '@/hooks';

interface ReviewLog {
  id: string;
  action: string;
  reviewer: string;
  comment: string | null;
  statusBefore: string;
  statusAfter: string;
  createdAt: string;
}

interface ReviewPanelProps {
  contentType: 'news' | 'policy';
  contentId: string;
  currentStatus: string;
  onReviewComplete?: () => void;
}

export default function ReviewPanel({
  contentType,
  contentId,
  currentStatus,
  onReviewComplete,
}: ReviewPanelProps) {
  const csrfToken = useCsrfToken();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_changes'>('approve');
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewHistory, setReviewHistory] = useState<ReviewLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [reviewEnabled, setReviewEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // 检查审核功能是否开启
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setReviewEnabled(result.data.review_enabled || false);
        }
      })
      .catch((err) => console.error('Failed to fetch settings:', err))
      .finally(() => setLoading(false));
  }, []);

  // 获取审核历史
  useEffect(() => {
    if (!reviewEnabled) return;

    fetch(`/api/admin/${contentType}/${contentId}/review-history`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setReviewHistory(result.data);
        }
      })
      .catch((err) => console.error('Failed to fetch review history:', err));
  }, [contentType, contentId, reviewEnabled]);

  // 提交审核
  const handleSubmitReview = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/${contentType}/${contentId}/review`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          action: reviewAction,
          comment: reviewComment.trim() || null,
        }),
      });

      const result = await res.json();

      if (result.success) {
        alert(result.message);
        setShowReviewForm(false);
        setReviewComment('');
        onReviewComplete?.();
      } else {
        alert(result.error || '审核失败');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('审核失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 提交内容供审核
  const handleSubmitForReview = async () => {
    if (!confirm('确定要提交审核吗？')) return;

    try {
      const res = await fetch(`/api/admin/${contentType}/${contentId}/submit-review`, {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });

      const result = await res.json();

      if (result.success) {
        alert('已提交审核');
        onReviewComplete?.();
      } else {
        alert(result.error || '提交失败');
      }
    } catch (error) {
      console.error('Error submitting for review:', error);
      alert('提交失败，请重试');
    }
  };

  const actionConfig = {
    approve: {
      label: '通过',
      icon: faCheckCircle,
      color: 'bg-green-600 hover:bg-green-700',
    },
    reject: {
      label: '驳回',
      icon: faTimesCircle,
      color: 'bg-red-600 hover:bg-red-700',
    },
    request_changes: {
      label: '退回修改',
      icon: faEdit,
      color: 'bg-orange-600 hover:bg-orange-700',
    },
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'submit':
        return '提交审核';
      case 'approve':
        return '审核通过';
      case 'reject':
        return '审核驳回';
      case 'request_changes':
        return '退回修改';
      default:
        return action;
    }
  };

  // 如果审核功能未开启，显示提示
  if (!reviewEnabled && !loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">审核管理</h3>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">
            审核功能未开启，请在 <a href="/admin/settings" className="text-blue-600 hover:text-blue-700">系统设置</a> 中开启内容审核功能
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-4 text-gray-500">加载中...</div>
      </div>
    );
  }

  // 如果已经是已发布状态，不显示审核面板
  if (currentStatus === 'published') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">审核管理</h3>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          <FontAwesomeIcon icon={faHistory} className="mr-1" />
          审核历史
        </button>
      </div>

      {showHistory ? (
        <div className="space-y-3">
          {reviewHistory.length === 0 ? (
            <p className="text-center text-gray-500 py-4">暂无审核记录</p>
          ) : (
            reviewHistory.map((log) => (
              <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {getActionLabel(log.action)}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(log.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">审核人：{log.reviewer}</p>
                {log.comment && (
                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                    <FontAwesomeIcon icon={faComment} className="mr-1 text-gray-400" />
                    {log.comment}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      ) : currentStatus === 'pending' ? (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faClock} className="text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-700">该内容待审核</span>
            </div>
          </div>

          {!showReviewForm ? (
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              开始审核
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  审核操作
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(actionConfig) as Array<keyof typeof actionConfig>).map((action) => (
                    <button
                      key={action}
                      onClick={() => setReviewAction(action)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        reviewAction === action
                          ? actionConfig[action].color + ' text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FontAwesomeIcon icon={actionConfig[action].icon} className="mr-1" />
                      {actionConfig[action].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  审核意见（选填）
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入审核意见..."
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '提交中...' : '确认提交'}
                </button>
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewComment('');
                  }}
                  className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleSubmitForReview}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          提交审核
        </button>
      )}
    </div>
  );
}
