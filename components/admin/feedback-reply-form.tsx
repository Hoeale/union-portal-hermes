'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane, faSpinner, faCheckCircle,
  faTimesCircle, faQuoteLeft
} from '@fortawesome/free-solid-svg-icons';

interface FeedbackReplyFormProps {
  feedback: {
    id: string;
    name: string;
    contact: string;
    content: string;
    category?: string;
    createdAt: string;
    reply?: string; // 添加 reply 字段用于判断是否已有回复
  };
  onSuccess: () => void;
  onClose: () => void;
}

// 快捷回复模板
const QUICK_TEMPLATES = [
  { label: '感谢反馈', text: '感谢您的宝贵反馈，我们会认真考虑您的建议并持续改进服务。' },
  { label: '正在处理', text: '您的反馈我们已经收到，正在积极处理中，请耐心等待。' },
  { label: '已解决问题', text: '您反馈的问题我们已经解决，如有其他问题请随时联系我们。' },
  { label: '需要补充信息', text: '感谢您的反馈。为了更好地帮助您，请提供更详细的信息，我们将尽快处理。' },
  { label: '转交相关部门', text: '您的反馈已转交至相关部门处理，我们会在第一时间给您回复。' },
];

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  suggestion: { label: '建议', color: 'text-blue-600 bg-blue-100' },
  complaint: { label: '投诉', color: 'text-red-600 bg-red-100' },
  praise: { label: '表扬', color: 'text-green-600 bg-green-100' },
  question: { label: '咨询', color: 'text-purple-600 bg-purple-100' },
};

export default function FeedbackReplyForm({ feedback, onSuccess, onClose }: FeedbackReplyFormProps) {
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('processing'); // 默认处理中
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reply.trim()) {
      setMessage({ type: 'error', text: '回复内容不能为空' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // 获取 CSRF token
      const csrfResponse = await fetch('/api/admin/csrf-token');
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.token;

      // 判断是首次回复还是追加回复
      const hasExistingReply = feedback.reply && feedback.reply.trim();
      
      let response;
      if (hasExistingReply) {
        // 已有回复，使用评论 API 追加
        response = await fetch(`/api/admin/feedback/${feedback.id}/comment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify({ 
            content: reply, 
            isReply: true,
            status 
          }),
        });
      } else {
        // 首次回复，使用回复 API
        response = await fetch(`/api/admin/feedback/${feedback.id}/reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify({ reply, status }),
        });
      }

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: hasExistingReply ? '追加回复成功！' : '回复成功！' });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.error || '回复失败' });
      }
    } catch (error) {
      console.error('Failed to reply:', error);
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const insertTemplate = (text: string) => {
    setReply(prev => prev ? prev + '\n\n' + text : text);
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

  const categoryInfo = feedback.category ? CATEGORY_MAP[feedback.category] : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-10 pb-20">
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faPaperPlane} className="text-[#b71c1c]" />
              {feedback.reply ? '追加回复' : '回复反馈'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <FontAwesomeIcon icon={message.type === 'success' ? faCheckCircle : faTimesCircle} />
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Original Feedback */}
          <div className="mb-6 bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
              <FontAwesomeIcon icon={faQuoteLeft} className="text-gray-400" />
              <span>原始反馈内容</span>
              {categoryInfo && (
                <span className={`ml-auto px-2 py-0.5 text-xs rounded-full ${categoryInfo.color}`}>
                  {categoryInfo.label}
                </span>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">姓名：</span>
                <span className="font-medium text-gray-900">{feedback.name}</span>
                <span className="text-gray-500 ml-4">联系方式：</span>
                <span className="font-medium text-gray-900">{feedback.contact}</span>
              </div>
              <div className="text-xs text-gray-400">
                提交时间：{formatDate(feedback.createdAt)}
              </div>
              <div className="bg-white rounded-lg p-4 text-gray-800 whitespace-pre-wrap break-words border border-gray-200">
                {feedback.content}
              </div>
            </div>
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSubmit}>
            {/* 显示之前的回复记录（追加回复时） */}
            {feedback.reply && (
              <div className="mb-6 bg-green-50 rounded-xl p-5 border border-green-200">
                <div className="flex items-center gap-2 mb-3 text-sm text-green-700 font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  之前的回复记录
                </div>
                <div className="bg-white rounded-lg p-4 text-gray-800 whitespace-pre-wrap break-words border border-green-100">
                  <div dangerouslySetInnerHTML={{ __html: feedback.reply || '' }} />
                </div>
              </div>
            )}

            {/* Status Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                反馈状态
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="processing"
                    checked={status === 'processing'}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-4 h-4 text-[#b71c1c] border-gray-300 focus:ring-[#b71c1c]"
                  />
                  <span className="text-sm text-gray-700">处理中</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="resolved"
                    checked={status === 'resolved'}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-600"
                  />
                  <span className="text-sm text-gray-700">已解决</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                回复内容
              </label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="请输入回复内容..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent resize-none text-gray-800"
              />
              <div className="mt-1 text-xs text-gray-400 text-right">
                {reply.length} 字符
              </div>
            </div>

            {/* Quick Templates */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                快捷回复模板
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_TEMPLATES.map((template) => (
                  <button
                    key={template.label}
                    type="button"
                    onClick={() => insertTemplate(template.text)}
                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors border border-gray-200"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-sm bg-[#b71c1c] text-white rounded-lg hover:bg-[#8c1515] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} />
                    {feedback.reply ? '添加回复' : '首次回复'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
