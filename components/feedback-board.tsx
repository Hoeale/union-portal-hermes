'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComments, faTimes, faSpinner, faChevronLeft, faChevronRight,
  faUser, faReply, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

interface PublicFeedback {
  id: string;
  name: string;
  content: string;
  reply?: string | null;
  replyBy?: string | null;
  replyAt?: string | null;
  createdAt: string;
  comments: PublicComment[];
}

interface PublicComment {
  id: string;
  name: string;
  content: string;
  isReply: boolean;
  createdAt: string;
}

interface FeedbackBoardProps {
  onClose: () => void;
}

export default function FeedbackBoard({ onClose }: FeedbackBoardProps) {
  const [feedbacks, setFeedbacks] = useState<PublicFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/public/feedbacks?page=${page}&pageSize=${pageSize}`);
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch public feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [page]);

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#b71c1c] flex items-center justify-center">
                <FontAwesomeIcon icon={faComments} className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">留言板</h3>
                <p className="text-xs text-gray-500">共 {total} 条公开留言</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-gray-400 mb-3" />
                <p className="text-gray-500">加载中...</p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FontAwesomeIcon icon={faComments} className="text-5xl mb-4" />
                <p className="text-lg">暂无公开留言</p>
                <p className="text-sm mt-1">管理员审核后会展示优质留言</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {feedbacks.map((fb) => {
                  return (
                    <div key={fb.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                      {/* 留言头部 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon={faUser} className="text-white text-sm" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">{fb.name}</span>
                            </div>
                            <p className="text-xs text-gray-500">{formatDate(fb.createdAt)}</p>
                          </div>
                        </div>
                      </div>

                      {/* 留言内容 */}
                      <div className="ml-11 mb-4">
                        <div className="bg-gray-50 rounded-lg p-4 text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                          {fb.content}
                        </div>
                      </div>

                      {/* 管理员回复 */}
                      {fb.reply && (
                        <div className="ml-11 mb-3">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                              <span className="text-xs font-semibold text-green-700">管理员回复</span>
                              {fb.replyBy && (
                                <span className="text-xs text-gray-500">• {fb.replyBy}</span>
                              )}
                              {fb.replyAt && (
                                <span className="text-xs text-gray-400">{formatDate(fb.replyAt)}</span>
                              )}
                            </div>
                            <div
                              className="text-sm text-gray-800 whitespace-pre-wrap break-words"
                              dangerouslySetInnerHTML={{ __html: fb.reply }}
                            />
                          </div>
                        </div>
                      )}

                      {/* 评论列表 */}
                      {fb.comments.length > 0 && (
                        <div className="ml-11 space-y-2">
                          {fb.comments.map((comment) => (
                            <div
                              key={comment.id}
                              className={`rounded-lg p-3 ${
                                comment.isReply
                                  ? 'bg-blue-50 border border-blue-100'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <FontAwesomeIcon
                                  icon={comment.isReply ? faReply : faUser}
                                  className={`text-xs ${
                                    comment.isReply ? 'text-blue-600' : 'text-gray-500'
                                  }`}
                                />
                                <span className="text-xs font-medium text-gray-700">{comment.name}</span>
                                <span className="text-xs text-gray-400">• {formatDate(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                {comment.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && feedbacks.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  共 {total} 条，第 {page} / {totalPages} 页
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
