'use client';

import { useState, useEffect } from 'react';
import { useCsrfToken, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminNewsCategoriesPage() {
  const csrfToken = useCsrfToken();
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<NewsCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#b71c1c',
    orderIndex: 0,
  });

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<any>('/api/admin/news-categories');

      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      logger.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      const body = {
        ...formData,
        ...(editingCategory && { id: editingCategory.id }),
      };
      if (editingCategory) {
        await apiClient.put('/api/admin/news-categories', body, { csrfToken });
      } else {
        await apiClient.post('/api/admin/news-categories', body, { csrfToken });
      }

      setModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      logger.error('Failed to save category:', error);
      setErrorMessage(error.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    setErrorMessage('');
    try {
      await apiClient.delete(`/api/admin/news-categories?id=${id}`, { csrfToken });
      setDeleteConfirm(null);
      fetchCategories();
    } catch (error: any) {
      logger.error('Failed to delete category:', error);
      setErrorMessage(error.message || '删除失败');
    }
  };

  // Open modal for adding
  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#b71c1c',
      orderIndex: 0,
    });
    setErrorMessage('');
    setModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (category: NewsCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color || '#b71c1c',
      orderIndex: category.order_index,
    });
    setErrorMessage('');
    setModalOpen(true);
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || name.toLowerCase().replace(/[\s\u4e00-\u9fa5]/g, '').replace(/[^a-z0-9_-]/g, ''),
    }));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">新闻分类管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            管理新闻内容的分类标签，支持自定义新增、编辑和删除
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center justify-center px-6 py-3 bg-[#b71c1c] text-white text-sm font-semibold rounded-lg hover:bg-[#8b0000] transition-colors shadow-sm"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增分类
        </button>
      </div>

      {/* Category List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#b71c1c]"></div>
            <p className="mt-3">加载中...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className="mt-3 text-lg font-medium">暂无分类数据</p>
            <p className="text-sm mt-1">点击上方按钮添加第一个分类</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">分类名称</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">标识</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">描述</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">排序</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: category.color || '#b71c1c' }}
                        />
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{category.slug}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 max-w-xs truncate block">
                        {category.description || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{category.order_index}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          category.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {category.is_active ? '启用' : '停用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-900 mr-4 font-medium"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(category.id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-900/50 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-6 pt-6 pb-4 sm:p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    {editingCategory ? '编辑分类' : '新增分类'}
                  </h3>

                  {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {errorMessage}
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        分类名称 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent transition-all"
                        placeholder="例如：动态、通知、公告"
                      />
                    </div>

                    {/* Slug */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        分类标识 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent transition-all font-mono"
                        placeholder="例如：news、notice"
                      />
                      <p className="mt-1 text-xs text-gray-500">英文标识，用于系统内部识别，只能包含小写字母、数字和下划线</p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        描述
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent transition-all"
                        placeholder="分类描述（可选）"
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        颜色
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-12 h-12 rounded-lg cursor-pointer border border-gray-300"
                        />
                        <input
                          type="text"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent transition-all font-mono"
                          placeholder="#b71c1c"
                        />
                      </div>
                    </div>

                    {/* Order */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        排序
                      </label>
                      <input
                        type="number"
                        value={formData.orderIndex}
                        onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent transition-all"
                        min="0"
                      />
                      <p className="mt-1 text-xs text-gray-500">数字越小越靠前</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-transparent shadow-sm px-8 py-3 bg-[#b71c1c] text-base font-semibold text-white hover:bg-[#8b0000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b71c1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? '保存中...' : editingCategory ? '更新' : '创建'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-8 py-3 bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
              className="fixed inset-0 transition-opacity bg-gray-900/50 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-6 pt-6 pb-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-bold text-gray-900">确认删除</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        此操作将永久删除该分类。如果该分类下还有新闻，将无法删除。确定要继续吗？
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-2.5 bg-red-600 text-base font-semibold text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  删除
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-6 py-2.5 bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
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
