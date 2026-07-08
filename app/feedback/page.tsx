'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComments, faPaperPlane, faSpinner, faCheckCircle,
  faTimes, faInfoCircle, faUser, faCalendar, faReply
} from '@fortawesome/free-solid-svg-icons';
import FrontendWrapper from '@/components/frontend-wrapper';

interface PublicFeedback {
  id: string;
  name: string;
  content: string;
  status: string;
  reply: string | null;
  replyAt: string | null;
  createdAt: string;
}

export default function FeedbackPage() {
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // 公开留言列表
  const [publicFeedbacks, setPublicFeedbacks] = useState<PublicFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // 获取公开留言
  useEffect(() => {
    fetchPublicFeedbacks();
  }, [currentPage, categoryFilter]);

  const fetchPublicFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '10',
      });
      if (categoryFilter !== 'all') {
        params.set('category', categoryFilter);
      }

      const response = await fetch(`/api/feedback/public?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPublicFeedbacks(data.data || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch public feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.contact.trim() || !formData.content.trim()) {
      setError('请填写所有必填项');
      return;
    }
    if (formData.content.trim().length < 5) {
      setError('留言内容至少需要5个字符');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          contact: formData.contact.trim(),
          content: formData.content.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
        setFormData({ name: '', contact: '', content: '' });
      } else {
        setError(data.error || '提交失败，请重试');
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setError('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ name: '', contact: '', content: '' });
    setError('');
    setSubmitted(false);
  };

  const getCategoryLabel = (category: string | null) => {
    const labels: Record<string, string> = {
      suggestion: '建议',
      complaint: '投诉',
      praise: '表扬',
      question: '咨询',
    };
    return category ? labels[category] || '其他' : '其他';
  };

  return (
    <FrontendWrapper>
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-[#b71c1c] rounded-full" />
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">留言建议</h1>
          </div>
          <p className="text-gray-600">欢迎提出宝贵意见，帮助我们更好地为您服务</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：留言表单 */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faComments} className="text-[#b71c1c]" />
                提交留言
              </h2>

              {submitted && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  留言提交成功！感谢您的宝贵意见。
                </div>
              )}

              {error && (
                <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm bg-red-50 border-red-200 text-red-800">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
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
                    onChange={(e) => handleInputChange('contact', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                    placeholder="手机号或邮箱"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    留言内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
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
                    onClick={handleReset}
                    className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={submitting}
                  >
                    重置
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm bg-[#b71c1c] text-white rounded-lg hover:bg-[#8b0000] transition-colors disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={submitting ? faSpinner : faPaperPlane}
                      className={submitting ? 'animate-spin' : ''} />
                    {submitting ? '提交中...' : '提交留言'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 右侧：公开留言展示 */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faComments} className="text-[#b71c1c]" />
                公开留言展示
              </h2>

              {/* 分类筛选 */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => { setCategoryFilter('all'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-[#b71c1c] text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                {['suggestion', 'complaint', 'praise', 'question'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#b71c1c] text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {getCategoryLabel(cat)}
                  </button>
                ))}
              </div>

              {/* 留言列表 */}
              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl mb-2" />
                  <p>加载中...</p>
                </div>
              ) : publicFeedbacks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>暂无公开留言</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {publicFeedbacks.map((feedback) => (
                    <div key={feedback.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      {/* 留言头部 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                          <span className="font-medium text-gray-900">{feedback.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
                          <span>{new Date(feedback.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>

                      {/* 留言内容 */}
                      <div className="text-gray-700 mb-3 whitespace-pre-wrap">{feedback.content}</div>

                      {/* 管理员回复 */}
                      {feedback.reply && (
                        <div className="ml-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                          <div className="flex items-center gap-2 mb-2 text-sm">
                            <FontAwesomeIcon icon={faReply} className="text-blue-600" />
                            <span className="font-medium text-blue-900">管理员回复</span>
                            {feedback.replyAt && (
                              <span className="text-blue-500">
                                {new Date(feedback.replyAt).toLocaleDateString('zh-CN')}
                              </span>
                            )}
                          </div>
                          <div className="text-gray-700 whitespace-pre-wrap text-sm">{feedback.reply}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-100 transition-colors"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-100 transition-colors"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FrontendWrapper>
  );
}
