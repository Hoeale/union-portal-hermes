'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faSave, faSpinner,
  faTimes, faToggleOn, faToggleOff, faInfoCircle,
  faArrowUp, faArrowDown, faUpload, faUser, faLink
} from '@fortawesome/free-solid-svg-icons';
import RichTextEditor from '@/components/admin/rich-text-editor';
import { useCsrfToken, useMessage, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface Worker {
  id: string;
  name: string;
  title: string;
  department: string;
  story: string;
  imageUrl: string | null;
  imageSourceType?: 'local' | 'external';
  isActive: boolean;
  orderIndex: number;
}

interface FormData {
  name: string;
  title: string;
  department: string;
  story: string;
  imageUrl: string;
  imageSourceType: 'local' | 'external';
  isActive: boolean;
  orderIndex: number;
}

export default function AdminWorkersPage() {
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    title: '',
    department: '',
    story: '',
    imageUrl: '',
    imageSourceType: 'local',
    isActive: true,
    orderIndex: 0,
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const result = await apiClient.get<any>(`/api/admin/workers?${params}`);
      setWorkers(result.data || []);
    } catch (error) {
      logger.error('Error fetching workers:', error);
      showMessage('error', '加载劳动者列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWorkers();
  };


  // 通用上传函数，不修改 formData（供富文本编辑器使用）
  const uploadImageFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      showMessage('error', '只能上传图片文件');
      throw new Error('只能上传图片文件');
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', '图片大小不能超过5MB');
      throw new Error('图片大小不能超过5MB');
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: uploadFormData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      return data.url;
    } catch (error) {
      logger.error('Error uploading image:', error);
      showMessage('error', '图片上传失败');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // 头像上传：上传后同时更新 formData.imageUrl
  const handleAvatarUpload = async (file: File) => {
    try {
      const url = await uploadImageFile(file);
      setFormData(prev => ({ ...prev, imageUrl: url }));
      showMessage('success', '头像上传成功');
    } catch (error) {
      // uploadImageFile 内部已经处理了错误提示
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      title: '',
      department: '',
      story: '',
      imageUrl: '',
      imageSourceType: 'local',
      isActive: true,
      orderIndex: workers.length,
    });
    setEditingId('new');
  };

  const handleEdit = (worker: Worker) => {
    setEditingId(worker.id);
    setFormData({
      name: worker.name,
      title: worker.title,
      department: worker.department,
      story: worker.story,
      imageUrl: worker.imageUrl || '',
      imageSourceType: worker.imageSourceType || 'local',
      isActive: worker.isActive,
      orderIndex: worker.orderIndex,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({
      name: '',
      title: '',
      department: '',
      story: '',
      imageUrl: '',
      imageSourceType: 'local',
      isActive: true,
      orderIndex: 0,
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.title.trim() || !formData.department.trim()) {
      showMessage('error', '姓名、荣誉称号和工作单位不能为空');
      return;
    }

    setSaving(true);
    try {
      const body = isCreating ? formData : { ...formData, id: editingId };
      if (isCreating) {
        await apiClient.post('/api/admin/workers', body, { csrfToken });
      } else {
        await apiClient.put('/api/admin/workers', body, { csrfToken });
      }

      showMessage('success', isCreating ? '创建成功' : '更新成功');
      handleCancel();
      fetchWorkers();
    } catch (error) {
      logger.error('Error saving worker:', error);
      showMessage('error', '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这位劳动者吗？')) return;

    try {
      await apiClient.delete(`/api/admin/workers?id=${id}`, { csrfToken });
      showMessage('success', '删除成功');
      fetchWorkers();
    } catch (error) {
      logger.error('Error deleting worker:', error);
      showMessage('error', '删除失败');
    }
  };

  const handleToggleActive = async (worker: Worker) => {
    try {
      await apiClient.put('/api/admin/workers', { id: worker.id, isActive: !worker.isActive }, { csrfToken });
      fetchWorkers();
    } catch (error) {
      logger.error('Error toggling worker:', error);
      showMessage('error', '更新失败');
    }
  };

  const moveWorker = async (index: number, direction: 'up' | 'down') => {
    const newWorkers = [...workers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newWorkers.length) return;

    const temp = newWorkers[index].orderIndex;
    newWorkers[index].orderIndex = newWorkers[targetIndex].orderIndex;
    newWorkers[targetIndex].orderIndex = temp;

    newWorkers.sort((a, b) => a.orderIndex - b.orderIndex);
    setWorkers(newWorkers);

    try {
      await apiClient.put('/api/admin/workers', { id: newWorkers[index].id, orderIndex: newWorkers[index].orderIndex }, { csrfToken });
      await apiClient.put('/api/admin/workers', { id: newWorkers[targetIndex].id, orderIndex: newWorkers[targetIndex].orderIndex }, { csrfToken });
    } catch (error) {
      logger.error('Error reordering:', error);
      fetchWorkers();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e2b3c]">最美劳动者管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理先进劳动者事迹
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#b71c1c] text-white rounded-lg hover:bg-[#9a1616] transition-colors shadow-sm"
        >
          <FontAwesomeIcon icon={faPlus} />
          添加劳动者
        </button>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <FontAwesomeIcon icon={faInfoCircle} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索姓名、荣誉称号或工作单位..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent text-sm"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-[#b71c1c] text-white text-sm font-semibold rounded-lg hover:bg-[#8b0000] transition-colors"
          >
            搜索
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                fetchWorkers();
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              清除
            </button>
          )}
        </form>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1e2b3c]">
              {isCreating ? '添加新劳动者' : '编辑劳动者'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  placeholder="输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  荣誉称号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  placeholder="例如：全国劳动模范"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                工作单位 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                placeholder="输入工作单位"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                照片
              </label>
              {/* Source Type Selection */}
              <div className="flex gap-6 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="image_source_type"
                    value="local"
                    checked={formData.imageSourceType === 'local'}
                    onChange={() => setFormData({ ...formData, imageSourceType: 'local', imageUrl: '' })}
                    className="w-4 h-4 text-[#b71c1c] focus:ring-[#b71c1c]"
                  />
                  <span className="text-sm text-gray-700">本地上传</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="image_source_type"
                    value="external"
                    checked={formData.imageSourceType === 'external'}
                    onChange={() => setFormData({ ...formData, imageSourceType: 'external', imageUrl: '' })}
                    className="w-4 h-4 text-[#b71c1c] focus:ring-[#b71c1c]"
                  />
                  <span className="text-sm text-gray-700">外部链接</span>
                </label>
              </div>
              <div className="flex items-start gap-4">
                {formData.imageUrl && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                    <img
                      src={formData.imageUrl}
                      alt={formData.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 text-xs bg-black/50 text-white rounded">
                      {formData.imageSourceType === 'local' ? '本地' : '外链'}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  {/* Local Upload */}
                  {formData.imageSourceType === 'local' && (
                    <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#b71c1c] transition-colors cursor-pointer">
                      <div className="text-center">
                        <FontAwesomeIcon icon={faUpload} className="text-2xl text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          {uploading ? '上传中...' : '点击上传或拖拽文件'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">支持 JPG, PNG, GIF（最大5MB）</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAvatarUpload(file);
                        }}
                        disabled={uploading}
                      />
                    </label>
                  )}
                  {/* External Link Input */}
                  {formData.imageSourceType === 'external' && (
                    <div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faLink} className="text-gray-400" />
                        <input
                          type="url"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                          placeholder="https://example.com/images/xxx.jpg"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">支持任意可访问的图片URL，如OSS、图床、新闻网站图片链接等</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#b71c1c] rounded focus:ring-[#b71c1c]"
                />
                <span className="text-sm font-medium text-gray-700">在前台显示</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                先进事迹 <span className="text-red-500">*</span>
              </label>
              <RichTextEditor
                content={formData.story}
                onChange={(content) => setFormData({ ...formData, story: content })}
                onImageUpload={uploadImageFile}
                showPreview={true}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#b71c1c] text-white rounded-lg hover:bg-[#9a1616] transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} />
                    保存
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-[#1e2b3c]">劳动者列表</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {workers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              暂无劳动者，点击上方添加劳动者按钮创建
            </div>
          ) : (
            workers.map((worker, index) => (
              <div
                key={worker.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100">
                    {worker.imageUrl ? (
                      <img
                        src={worker.imageUrl}
                        alt={worker.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="text-3xl text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-[#1e2b3c]">
                        {worker.name}
                      </h3>
                      {!worker.isActive && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          已隐藏
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#b71c1c] mt-1">{worker.title}</p>
                    <p className="text-sm text-gray-500">{worker.department}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveWorker(index, 'up')}
                      disabled={index === 0}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                      title="上移"
                    >
                      <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                    <button
                      onClick={() => moveWorker(index, 'down')}
                      disabled={index === workers.length - 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                      title="下移"
                    >
                      <FontAwesomeIcon icon={faArrowDown} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(worker)}
                      className={`p-2 transition-colors ${
                        worker.isActive
                          ? 'text-green-600 hover:text-green-700'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={worker.isActive ? '隐藏' : '显示'}
                    >
                      <FontAwesomeIcon icon={worker.isActive ? faToggleOn : faToggleOff} />
                    </button>
                    <button
                      onClick={() => handleEdit(worker)}
                      className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                      title="编辑"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => handleDelete(worker.id)}
                      className="p-2 text-red-600 hover:text-red-700 transition-colors"
                      title="删除"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Help Card */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
          管理提示
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>上传劳动者照片可以增强展示效果（建议尺寸：200x200像素）</li>
          <li>使用箭头按钮调整劳动者在前台的显示顺序</li>
          <li>点击眼睛图标可显示或隐藏劳动者信息</li>
          <li>先进事迹支持富文本格式，可以添加标题、列表等格式</li>
        </ul>
      </div>
    </div>
  );
}
