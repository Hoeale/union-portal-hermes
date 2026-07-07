'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faSave, faSpinner,
  faTimes, faToggleOn, faToggleOff, faInfoCircle,
  faArrowUp, faArrowDown, faUpload, faVideo, faPlay,
  faLink, faClock, faCheckSquare, faSquare
} from '@fortawesome/free-solid-svg-icons';
import BatchActionsBar from '@/components/admin/batch-actions-bar';
import { useCsrfToken, useMessage, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface Video {
  id: string;
  title: string;
  category: string;
  description: string | null;
  source_type: string;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  file_size: number | null;
  is_active: boolean;
  view_count: number;
  order_index: number;
}

interface FormData {
  title: string;
  category: string;
  description: string;
  source_type: 'local' | 'external';
  video_url: string;
  thumbnail_url: string;
  duration: number | null;
  is_active: boolean;
  order_index: number;
}

const CATEGORIES = ['工会活动', '培训教学', '宣传视频'];

const CATEGORY_COLORS: Record<string, string> = {
  '工会活动': 'bg-blue-100 text-blue-700',
  '培训教学': 'bg-green-100 text-green-700',
  '宣传视频': 'bg-purple-100 text-purple-700',
};

export default function AdminVideosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
      <AdminVideosPageContent />
    </Suspense>
  );
}

function AdminVideosPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showVideoCenter, setShowVideoCenter] = useState(true);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savingVideoConfig, setSavingVideoConfig] = useState(false);
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();

  const handleSelectAll = () => {
    if (selectedIds.length === filteredVideos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredVideos.map(v => v.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchActionComplete = () => {
    setSelectedIds([]);
    fetchVideos();
  };

  const videoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    category: '工会活动',
    description: '',
    source_type: 'local',
    video_url: '',
    thumbnail_url: '',
    duration: null,
    is_active: true,
    order_index: 0,
  });

  useEffect(() => {
    fetchVideos();
    // Fetch site configuration
    fetch('/api/site-config', {
      credentials: 'include', // 发送 session cookie
    })
      .then((res) => res.json())
      .then((config) => {
        setShowVideoCenter(config.show_video_center === 'true');
      })
      .catch((err) => logger.error('Failed to fetch site config:', err));
  }, []);

  // 处理 URL 参数：如果 action=create，自动打开新建弹窗
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create' && !loading) {
      handleCreate();
      // 清除 URL 参数
      router.replace('/admin/videos', { scroll: false });
    }
  }, [searchParams, loading]);

  const toggleVideoCenter = async (value: boolean) => {
    setSavingVideoConfig(true);
    try {
      await apiClient.put('/api/site-config', { key: 'show_video_center', value: String(value) }, { csrfToken });
      setShowVideoCenter(value);
    } catch (error) {
      showMessage('error', '更新配置失败');
    } finally {
      setSavingVideoConfig(false);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/admin/videos', {
        credentials: 'include', // 发送 session cookie
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setVideos(result.data);
    } catch (error) {
      showMessage('error', '加载视频列表失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '--';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleVideoUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      showMessage('error', '只支持 MP4、WebM、OGG 格式的视频');
      return;
    }

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      showMessage('error', '视频大小不能超过 100MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/admin/upload-video', {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: uploadFormData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setFormData({
        ...formData,
        video_url: data.url,
        duration: formData.duration,
      });

      // Auto-detect duration from video file
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setFormData((prev) => ({
          ...prev,
          duration: Math.floor(video.duration),
        }));
      };
      video.src = URL.createObjectURL(file);

      showMessage('success', '视频上传成功');
    } catch (error) {
      logger.error('Error uploading video:', error);
      showMessage('error', error instanceof Error ? error.message : '视频上传失败');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showMessage('error', '只能上传图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', '图片大小不能超过5MB');
      return;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: uploadFormData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setFormData({ ...formData, thumbnail_url: data.url });
      showMessage('success', '封面上传成功');
    } catch (error) {
      logger.error('Error uploading thumbnail:', error);
      showMessage('error', '封面上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      title: '',
      category: '工会活动',
      description: '',
      source_type: 'local',
      video_url: '',
      thumbnail_url: '',
      duration: null,
      is_active: true,
      order_index: videos.length,
    });
    setEditingId('new');
  };

  const handleEdit = (video: Video) => {
    setEditingId(video.id);
    setFormData({
      title: video.title,
      category: video.category,
      description: video.description || '',
      source_type: video.source_type as 'local' | 'external',
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || '',
      duration: video.duration,
      is_active: video.is_active,
      order_index: video.order_index,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({
      title: '',
      category: '工会活动',
      description: '',
      source_type: 'local',
      video_url: '',
      thumbnail_url: '',
      duration: null,
      is_active: true,
      order_index: 0,
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showMessage('error', '标题不能为空');
      return;
    }

    if (!formData.video_url) {
      showMessage('error', '请上传视频或输入视频链接');
      return;
    }

    setSaving(true);
    try {
      // 处理定时发布
      let scheduledPublishAt = null;
      let publishStatus = 'immediate';
      if (scheduleDate && scheduleTime) {
        scheduledPublishAt = `${scheduleDate}T${scheduleTime}:00`;
        publishStatus = 'scheduled';
      }

      const url = '/api/admin/videos';
      const data = isCreating
        ? { ...formData, scheduledPublishAt, publishStatus }
        : { ...formData, id: editingId, scheduledPublishAt, publishStatus };

      if (isCreating) {
        await apiClient.post(url, data, { csrfToken });
      } else {
        await apiClient.put(url, data, { csrfToken });
      }

      showMessage('success', isCreating ? '创建成功' : '更新成功');
      handleCancel();
      fetchVideos();
    } catch (error) {
      showMessage('error', '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个视频吗？')) return;

    try {
      await apiClient.delete(`/api/admin/videos?id=${id}`, { csrfToken });
      showMessage('success', '删除成功');
      fetchVideos();
    } catch (error) {
      showMessage('error', '删除失败');
    }
  };

  const handleToggleActive = async (video: Video) => {
    try {
      await apiClient.put('/api/admin/videos', { id: video.id, is_active: !video.is_active }, { csrfToken });
      fetchVideos();
    } catch (error) {
      showMessage('error', '更新失败');
    }
  };

  const moveVideo = async (index: number, direction: 'up' | 'down') => {
    const newVideos = [...videos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newVideos.length) return;

    const temp = newVideos[index].order_index;
    newVideos[index].order_index = newVideos[targetIndex].order_index;
    newVideos[targetIndex].order_index = temp;

    newVideos.sort((a, b) => a.order_index - b.order_index);
    setVideos(newVideos);

    try {
      await Promise.all([
        apiClient.put('/api/admin/videos', { id: newVideos[index].id, order_index: newVideos[index].order_index }, { csrfToken }),
        apiClient.put('/api/admin/videos', { id: newVideos[targetIndex].id, order_index: newVideos[targetIndex].order_index }, { csrfToken }),
      ]);
    } catch (error) {
      fetchVideos();
    }
  };

  const filteredVideos = filterCategory === 'all'
    ? videos
    : videos.filter((v) => v.category === filterCategory);

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
          <h1 className="text-2xl font-bold text-[#1e2b3c]">视频管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理工会活动、培训教学和宣传视频
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#b71c1c] text-white rounded-lg hover:bg-[#9a1616] transition-colors shadow-sm"
        >
          <FontAwesomeIcon icon={faPlus} />
          添加视频
        </button>
      </div>

      {/* Video Center Display Control Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">视频中心显示控制</h3>
            <p className="text-sm text-gray-600 mt-1">
              控制前台导航栏和视频模块是否显示
            </p>
            <div className="mt-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  showVideoCenter
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {showVideoCenter ? '当前状态：显示' : '当前状态：隐藏'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {savingVideoConfig && (
              <div className="text-sm text-gray-500">保存中...</div>
            )}
            <button
              onClick={() => toggleVideoCenter(!showVideoCenter)}
              disabled={savingVideoConfig}
              className={`relative inline-flex h-10 w-18 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                showVideoCenter ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-md transition-transform ${
                  showVideoCenter ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
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

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1e2b3c]">
              {isCreating ? '添加新视频' : '编辑视频'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                视频标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                placeholder="输入视频标题"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                视频分类 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                {CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={formData.category === cat}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-4 h-4 text-[#b71c1c] focus:ring-[#b71c1c]"
                    />
                    <span className="text-sm text-gray-700">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                视频描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                rows={3}
                placeholder="输入视频简介（可选）"
              />
            </div>

            {/* Video Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                视频来源 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="source_type"
                    value="local"
                    checked={formData.source_type === 'local'}
                    onChange={() => setFormData({ ...formData, source_type: 'local', video_url: '' })}
                    className="w-4 h-4 text-[#b71c1c] focus:ring-[#b71c1c]"
                  />
                  <span className="text-sm text-gray-700">本地上传</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="source_type"
                    value="external"
                    checked={formData.source_type === 'external'}
                    onChange={() => setFormData({ ...formData, source_type: 'external', video_url: '' })}
                    className="w-4 h-4 text-[#b71c1c] focus:ring-[#b71c1c]"
                  />
                  <span className="text-sm text-gray-700">外部链接</span>
                </label>
              </div>

              {/* Local Upload */}
              {formData.source_type === 'local' && (
                <div>
                  <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#b71c1c] transition-colors cursor-pointer">
                    <div className="text-center">
                      <FontAwesomeIcon icon={faUpload} className="text-2xl text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {uploading ? `上传中... ${uploadProgress}%` : '点击上传或拖拽视频文件'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">支持 MP4, WebM, OGG（最大100MB）</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleVideoUpload(file);
                      }}
                      disabled={uploading}
                    />
                  </label>
                  {uploadProgress > 0 && (
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#b71c1c] h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                  {formData.video_url && formData.source_type === 'local' && (
                    <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                      <FontAwesomeIcon icon={faVideo} />
                      <span>已上传: {formData.video_url}</span>
                    </div>
                  )}
                </div>
              )}

              {/* External Link */}
              {formData.source_type === 'external' && (
                <div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faLink} className="text-gray-400" />
                    <input
                      type="url"
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                      placeholder="https://www.bilibili.com/video/BV1xx4... 或 https://v.qq.com/x/cover/..."
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">支持 B站、腾讯视频、优酷等平台的视频链接</p>
                </div>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                视频时长（秒）
              </label>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                <input
                  type="number"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  placeholder="秒"
                  min="0"
                />
                <span className="text-sm text-gray-500">
                  {formData.duration ? `（${formatDuration(formData.duration)}）` : '本地视频自动检测，外部视频手动输入'}
                </span>
              </div>
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                封面图片
              </label>
              <div className="flex items-start gap-4">
                {formData.thumbnail_url && (
                  <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                    <Image
                      src={formData.thumbnail_url}
                      alt="封面预览"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#b71c1c] transition-colors cursor-pointer">
                    <div className="text-center">
                      <FontAwesomeIcon icon={faUpload} className="text-2xl text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {uploading ? '上传中...' : '点击上传封面'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">支持 JPG, PNG（最大5MB）</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleThumbnailUpload(file);
                      }}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#b71c1c] rounded focus:ring-[#b71c1c]"
                />
                <span className="text-sm font-medium text-gray-700">在前台显示</span>
              </label>
            </div>

            {/* Action Buttons */}
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

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1e2b3c]">视频列表</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filterCategory === 'all'
                  ? 'bg-[#b71c1c] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              全部
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterCategory === cat
                    ? 'bg-[#b71c1c] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 批量操作栏 */}
        {selectedIds.length > 0 && (
          <BatchActionsBar
            selectedIds={selectedIds}
            onClearSelection={() => setSelectedIds([])}
            onActionComplete={handleBatchActionComplete}
            apiEndpoint="/api/admin/videos/batch-action"
            actions={{
              publish: { label: '启用', value: 'activate' },
              unpublish: { label: '停用', value: 'deactivate' },
              delete: { label: '删除', value: 'delete' },
              updateCategory: {
                label: '修改分类',
                value: 'update_category',
                options: CATEGORIES.map(c => ({ label: c, value: c })),
              },
            }}
          />
        )}

        {/* Videos List */}
        <div className="divide-y divide-gray-200">
          {filteredVideos.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              暂无视频，点击上方添加视频按钮创建
            </div>
          ) : (
            filteredVideos.map((video, index) => (
              <div
                key={video.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${selectedIds.includes(video.id) ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleSelectOne(video.id)}
                    className="mt-8 text-gray-400 hover:text-gray-600 focus:outline-none flex-shrink-0"
                  >
                    <FontAwesomeIcon
                      icon={selectedIds.includes(video.id) ? faCheckSquare : faSquare}
                      className="text-lg"
                    />
                  </button>

                  {/* Thumbnail */}
                  <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-900">
                    {video.thumbnail_url ? (
                      <Image
                        src={video.thumbnail_url}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faPlay} className="text-2xl text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-[#1e2b3c] truncate">
                        {video.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${CATEGORY_COLORS[video.category]}`}>
                        {video.category}
                      </span>
                      {!video.is_active && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          已隐藏
                        </span>
                      )}
                    </div>
                    {video.description && (
                      <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap line-clamp-1">{video.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} />
                        {formatDuration(video.duration)}
                      </span>
                      <span>来源: {video.source_type === 'local' ? '本地' : '外部'}</span>
                      {video.file_size && <span>大小: {formatFileSize(video.file_size)}</span>}
                      <span>播放: {video.view_count} 次</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveVideo(index, 'up')}
                      disabled={index === 0}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                      title="上移"
                    >
                      <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                    <button
                      onClick={() => moveVideo(index, 'down')}
                      disabled={index === filteredVideos.length - 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                      title="下移"
                    >
                      <FontAwesomeIcon icon={faArrowDown} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(video)}
                      className={`p-2 transition-colors ${
                        video.is_active
                          ? 'text-green-600 hover:text-green-700'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={video.is_active ? '隐藏' : '显示'}
                    >
                      <FontAwesomeIcon icon={video.is_active ? faToggleOn : faToggleOff} />
                    </button>
                    <button
                      onClick={() => handleEdit(video)}
                      className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                      title="编辑"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
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

        {/* 全选按钮 */}
        {filteredVideos.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <FontAwesomeIcon
                icon={selectedIds.length === filteredVideos.length && filteredVideos.length > 0 ? faCheckSquare : faSquare}
              />
              <span>
                {selectedIds.length === filteredVideos.length && filteredVideos.length > 0
                  ? '取消全选'
                  : `全选 (${filteredVideos.length} 个视频)`}
              </span>
            </button>
            {selectedIds.length > 0 && (
              <span className="text-sm text-blue-600 font-medium">
                已选择 {selectedIds.length} 个视频
              </span>
            )}
          </div>
        )}
      </div>

      {/* Help Card */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
          管理提示
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>支持上传本地 MP4、WebM、OGG 格式视频（最大100MB）</li>
          <li>也可粘贴B站、腾讯视频等外部平台链接</li>
          <li>建议上传前对视频进行压缩和格式转换</li>
          <li>上传本地视频时会自动检测时长</li>
          <li>可为视频上传自定义封面图，否则显示默认播放图标</li>
          <li>使用箭头按钮调整视频在前台的显示顺序</li>
        </ul>
      </div>
    </div>
  );
}
