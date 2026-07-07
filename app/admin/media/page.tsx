'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTrash, faSpinner, faSearch, faFilter,
  faImage, faFile, faVideo, faMusic, faTimes, faCheckSquare, faSquare,
  faSync
} from '@fortawesome/free-solid-svg-icons';
import BatchActionsBar from '@/components/admin/batch-actions-bar';
import { useCsrfToken, useMessage, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface Media {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  title: string;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  fileSize: number | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  tags: string[];
  category: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const MEDIA_TYPES = [
  { value: 'all', label: '全部类型' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'audio', label: '音频' },
  { value: 'document', label: '文档' },
];

const CATEGORIES = [
  { value: '', label: '全部分类' },
  { value: '新闻配图', label: '新闻配图' },
  { value: '政策附件', label: '政策附件' },
  { value: '视频文件', label: '视频文件' },
  { value: '劳动者图片', label: '劳动者图片' },
  { value: '服务图片', label: '服务图片' },
  { value: '媒体上传', label: '媒体上传' },
  { value: '其他', label: '其他' },
];

export default function AdminMediaPage() {
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // 首次加载时先同步媒体库，然后获取列表
    syncMediaAndFetch();
  }, [typeFilter, categoryFilter, currentPage]);

  const syncMediaAndFetch = async () => {
    // 仅在首次加载时同步（不等待同步完成）
    if (currentPage === 1 && mediaList.length === 0) {
      // 异步触发同步，不阻塞页面加载
      fetch('/api/admin/media/sync', {
        method: 'POST',
        credentials: 'include',
      }).then(res => res.json())
        .then(result => {
          if (result.success && result.newRecords > 0) {
            console.log('[媒体库同步]', result.message);
            // 有新记录，重新获取列表
            fetchMedia();
          }
        })
        .catch(err => console.warn('[媒体库同步失败]', err));
    }
    fetchMedia();
  };

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (categoryFilter) {
        params.append('category', categoryFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const result = await apiClient.get<any>(`/api/admin/media?${params}`);
      setMediaList(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      logger.error('Error fetching media:', error);
      showMessage('error', '加载媒体库失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMedia();
  };

  const handleSelectAll = () => {
    if (selectedIds.length === mediaList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mediaList.map(m => m.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchActionComplete = () => {
    setSelectedIds([]);
    fetchMedia();
  };


  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/media/sync', {
        method: 'POST',
        credentials: 'include',
      });
      const result = await res.json();
      if (result.success) {
        showMessage('success', result.message);
        fetchMedia();
      } else {
        showMessage('error', result.error || '同步失败');
      }
    } catch (err) {
      showMessage('error', '同步失败，请重试');
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);

        const response = await fetch('/api/admin/media', {
          method: 'POST',
          headers: {
            'x-csrf-token': csrfToken,
          },
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      showMessage('success', '上传成功');
      setShowUploadModal(false);
      fetchMedia();
    } catch (error) {
      logger.error('Error uploading files:', error);
      showMessage('error', '上传失败，请重试');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 个媒体文件吗？`)) {
      return;
    }

    try {
      await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds }),
      });

      showMessage('success', '删除成功');
      setSelectedIds([]);
      fetchMedia();
    } catch (error) {
      logger.error('Error deleting media:', error);
      showMessage('error', '删除失败，请重试');
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return faImage;
      case 'video':
        return faVideo;
      case 'audio':
        return faMusic;
      default:
        return faFile;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'bg-blue-100 text-blue-700';
      case 'video':
        return 'bg-purple-100 text-purple-700';
      case 'audio':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">媒体库管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理网站的所有图片和媒体资源
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faSync} className={syncing ? 'animate-spin' : ''} />
            {syncing ? '同步中...' : '同步文件'}
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:bg-[hsl(var(--primary-dark))] transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} />
            上传文件
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          >
            {MEDIA_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索文件名..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div>
          </div>

          <span className="text-sm text-gray-500">共 {total} 个文件</span>
        </form>
      </div>

      {/* Media Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl" />
            <p className="mt-2">加载中...</p>
          </div>
        ) : mediaList.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FontAwesomeIcon icon={faImage} className="text-4xl mb-4 text-gray-300" />
            <p>媒体库为空，点击上方上传文件按钮添加资源</p>
          </div>
        ) : (
          <>
            {/* Batch Actions Bar */}
            {selectedIds.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSelectAll}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      <FontAwesomeIcon
                        icon={selectedIds.length === mediaList.length ? faCheckSquare : faSquare}
                        className="text-lg"
                      />
                    </button>
                    <span className="text-sm text-blue-600 font-medium">
                      已选择 {selectedIds.length} 个文件
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeleteSelected}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} className="mr-1" />
                      删除选中
                    </button>
                    <button
                      onClick={() => setSelectedIds([])}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                    >
                      取消选择
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Grid */}
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mediaList.map((media) => (
                  <div
                    key={media.id}
                    className={`relative group border rounded-lg overflow-hidden transition-all ${
                      selectedIds.includes(media.id)
                        ? 'border-2 border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleSelectOne(media.id)}
                      className="absolute top-2 left-2 z-10 p-1 bg-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FontAwesomeIcon
                        icon={selectedIds.includes(media.id) ? faCheckSquare : faSquare}
                        className="text-lg"
                      />
                    </button>

                    {/* Thumbnail */}
                    <div className="relative aspect-square bg-gray-100">
                      {media.thumbnailUrl || media.type === 'image' ? (
                        <img
                          src={media.thumbnailUrl || media.url}
                          alt={media.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FontAwesomeIcon
                            icon={getFileIcon(media.type)}
                            className="text-4xl text-gray-400"
                          />
                        </div>
                      )}

                      {/* Type Badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(media.type)}`}>
                          {MEDIA_TYPES.find(t => t.value === media.type)?.label}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-gray-900 truncate" title={media.title}>
                        {media.title}
                      </h4>
                      <div className="mt-1 text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>大小: {formatFileSize(media.fileSize)}</span>
                          <span>使用: {media.usageCount}次</span>
                        </div>
                        {media.category && (
                          <div className="text-xs text-gray-600 truncate">{media.category}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  第 {currentPage} / {totalPages} 页
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => !uploading && setShowUploadModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">上传文件</h3>
                <button
                  onClick={() => !uploading && setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  disabled={uploading}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="p-6">
                <label className="flex items-center justify-center w-full px-4 py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-[hsl(var(--primary))] transition-colors cursor-pointer">
                  <div className="text-center">
                    <FontAwesomeIcon icon={faPlus} className="text-3xl text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {uploading ? `上传中... ${uploadProgress.toFixed(0)}%` : '点击选择或拖拽文件'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">支持图片、视频、音频、文档等多种格式</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        handleFileUpload(files);
                      }
                    }}
                    disabled={uploading}
                  />
                </label>

                {uploadProgress > 0 && (
                  <div className="mt-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[hsl(var(--primary))] h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500 space-y-1">
                  <p>支持的格式：</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>图片：JPG, PNG, GIF, WebP (最大 5MB)</li>
                    <li>视频：MP4, WebM, OGG (最大 100MB)</li>
                    <li>音频：MP3, WAV, OGG (最大 20MB)</li>
                    <li>文档：PDF, DOC, DOCX, XLS, XLSX (最大 10MB)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
