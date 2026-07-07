'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrash, faEye, faEyeSlash, faSpinner,
  faCheckCircle, faTimesCircle, faComment,
  faReply, faHistory
} from '@fortawesome/free-solid-svg-icons';

interface Comment {
  id: string;
  name: string;
  content: string;
  isReply: boolean;
  isVisible: boolean;
  createdAt: string;
}

interface FeedbackCommentManagerProps {
  feedbackId: string;
  comments: Comment[];
  hasReply: boolean; // 是否有首次回复
  onCommentAdded: () => void;
  onCommentUpdated: () => void;
}

export default function FeedbackCommentManager({
  feedbackId,
  comments,
  hasReply,
  onCommentAdded,
  onCommentUpdated,
}: FeedbackCommentManagerProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newReply, setNewReply] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  // 获取 CSRF token
  const getCsrfToken = async (): Promise<string> => {
    const csrfResponse = await fetch('/api/admin/csrf-token');
    const csrfData = await csrfResponse.json();
    return csrfData.token;
  };

  // 追加回复
  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newReply.trim()) {
      setMessage({ type: 'error', text: '回复内容不能为空' });
      return;
    }

    setLoading('reply');
    setMessage(null);

    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`/api/admin/feedback/${feedbackId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          content: newReply,
          isReply: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: '回复成功！' });
        setNewReply('');
        setShowReplyForm(false);
        onCommentAdded();
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || '回复失败' });
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setLoading(null);
    }
  };

  // 删除评论
  const handleDelete = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？此操作不可恢复。')) {
      return;
    }

    setLoading(commentId);
    setMessage(null);

    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`/api/admin/feedback/comment/${commentId}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: '评论已删除' });
        onCommentUpdated();
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || '删除失败' });
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setLoading(null);
    }
  };

  // 切换可见性
  const handleToggleVisibility = async (commentId: string, currentVisibility: boolean) => {
    setLoading(commentId);
    setMessage(null);

    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`/api/admin/feedback/comment/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ isVisible: !currentVisibility }),
      });

      const data = await response.json();

      if (response.ok) {
        const action = !currentVisibility ? '显示' : '隐藏';
        setMessage({ type: 'success', text: `已${action}评论` });
        onCommentUpdated();
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || '操作失败' });
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setLoading(null);
    }
  };

  // 格式化时间
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (comments.length === 0 && !showReplyForm) {
    return (
      <div className="text-center py-8 text-gray-400">
        <FontAwesomeIcon icon={faComment} className="text-4xl mb-3 opacity-50" />
        <p>暂无回复记录</p>
        <button
          onClick={() => setShowReplyForm(true)}
          className="mt-3 px-4 py-2 text-sm bg-[#b71c1c] text-white rounded-lg hover:bg-[#8c1515] transition-colors"
        >
          {hasReply ? '追加回复' : '添加首次回复'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Message Alert */}
      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <FontAwesomeIcon icon={message.type === 'success' ? faCheckCircle : faTimesCircle} />
          <span className="text-sm">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`rounded-xl border transition-all ${
              comment.isVisible
                ? 'bg-white border-gray-200'
                : 'bg-gray-50 border-gray-300 opacity-60'
            }`}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    comment.isReply
                      ? 'bg-[#b71c1c] text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    <FontAwesomeIcon
                      icon={comment.isReply ? faReply : faComment}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{comment.name}</span>
                      {comment.isReply && (
                        <span className="px-2 py-0.5 text-xs bg-[#b71c1c] text-white rounded-full">
                          管理员
                        </span>
                      )}
                      {!comment.isVisible && (
                        <span className="px-2 py-0.5 text-xs bg-gray-500 text-white rounded-full">
                          已隐藏
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <FontAwesomeIcon icon={faHistory} className="text-[10px]" />
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleVisibility(comment.id, comment.isVisible)}
                    disabled={loading === comment.id}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                    title={comment.isVisible ? '隐藏' : '显示'}
                  >
                    <FontAwesomeIcon
                      icon={comment.isVisible ? faEye : faEyeSlash}
                      className="text-sm"
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={loading === comment.id}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="删除"
                  >
                    {loading === comment.id ? (
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm" />
                    ) : (
                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
                    )}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className={`text-sm whitespace-pre-wrap break-words ${
                comment.isVisible ? 'text-gray-800' : 'text-gray-500 italic'
              }`}>
                <div dangerouslySetInnerHTML={{ __html: comment.content }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Reply Button/Form */}
      {!showReplyForm ? (
        <button
          onClick={() => setShowReplyForm(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#b71c1c] hover:text-[#b71c1c] transition-colors flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faReply} />
          追加回复
        </button>
      ) : (
        <form onSubmit={handleAddReply} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              追加回复
            </label>
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="请输入回复内容..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent resize-none text-gray-800"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowReplyForm(false);
                setNewReply('');
              }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading === 'reply'}
              className="px-4 py-2 text-sm bg-[#b71c1c] text-white rounded-lg hover:bg-[#8c1515] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading === 'reply' ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faReply} />
                  发送回复
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
