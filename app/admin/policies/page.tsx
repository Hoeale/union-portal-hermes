'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faSave, faSpinner,
  faTimes, faToggleOn, faToggleOff, faInfoCircle, faFilter,
  faDownload, faCheck, faXmark
} from '@fortawesome/free-solid-svg-icons';
import RichTextEditor from '@/components/admin/rich-text-editor';
import BatchActionsBar from '@/components/admin/batch-actions-bar';
import SchedulePicker from '@/components/admin/schedule-picker';
import VersionHistory from '@/components/admin/version-history';
import ReviewPanel from '@/components/admin/review-panel';
import FileUpload from '@/components/admin/file-upload';
import MultiFileUpload, { Attachment } from '@/components/admin/multi-file-upload';
import { useCsrfToken, useMessage, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface Policy {
  id: string;
  title: string;
  category: string;
  publishDate: string;
  source: string;
  fileUrl: string | null;
  fileName: string | null;
  fileUrls: string | null;  // JSON array
  fileNames: string | null;  // JSON array
  enableDownload: boolean;
  content: string;
  isActive: boolean;
  status: 'pending' | 'published';
  orderIndex: number;
}

interface FormData {
  title: string;
  category: string;
  publishDate: string;
  source: string;
  fileUrl: string;
  fileName: string;
  fileUrls: string;  // JSON array string
  fileNames: string;  // JSON array string
  attachments: Attachment[];
  enableDownload: boolean;
  content: string;
  isActive: boolean;
  orderIndex: number;
}

// 全局开关组件
function GlobalToggleSwitch({
  label,
  description,
  enabled,
  onToggle,
  csrfToken,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  csrfToken: string;
}) {
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    setSaving(true);
    try {
      await apiClient.put('/api/site-config', { key: label, value: String(!enabled) }, { csrfToken });
      onToggle(!enabled);
    } catch (error) {
      // Error handled silently
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div>
        <h4 className="font-medium text-gray-900">{description}</h4>
        <p className="text-sm text-gray-500 mt-1">
          当前状态: <span className={enabled ? 'text-green-600 font-medium' : 'text-gray-500'}>
            {enabled ? '已开启' : '已关闭'}
          </span>
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-green-500' : 'bg-gray-300'
        } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function AdminPoliciesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
      <AdminPoliciesPageContent />
    </Suspense>
  );
}

function AdminPoliciesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusConfirmPolicyId, setStatusConfirmPolicyId] = useState<string | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<'pending' | 'published' | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<{ id: string; type: 'active' | 'download'; value: boolean } | null>(null);
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();
  const [CATEGORIES, setCATEGORIES] = useState<string[]>([
    '权益保障',
    '劳动法规',
    '社会保障',
    '安全生产',
    '福利待遇',
    '奖励待遇',
    '其他',
  ]);

  // 全局开关状态
  const [downloadEnabled, setDownloadEnabled] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    category: '权益保障',
    publishDate: new Date().toISOString().split('T')[0],
    source: '',
    fileUrl: '',
    fileName: '',
    fileUrls: '[]',
    fileNames: '[]',
    attachments: [],
    enableDownload: false,
    content: '',
    isActive: true,
    orderIndex: 0,
  });

  useEffect(() => {
    fetchPolicies();
    fetchGlobalConfig();
    fetchCategories();
  }, [statusFilter, filterCategory, currentPage]);

  // 处理 URL 参数：如果 action=create，自动打开新建弹窗
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create' && !loading) {
      handleCreate();
      // 清除 URL 参数
      router.replace('/admin/policies', { scroll: false });
    }
  }, [searchParams, loading]);

  const fetchGlobalConfig = async () => {
    try {
      const response = await fetch('/api/site-config', {
        credentials: 'include', // 发送 session cookie
      });
      if (response.ok) {
        const config = await response.json();
        setDownloadEnabled(config.policy_download_enabled === 'true');
      }
    } catch (error) {
      // Error handled silently
    }
  };

  // 获取政策分类
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/policy-categories', {
        credentials: 'include', // 发送 session cookie
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCATEGORIES(result.data.map((cat: any) => cat.name));
        }
      }
    } catch (error) {
      logger.error('Failed to fetch policy categories:', error);
    }
  };

  const fetchPolicies = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      if (filterCategory) {
        params.append('category', filterCategory);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (statusFilter === 'pending') {
        params.append('status', 'pending');
      }

      const response = await fetch(`/api/admin/policies?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setPolicies(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      showMessage('error', '加载政策列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPolicies();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'policy');

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'x-csrf-token': csrfToken,
      },
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('上传失败');
    }

    const data = await response.json();
    return data.url;
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      title: '',
      category: filterCategory || '权益保障',
      publishDate: new Date().toISOString().split('T')[0],
      source: '',
      fileUrl: '',
      fileName: '',
      fileUrls: '[]',
      fileNames: '[]',
      attachments: [],
      enableDownload: false,
      content: '',
      isActive: true,
      orderIndex: policies.length,
    });
  };

  const handleEdit = (policy: Policy) => {
    setEditingId(policy.id);
    // 解析多附件数据
    let attachments: Attachment[] = [];
    try {
      if (policy.fileUrls) {
        const urls = JSON.parse(policy.fileUrls);
        const names = policy.fileNames ? JSON.parse(policy.fileNames) : [];
        attachments = urls.map((url: string, i: number) => ({
          url,
          fileName: names[i] || url.split('/').pop() || '附件',
        }));
      } else if (policy.fileUrl) {
        // 兼容旧数据
        attachments = [{ url: policy.fileUrl, fileName: policy.fileName || '附件' }];
      }
    } catch {
      attachments = [];
    }

    setFormData({
      title: policy.title,
      category: policy.category,
      publishDate: policy.publishDate,
      source: policy.source,
      fileUrl: policy.fileUrl || '',
      fileName: policy.fileName || '',
      fileUrls: policy.fileUrls || '[]',
      fileNames: policy.fileNames || '[]',
      attachments,
      enableDownload: policy.enableDownload,
      content: policy.content,
      isActive: policy.isActive,
      orderIndex: policy.orderIndex,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.content) {
      showMessage('error', '标题、分类和内容不能为空');
      return;
    }

    setSaving(true);
    try {
      // 处理多附件数据
      const urls = formData.attachments.map(a => a.url);
      const names = formData.attachments.map(a => a.fileName);
      
      const data: any = {
        ...formData,
        fileUrls: JSON.stringify(urls),
        fileNames: JSON.stringify(names),
        // 保持向后兼容：如果有多个附件，fileUrl 存储第一个
        fileUrl: urls.length > 0 ? urls[0] : '',
        fileName: names.length > 0 ? names[0] : '',
      };
      
      if (!isCreating) data.id = editingId;

      if (isCreating) {
        await apiClient.post('/api/admin/policies', data, { csrfToken });
      } else {
        await apiClient.put('/api/admin/policies', data, { csrfToken });
      }

      showMessage('success', isCreating ? '创建成功' : '更新成功');
      handleCancel();
      fetchPolicies();
    } catch (error) {
      showMessage('error', '操作失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      await apiClient.delete(`/api/admin/policies?id=${deleteConfirmId}`, { csrfToken });
      showMessage('success', '删除成功');
      fetchPolicies();
    } catch (error) {
      showMessage('error', '删除失败，请重试');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const toggleStatus = async (id: string, status: 'pending' | 'published') => {
    try {
      // 发布时同时设置 isActive: true，确保前端可以显示
      await apiClient.put('/api/admin/policies', { 
        id, 
        status,
        ...(status === 'published' && { isActive: true })
      }, { csrfToken });
      showMessage('success', status === 'published' ? '已发布' : '已设为待发布');
      fetchPolicies();
    } catch (error) {
      showMessage('error', '操作失败');
    }
  };

  const toggleDownload = async (id: string, enableDownload: boolean) => {
    setToggleConfirm({ id, type: 'download', value: enableDownload });
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    setToggleConfirm({ id, type: 'active', value: isActive });
  };

  const confirmToggle = async () => {
    if (!toggleConfirm) return;
    
    try {
      if (toggleConfirm.type === 'download') {
        await apiClient.put('/api/admin/policies', { id: toggleConfirm.id, enableDownload: toggleConfirm.value }, { csrfToken });
      } else {
        await apiClient.put('/api/admin/policies', { id: toggleConfirm.id, isActive: toggleConfirm.value }, { csrfToken });
      }
      fetchPolicies();
    } catch (error) {
      showMessage('error', '操作失败');
    } finally {
      setToggleConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">政策文件管理</h1>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:bg-[hsl(var(--primary-dark))] transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} />
          新增政策
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 筛选和搜索 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* 状态标签页 */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'all' as const, label: '全部' },
              { id: 'pending' as const, label: '待发布' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === tab.id
                    ? 'border-[#b71c1c] text-[#b71c1c]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 分类筛选 */}
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          >
            <option value="">全部分类</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索政策标题..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                搜索
              </button>
            </div>
          </form>

          <span className="text-sm text-gray-500">共 {total} 条</span>
        </div>
      </div>

      {/* 政策列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : policies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无政策数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">显示</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">下载</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {policies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 truncate max-w-[300px]">{policy.title}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{policy.category}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          const targetStatus = policy.status === 'pending' ? 'published' : 'pending';
                          setStatusConfirmPolicyId(policy.id);
                          setStatusConfirmTarget(targetStatus);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          policy.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        <FontAwesomeIcon icon={policy.status === 'published' ? faCheck : faXmark} />
                        {policy.status === 'published' ? '已发布' : '待发布'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(policy.id, !policy.isActive)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FontAwesomeIcon icon={policy.isActive ? faToggleOn : faToggleOff} className="text-xl" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleDownload(policy.id, !policy.enableDownload)}
                        className="text-gray-400 hover:text-gray-600"
                        title={policy.enableDownload ? '禁用附件下载' : '启用附件下载'}
                      >
                        <FontAwesomeIcon icon={policy.enableDownload ? faDownload : faXmark} className="text-lg" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(policy)}
                          className="text-blue-600 hover:text-blue-800"
                          title="编辑"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDelete(policy.id)}
                          className="text-red-600 hover:text-red-800"
                          title="删除"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-500">
              第 {currentPage} / {totalPages} 页
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 编辑/创建弹窗 */}
      {(isCreating || editingId) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={handleCancel} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">
                  {isCreating ? '新增政策' : '编辑政策'}
                </h3>
                <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="space-y-4">
                  {/* 标题 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                      required
                    />
                  </div>

                  {/* 分类和发布日期 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">发布日期</label>
                      <input
                        type="date"
                        value={formData.publishDate}
                        onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                      />
                    </div>
                  </div>

                  {/* 来源 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">来源</label>
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                      placeholder="如：全国总工会"
                    />
                  </div>

                  {/* 文件上传 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">附件文件（支持多个）</label>
                    <MultiFileUpload
                      uploadType="policy"
                      attachments={formData.attachments}
                      onChange={(attachments) => setFormData({ 
                        ...formData, 
                        attachments,
                        fileUrl: attachments.length > 0 ? attachments[0].url : '',
                        fileName: attachments.length > 0 ? attachments[0].fileName : '',
                      })}
                    />
                  </div>

                  {/* Schedule Publishing */}
                  <SchedulePicker
                    scheduledDate={scheduleDate}
                    scheduledTime={scheduleTime}
                    onChange={(date, time) => {
                      setScheduleDate(date);
                      setScheduleTime(time);
                    }}
                    onClear={() => {
                      setScheduleDate('');
                      setScheduleTime('09:00');
                    }}
                  />

                  {/* 内容 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">内容 *</label>
                    <RichTextEditor
                      content={formData.content}
                      onChange={(content) => setFormData({ ...formData, content })}
                      onImageUpload={handleImageUpload}
                      showPreview={true}
                    />
                  </div>
                </div>

                {/* 提交按钮 */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:bg-[hsl(var(--primary-dark))] disabled:opacity-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={saving ? faSpinner : faSave} className={saving ? 'animate-spin' : ''} />
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 状态切换确认弹窗 */}
      {statusConfirmPolicyId && statusConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
            setStatusConfirmPolicyId(null);
            setStatusConfirmTarget(null);
          }} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                statusConfirmTarget === 'published' ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                <FontAwesomeIcon 
                  icon={statusConfirmTarget === 'published' ? faCheck : faXmark} 
                  className={`text-xl ${statusConfirmTarget === 'published' ? 'text-green-600' : 'text-yellow-600'}`}
                />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                确认{statusConfirmTarget === 'published' ? '发布' : '取消发布'}此政策？
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {statusConfirmTarget === 'published' 
                ? '发布后，该政策将立即在前台政策文件页面展示，请确认内容无误。'
                : '取消发布后，该政策将从前台隐藏，仅保留在待发布列表中。'
              }
            </p>
            <p className="text-sm text-gray-600 mb-6">您可以随时再次切换状态。</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => {
                  setStatusConfirmPolicyId(null);
                  setStatusConfirmTarget(null);
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (statusConfirmPolicyId && statusConfirmTarget) {
                    toggleStatus(statusConfirmPolicyId, statusConfirmTarget);
                  }
                  setStatusConfirmPolicyId(null);
                  setStatusConfirmTarget(null);
                }}
                className={`px-4 py-2 text-sm text-white rounded-lg flex items-center gap-2 ${
                  statusConfirmTarget === 'published'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                <FontAwesomeIcon icon={statusConfirmTarget === 'published' ? faCheck : faXmark} />
                确认{statusConfirmTarget === 'published' ? '发布' : '取消发布'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100">
                <FontAwesomeIcon icon={faTrash} className="text-xl text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">确认删除此政策？</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">删除后，该政策将从前后台完全移除。</p>
            <p className="text-sm text-red-600 font-medium mb-6">⚠ 此操作不可恢复！</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm text-white rounded-lg bg-red-600 hover:bg-red-700 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faTrash} />
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 开关切换确认弹窗 */}
      {toggleConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setToggleConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
                <FontAwesomeIcon icon={faInfoCircle} className="text-xl text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                确认{toggleConfirm.type === 'active' ? '切换显示状态' : '切换下载状态'}？
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {toggleConfirm.type === 'active' 
                ? (toggleConfirm.value ? '启用后，该政策将在前台列表中显示。' : '禁用后，该政策将从前台列表中隐藏。')
                : (toggleConfirm.value ? '启用后，访客可以下载该政策的附件。' : '禁用后，访客将无法下载该政策的附件。')
              }
            </p>
            <p className="text-sm text-gray-600 mb-6">您可以随时再次切换状态。</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setToggleConfirm(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmToggle}
                className="px-4 py-2 text-sm text-white rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faCheck} />
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
