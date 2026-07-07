'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTimes, faSpinner, faPaperPlane, faInfoCircle, faBookOpen } from '@fortawesome/free-solid-svg-icons';
import FeedbackBoard from '@/components/feedback-board';

export default function FeedbackButton() {
  const [showButton, setShowButton] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    content: '',
  });

  // 检查是否显示按钮
  useEffect(() => {
    fetch('/api/layout-config')
      .then((res) => res.json())
      .then((data) => {
        setShowButton(data.show_feedback_button !== false);
      })
      .catch(() => {
        setShowButton(true);
      });
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.contact || !formData.content) {
      showMessage('error', '请填写所有必填项');
      return;
    }

    if (formData.content.length < 5) {
      showMessage('error', '留言内容至少需要5个字符');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        showMessage('success', '留言提交成功，感谢您的建议！');
        setFormData({ name: '', contact: '', content: '' });
        setTimeout(() => {
          setModalOpen(false);
          setMessage(null);
        }, 2000);
      } else {
        showMessage('error', data.error || '提交失败，请重试');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      showMessage('error', '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!showButton) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-14 h-14 rounded-full bg-[#b71c1c] text-white shadow-lg hover:bg-[#8b0000] hover:scale-110 transition-all flex items-center justify-center group"
        aria-label="留言建议"
      >
        <FontAwesomeIcon icon={faComments} className="text-2xl" />
        {/* Tooltip */}
        <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          留言建议
        </span>
      </button>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => { setModalOpen(false); setMessage(null); }} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FontAwesomeIcon icon={faComments} className="text-[#b71c1c]" />
                  留言建议
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBoard(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                    title="查看留言板"
                  >
                    <FontAwesomeIcon icon={faBookOpen} />
                    <span>留言板</span>
                  </button>
                  <button
                    onClick={() => { setModalOpen(false); setMessage(null); }}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>

              {message && (
                <div className={`mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <FontAwesomeIcon icon={message.type === 'success' ? faPaperPlane : faInfoCircle} />
                  <span>{message.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                    placeholder="请输入您的姓名"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    联系方式 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                    placeholder="手机号或邮箱"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    建议内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent resize-none"
                    placeholder="请输入您的建议或意见..."
                    disabled={submitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">至少5个字符</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setModalOpen(false); setMessage(null); }}
                    className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={submitting}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm bg-[#b71c1c] text-white rounded-lg hover:bg-[#8b0000] transition-colors disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={submitting ? faSpinner : faPaperPlane} className={submitting ? 'animate-spin' : ''} />
                    {submitting ? '提交中...' : '提交留言'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 留言板 */}
      {showBoard && (
        <FeedbackBoard onClose={() => setShowBoard(false)} />
      )}
    </>
  );
}
