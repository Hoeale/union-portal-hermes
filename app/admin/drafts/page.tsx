'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileArchive, faNewspaper, faFileAlt, faEdit, faTrash,
  faSpinner, faInfoCircle, faExternalLinkAlt, faPaperPlane,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import RichTextEditor from '@/components/admin/rich-text-editor';
import { useCsrfToken, useMessage, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface Draft {
  id: string;
  type: 'news' | 'policy';
  title: string;
  category: string;
  content: string;
  imageUrl: string | null;
  fileUrl: string | null;
  source: string | null;
  publishDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  title: string;
  category: string;
  content: string;
  imageUrl: string;
  fileUrl: string;
  source: string;
  publishDate: string;
}

export default function AdminDraftsPage() {
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'news' | 'policy'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [publishConfirmId, setPublishConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    category: '',
    content: '',
    imageUrl: '',
    fileUrl: '',
    source: '',
    publishDate: '',
  });

  useEffect(() => {
    fetchDrafts();
  }, [typeFilter, page]);

  const fetchDrafts = async () => {
    try {
      const params = new URLSearchParams({
        type: typeFilter,
        page: page.toString(),
        pageSize: '10',
      });
      const data = await apiClient.get<any>(`/api/admin/drafts?${params}`);
      setDrafts(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      logger.error('Failed to fetch drafts:', error);
    } finally {
      setLoading(false);
    }
  };


  const openEditModal = (draft: Draft) => {
    setEditingDraft(draft);
    setFormData({
      title: draft.title,
      category: draft.category,
      content: draft.content,
      imageUrl: draft.imageUrl || '',
      fileUrl: draft.fileUrl || '',
      source: draft.source || '',
      publishDate: draft.publishDate || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingDraft) return;
    if (!formData.title || !formData.content) {
      showMessage('error', '标题和内容为必填项');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put('/api/admin/drafts', {
        id: editingDraft.id,
        ...formData,
        imageUrl: formData.imageUrl || null,
        fileUrl: formData.fileUrl || null,
        source: formData.source || null,
        publishDate: formData.publishDate || null,
      }, { csrfToken });
      fetchDrafts();
      setEditingDraft(null);
      showMessage('success', '草稿已更新');
    } catch (error) {
      logger.error('Failed to save draft:', error);
      showMessage('error', '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiClient.delete(`/api/admin/drafts?id=${deleteConfirmId}`, { csrfToken });
      fetchDrafts();
      showMessage('success', '已删除');
    } catch (error) {
      logger.error('Failed to delete:', error);
      showMessage('error', '删除失败');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handlePublish = async () => {
    if (!publishConfirmId) return;
    setSaving(true);
    try {
      const data = await apiClient.post<any>('/api/admin/drafts/publish', { id: publishConfirmId }, { csrfToken });
      fetchDrafts();
      showMessage('success', data.message || '发布成功');
    } catch (error: any) {
      logger.error('Failed to publish:', error);
      showMessage('error', error.message || '发布失败');
    } finally {
      setPublishConfirmId(null);
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'x-csrf-token': csrfToken,
      },
      credentials: 'include',
      body: formData,
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || '上传失败');
    }

    return result.url;
  };

  const handlePreview = (id: string) => {
    window.open(`/preview/draft/${id}`, '_blank');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#a51b1b] flex items-center gap-3">
          <FontAwesomeIcon icon={faFileArchive} />
          草稿箱
        </h1>
        <p className="text-gray-600 mt-1">管理待发布的新闻和政策草稿</p>
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
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex gap-2">
            {[
              { id: 'all', label: '全部' },
              { id: 'news', label: '新闻' },
              { id: 'policy', label: '政策' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setTypeFilter(tab.id as any); setPage(1); }}
                className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                  typeFilter === tab.id
                    ? 'bg-[#b71c1c] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-500">共 {total} 个草稿</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {drafts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FontAwesomeIcon icon={faFileArchive} className="text-4xl text-gray-300 mb-3" />
              <p>暂无草稿</p>
              <p className="text-sm mt-1">在新闻管理或政策文件页面编辑后可存为草稿</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">类型</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">标题</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">分类</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">更新时间</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((draft) => (
                  <tr key={draft.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full ${
                        draft.type === 'news'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        <FontAwesomeIcon icon={draft.type === 'news' ? faNewspaper : faFileAlt} className="text-xs" />
                        {draft.type === 'news' ? '新闻' : '政策'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{draft.title}</td>
                    <td className="px-4 py-3 text-gray-600">{draft.category}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(draft.updatedAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(draft)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="编辑"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-sm" />
                        </button>
                        <button
                          onClick={() => handlePreview(draft.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="预览"
                        >
                          <FontAwesomeIcon icon={faExternalLinkAlt} className="text-sm" />
                        </button>
                        <button
                          onClick={() => setPublishConfirmId(draft.id)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          title="发布"
                        >
                          <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(draft.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="删除"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingDraft && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setEditingDraft(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">编辑草稿</h3>
                <button onClick={() => setEditingDraft(null)} className="text-gray-400 hover:text-gray-600">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  />
                </div>
                {editingDraft.type === 'policy' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">来源</label>
                        <input
                          type="text"
                          value={formData.source}
                          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">发布日期</label>
                        <input
                          type="date"
                          value={formData.publishDate}
                          onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">文件链接</label>
                      <input
                        type="text"
                        value={formData.fileUrl}
                        onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>
                  </>
                )}
                {editingDraft.type === 'news' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">封面图片链接</label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">内容 <span className="text-red-500">*</span></label>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    onImageUpload={handleImageUpload}
                    showPreview={true}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => setEditingDraft(null)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-[#b71c1c] text-white rounded-lg hover:bg-[#8b0000] disabled:opacity-50 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={saving ? faSpinner : faEdit} className={saving ? 'animate-spin' : ''} />
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">确认删除</h3>
              <p className="text-sm text-gray-600 mb-6">删除后无法恢复，确定要删除这个草稿吗？</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">取消</button>
                <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">确认删除</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {publishConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setPublishConfirmId(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">确认发布</h3>
              <p className="text-sm text-gray-600 mb-6">发布后草稿将移入对应的管理列表，确定要发布吗？</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setPublishConfirmId(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">取消</button>
                <button onClick={handlePublish} disabled={saving} className="px-4 py-2 text-sm bg-[#b71c1c] text-white rounded-lg hover:bg-[#8b0000] disabled:opacity-50 flex items-center gap-2">
                  <FontAwesomeIcon icon={saving ? faSpinner : faPaperPlane} className={saving ? 'animate-spin' : ''} />
                  确认发布
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
