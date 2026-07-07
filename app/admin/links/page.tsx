'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useCsrfToken, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface FriendlyLink {
  id: string;
  title: string;
  url: string;
  is_required: boolean;
  order_index: number;
}

export default function AdminLinksPage() {
  const router = useRouter();
  const csrfToken = useCsrfToken();
  const [links, setLinks] = useState<FriendlyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Auto-redirect to new footer management page after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/admin/footer');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    is_required: false,
    order_index: 0,
  });

  // Fetch links
  const fetchLinks = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<any>('/api/admin/links');

      if (result.success) {
        setLinks(result.data);
      }
    } catch (error) {
      logger.error('Failed to fetch links:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submit (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const body = { id: editingId || undefined, ...formData };
      if (editingId) {
        await apiClient.put('/api/admin/links', body, { csrfToken });
      } else {
        await apiClient.post('/api/admin/links', body, { csrfToken });
      }

      setModalOpen(false);
      setEditingId(null);
      setFormData({
        title: '',
        url: '',
        is_required: false,
        order_index: 0,
      });
      fetchLinks();
    } catch (error: any) {
      logger.error('Failed to save link:', error);
      alert(editingId ? '更新失败' : '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (link: FriendlyLink) => {
    setEditingId(link.id);
    setFormData({
      title: link.title,
      url: link.url,
      is_required: link.is_required,
      order_index: link.order_index,
    });
    setModalOpen(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData({
      title: '',
      url: '',
      is_required: false,
      order_index: 0,
    });
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/admin/links?id=${id}`, { csrfToken });
      setDeleteConfirm(null);
      fetchLinks();
    } catch (error: any) {
      logger.error('Failed to delete link:', error);
      alert('删除失败');
    }
  };

  // Fetch links on mount
  useEffect(() => {
    fetchLinks();
  }, []);

  return (
    <div className="space-y-6">
      {/* Deprecation Notice */}
      <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
        <div className="flex items-start gap-3">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-800">此页面已废弃</h3>
            <p className="text-sm text-amber-700 mt-1">
              友情链接管理已整合到{' '}
              <a href="/admin/footer" className="text-[#b71c1c] underline font-medium hover:text-[#8b0000]">
                页脚管理
              </a>{' '}
              页面。
            </p>
            <p className="text-xs text-amber-600 mt-2">
              将在 5 秒后自动跳转到新页面...
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">友情链接管理（旧版）</h2>
          <p className="text-sm text-gray-600 mt-1">
            管理网站友情链接（请使用新的页脚管理页面）
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          添加链接
        </button>
      </div>

      {/* Links List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : links.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            暂无友情链接
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    链接
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    必填
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    排序
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {link.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {link.url}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {link.is_required ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          <svg
                            className="h-3 w-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          必填
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">可选</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {link.order_index}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(link)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        编辑
                      </button>
                      {link.is_required ? (
                        <span className="text-gray-400 cursor-not-allowed">
                          不可删除
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(link.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Link Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              onClick={handleCancel}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingId ? '编辑友情链接' : '添加友情链接'}
                  </h3>

                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        标题 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="请输入链接标题"
                      />
                    </div>

                    {/* URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        链接地址 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        required
                        value={formData.url}
                        onChange={(e) =>
                          setFormData({ ...formData, url: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com"
                      />
                    </div>

                    {/* Order Index */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        排序（可选）
                      </label>
                      <input
                        type="number"
                        value={formData.order_index}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            order_index: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="数字越小越靠前"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        留空将自动添加到末尾
                      </p>
                    </div>

                    {/* Required */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_required"
                        checked={formData.is_required}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_required: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="is_required"
                        className="ml-2 text-sm font-medium text-gray-700"
                      >
                        设为必填链接（不可删除）
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting ? (editingId ? '更新中...' : '添加中...') : (editingId ? '更新' : '添加')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              onClick={() => setDeleteConfirm(null)}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium text-gray-900">
                      确认删除
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        此操作将永久删除该友情链接，无法恢复。确定要继续吗？
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  删除
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
