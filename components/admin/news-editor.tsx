'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/admin/rich-text-editor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faSave, faPaperPlane, faFileAlt, faSpinner,
  faEye, faImage, faLink, faInfoCircle, faStar, faCheckCircle, faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';

// 预览功能：将数据保存到 sessionStorage 并打开预览窗口
const openPreview = (data: { title: string; category: string; content: string; image_url: string }) => {
  // 检查是否有有效内容（标题或内容至少有一个）
  const hasTitle = data.title?.trim();
  const hasContent = data.content?.trim() && data.content !== '<p></p>' && data.content !== '';
  
  if (!hasTitle && !hasContent) {
    alert('请先输入标题或内容后再预览');
    return;
  }
  sessionStorage.setItem('news-editor-preview', JSON.stringify(data));
  window.open('/preview/editor', '_blank');
};

interface NewsEditorProps {
  mode: 'create' | 'edit';
  newsId?: string;
  initialData?: {
    title: string;
    category: string;
    content: string;
    image_url: string;
    image_source_type: 'local' | 'external';
    is_carousel: boolean;
    carousel_order: number;
    status?: 'pending' | 'published';
    publishedAt?: string;
  };
}

interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export default function NewsEditor({ mode, newsId, initialData }: NewsEditorProps) {
  const router = useRouter();
  const [csrfToken, setCsrfToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [categories, setCategories] = useState<NewsCategory[]>([]);

  // 自动保存相关
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const draftIdRef = useRef<string | null>(null); // 服务器端草稿ID
  const hasChangesRef = useRef(false); // 是否有未保存的更改
  const isInitialMountRef = useRef(true); // 是否是初始挂载（避免初始化时触发自动保存）

  // 获取新闻分类列表
  useEffect(() => {
    fetch('/api/admin/news-categories')
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setCategories(result.data);
        }
      })
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || '',
    content: initialData?.content || '',
    image_url: initialData?.image_url || '',
    image_source_type: initialData?.image_source_type || ('local' as 'local' | 'external'),
    is_carousel: initialData?.is_carousel ?? true,
    carousel_order: initialData?.carousel_order || 0,
    // 定时发布相关
    publish_type: 'immediate' as 'immediate' | 'scheduled',
    scheduled_date: '',
    scheduled_time: '',
    // 发布日期（可手动修改）
    published_date: initialData?.publishedAt ? new Date(initialData.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  });

  // localStorage key（区分新建和编辑）
  const storageKey = mode === 'edit' && newsId
    ? `news-draft-edit-${newsId}`
    : 'news-draft-create';

  // 本地缓存：每次输入变化时保存到 localStorage
  const saveToLocal = useCallback((data: typeof formData) => {
    try {
      const draftData = {
        ...data,
        mode,
        newsId,
        savedAt: new Date().toISOString(),
        draftId: draftIdRef.current,
      };
      localStorage.setItem(storageKey, JSON.stringify(draftData));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [storageKey, mode, newsId]);

  // 服务器端自动保存草稿
  const autoSaveToServer = useCallback(async (data: typeof formData) => {
    if (!data.title.trim() && !data.content.trim()) {
      return; // 标题和内容都为空时不保存
    }

    setAutoSaveStatus('saving');
    try {
      const url = '/api/admin/drafts';
      const method = draftIdRef.current ? 'PUT' : 'POST';
      const body = draftIdRef.current
        ? {
            id: draftIdRef.current,
            title: data.title,
            category: data.category,
            content: data.content,
            imageUrl: data.image_url || null,
          }
        : {
            type: 'news',
            title: data.title || '(未命名新闻)',
            category: data.category,
            content: data.content,
            imageUrl: data.image_url || null,
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (result.success && result.data) {
        // 记录草稿ID，下次更新时使用
        if (!draftIdRef.current) {
          draftIdRef.current = result.data.id;
        }
        setAutoSaveStatus('saved');
        const now = new Date();
        setLastAutoSaveTime(
          `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
        );
        hasChangesRef.current = false;
      } else {
        setAutoSaveStatus('error');
      }
    } catch (error: unknown) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
    }
  }, []);

  // 监听 formData 变化，触发自动保存
  useEffect(() => {
    // 跳过初始挂载
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // 标记有更改
    hasChangesRef.current = true;

    // 保存到本地缓存
    saveToLocal(formData);

    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // 设置新的定时器：停止输入30秒后自动保存到服务器
    autoSaveTimerRef.current = setTimeout(() => {
      if (hasChangesRef.current) {
        autoSaveToServer(formData);
      }
    }, 30000); // 30秒防抖

    // 清理函数
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, saveToLocal, autoSaveToServer]);

  // 页面关闭前保存（使用 beforeunload）
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasChangesRef.current && (formData.title.trim() || formData.content.trim())) {
        // 使用 sendBeacon 确保请求在页面卸载时发送
        const data = {
          type: 'news',
          title: formData.title || '(未命名新闻)',
          category: formData.category,
          content: formData.content,
          imageUrl: formData.image_url || null,
        };
        // 如果有草稿ID，使用 PUT 更新
        if (draftIdRef.current) {
          (data as any).id = draftIdRef.current;
        }
        navigator.sendBeacon('/api/admin/drafts', JSON.stringify(data));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Fetch CSRF token
  useEffect(() => {
    fetch('/api/admin/csrf-token')
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.token))
      .catch(console.error);
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken,
  });

  const handleImageUpload = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const response = await fetch('/api/admin/upload', {
      method: 'POST', 
      headers: {
        'x-csrf-token': csrfToken,
      },
      credentials: 'include', // 确保 cookie 在 IP 地址访问时也能传递
      body: fd,
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || '上传失败');
    return result.url;
  };

  // 从内容中提取第一张图片URL
  const extractFirstImageFromContent = (content: string): string | null => {
    // 匹配 <img src="..."> 或 <img src='...'>
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    return imgMatch ? imgMatch[1] : null;
  };

  // Submit (publish or update)
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showMessage('error', '请输入新闻标题');
      return;
    }
    if (!formData.content.trim()) {
      showMessage('error', '请输入新闻内容');
      return;
    }
    // 定时发布验证
    if (formData.publish_type === 'scheduled') {
      if (!formData.scheduled_date || !formData.scheduled_time) {
        showMessage('error', '请设置定时发布的日期和时间');
        return;
      }
      const scheduledTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      if (scheduledTime <= new Date()) {
        showMessage('error', '定时发布时间必须晚于当前时间');
        return;
      }
    }
    if (!csrfToken) {
      showMessage('error', '安全令牌未获取，请刷新页面');
      return;
    }

    setSubmitting(true);
    try {
      const url = '/api/admin/news';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      
      // 如果没有设置封面图，自动从内容中提取第一张图片
      let imageUrl = formData.image_url;
      if (!imageUrl && formData.content) {
        const extractedImage = extractFirstImageFromContent(formData.content);
        if (extractedImage) {
          // 提示用户是否采用第一张图片作为封面
          const confirmed = window.confirm('当前无封面照片，是否采用新闻第一张照片为封面？');
          if (confirmed) {
            imageUrl = extractedImage;
          }
        }
      }
      
      // 构建请求体，包含定时发布字段和发布日期
      const baseBody = {
        title: formData.title,
        category: formData.category,
        content: formData.content,
        image_url: imageUrl,
        image_source_type: formData.image_source_type,
        is_carousel: formData.is_carousel,
        carousel_order: formData.carousel_order,
        publish_status: formData.publish_type,
        scheduled_publish_at: formData.publish_type === 'scheduled' && formData.scheduled_date && formData.scheduled_time
          ? new Date(`${formData.scheduled_date}T${formData.scheduled_time}`).toISOString()
          : null,
        // 手动设置的发布日期（转换为 DateTime）
        published_at: formData.published_date ? new Date(formData.published_date).toISOString() : undefined,
      };
      
      const body = mode === 'edit'
        ? { ...baseBody, id: newsId }
        : baseBody;

      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      if (result.success) {
        const successMsg = formData.publish_type === 'scheduled'
          ? `已设置定时发布：${formData.scheduled_date} ${formData.scheduled_time}`
          : (mode === 'edit' ? '更新成功！' : '发布成功！');
        showMessage('success', successMsg);
        setTimeout(() => router.push('/admin/news'), 800);
      } else {
        showMessage('error', result.error || '操作失败');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('Failed to save news:', error);
      showMessage('error', '操作失败：' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showMessage('error', '标题和内容为必填项');
      return;
    }

    if (!csrfToken) {
      showMessage('error', '安全令牌未获取，请刷新页面');
      return;
    }

    setSavingDraft(true);
    try {
      const response = await fetch('/api/admin/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'news',
          title: formData.title,
          category: formData.category,
          content: formData.content,
          imageUrl: formData.image_url || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        showMessage('success', '已保存到草稿箱');
        setTimeout(() => router.push('/admin/news'), 800);
      } else {
        showMessage('error', result.error || '保存失败');
      }
    } catch (error: unknown) {
      console.error('Failed to save draft:', error);
      showMessage('error', '保存失败');
    } finally {
      setSavingDraft(false);
    }
  };

  const isPending = initialData?.status === 'pending';
  const wordCount = formData.content.replace(/<[^>]*>/g, '').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Action Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back + Breadcrumb */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/news')}
                className="flex items-center gap-2 text-gray-600 hover:text-[#b71c1c] transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span className="hidden sm:inline">返回新闻列表</span>
              </button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                <span>/</span>
                <span className="text-gray-700 font-medium">
                  {mode === 'create' ? '发布新闻' : '编辑新闻'}
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {message && (
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {message.text}
                </span>
              )}
              {/* 自动保存状态指示器 */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                {autoSaveStatus === 'saving' && (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400" />
                    <span>保存中...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && lastAutoSaveTime && (
                  <>
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                    <span>已自动保存于 {lastAutoSaveTime}</span>
                  </>
                )}
                {autoSaveStatus === 'idle' && !lastAutoSaveTime && hasChangesRef.current && (
                  <span className="text-gray-400">编辑中...</span>
                )}
              </div>
              <button
                onClick={() => openPreview({
                  title: formData.title,
                  category: formData.category,
                  content: formData.content,
                  image_url: formData.image_url,
                })}
                disabled={submitting || savingDraft}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <FontAwesomeIcon icon={faEye} />
                <span className="hidden sm:inline">预览</span>
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={savingDraft || submitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <FontAwesomeIcon icon={savingDraft ? faSpinner : faFileAlt} className={savingDraft ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">存为草稿</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || savingDraft}
                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-[#b71c1c] rounded-lg hover:bg-[#8b0000] disabled:opacity-50 transition-colors shadow-sm"
              >
                <FontAwesomeIcon icon={submitting ? faSpinner : faPaperPlane} className={submitting ? 'animate-spin' : ''} />
                {mode === 'edit' ? '更新' : '发布'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Editor Area - Left/Main */}
          <div className="flex-1 min-w-0">
            {/* Title Input - Large */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full text-2xl font-bold text-gray-900 border-none outline-none placeholder-gray-300 p-0"
                placeholder="请输入新闻标题..."
              />
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">字数: {wordCount}</span>
                {formData.title && (
                  <span className="text-xs text-green-500">✓ 标题已填写</span>
                )}
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  正文内容 <span className="text-red-500">*</span>
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTab('content')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      activeTab === 'content'
                        ? 'bg-[#b71c1c] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      activeTab === 'settings'
                        ? 'bg-[#b71c1c] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    设置
                  </button>
                </div>
              </div>

              {activeTab === 'content' ? (
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  onImageUpload={handleImageUpload}
                />
              ) : (
                <SettingsPanel
                  formData={formData}
                  setFormData={setFormData}
                  handleImageUpload={handleImageUpload}
                  isPending={isPending}
                />
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">发布状态</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">当前状态</span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    mode === 'edit' && initialData?.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {mode === 'edit' && initialData?.status === 'published' ? '已发布' : '待发布'}
                  </span>
                </div>
                {mode === 'edit' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">分类</span>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#b71c1c]/10 text-[#b71c1c]">
                      {formData.category}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Category Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                新闻分类 <span className="text-red-500">*</span>
              </h3>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500">暂无分类，请先在新闻管理中添加分类</p>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.category === cat.name
                          ? 'border-[#b71c1c] bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat.name}
                        checked={formData.category === cat.name}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.category === cat.name ? 'border-[#b71c1c]' : 'border-gray-300'
                      }`}>
                        {formData.category === cat.name && (
                          <div className="w-2 h-2 rounded-full bg-[#b71c1c]" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        formData.category === cat.name ? 'text-[#b71c1c]' : 'text-gray-700'
                      }`}>
                        {cat.name}
                      </span>
                      {cat.color && (
                        <span className="w-3 h-3 rounded-full ml-auto" style={{ backgroundColor: cat.color }} />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Cover Image */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">封面图片</h3>
              {/* Source toggle */}
              <div className="flex gap-4 mb-3">
                <button
                  onClick={() => setFormData({ ...formData, image_source_type: 'local', image_url: '' })}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    formData.image_source_type === 'local'
                      ? 'bg-[#b71c1c] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FontAwesomeIcon icon={faImage} />
                  本地上传
                </button>
                <button
                  onClick={() => setFormData({ ...formData, image_source_type: 'external', image_url: '' })}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    formData.image_source_type === 'external'
                      ? 'bg-[#b71c1c] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FontAwesomeIcon icon={faLink} />
                  外部链接
                </button>
              </div>

              {formData.image_source_type === 'local' ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#b71c1c] transition-colors bg-gray-50 hover:bg-red-50/30">
                  <FontAwesomeIcon icon={faImage} className="text-2xl text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500">点击上传封面</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const url = await handleImageUpload(file);
                          setFormData({ ...formData, image_url: url });
                        } catch {
                          showMessage('error', '图片上传失败');
                        }
                      }
                    }}
                  />
                </label>
              ) : (
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              )}

              {formData.image_url && (
                <div className="mt-3 relative">
                  <img
                    src={formData.image_url}
                    alt="封面预览"
                    className="w-full h-32 rounded-lg object-cover"
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-black/50 text-white rounded">
                    {formData.image_source_type === 'local' ? '本地' : '外链'}
                  </span>
                  <button
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                    className="absolute bottom-2 right-2 px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    移除
                  </button>
                </div>
              )}
            </div>

            {/* Carousel Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                <FontAwesomeIcon icon={faStar} className="text-yellow-500 mr-1" />
                轮播图设置
              </h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_carousel}
                  onChange={(e) =>
                    setFormData({ ...formData, is_carousel: e.target.checked })
                  }
                  disabled={isPending}
                  className="rounded border-gray-300 text-[#b71c1c] focus:ring-[#b71c1c] h-4 w-4"
                />
                <span className="text-sm text-gray-700">
                  设为轮播图
                  {isPending && (
                    <span className="ml-1 text-xs text-orange-600">(需先发布)</span>
                  )}
                </span>
              </label>
              {formData.is_carousel && (
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-xs text-gray-600">排序:</label>
                  <input
                    type="number"
                    value={formData.carousel_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        carousel_order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                    min="0"
                  />
                </div>
              )}
            </div>

            {/* 发布设置 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500 mr-1" />
                发布设置
              </h3>
              <div className="space-y-3">
                {/* 发布日期（可手动修改） */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">发布日期</label>
                  <input
                    type="date"
                    value={formData.published_date}
                    onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">前端将显示此日期（年/月/日）</p>
                </div>
                
                <div className="flex gap-4 pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="publish_type"
                      value="immediate"
                      checked={formData.publish_type === 'immediate'}
                      onChange={() => setFormData({ ...formData, publish_type: 'immediate' })}
                      className="w-4 h-4 text-[#b71c1c] focus:ring-[#b71c1c]"
                    />
                    <span className="text-sm text-gray-700">立即发布</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="publish_type"
                      value="scheduled"
                      checked={formData.publish_type === 'scheduled'}
                      onChange={() => setFormData({ ...formData, publish_type: 'scheduled' })}
                      className="w-4 h-4 text-[#b71c1c] focus:ring-[#b71c1c]"
                    />
                    <span className="text-sm text-gray-700">定时发布</span>
                  </label>
                </div>
                {formData.publish_type === 'scheduled' && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">定时发布日期</label>
                      <input
                        type="date"
                        value={formData.scheduled_date}
                        onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">定时发布时间</label>
                      <input
                        type="time"
                        value={formData.scheduled_time}
                        onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                      />
                    </div>
                    {formData.scheduled_date && formData.scheduled_time && (
                      <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                        <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                        将于 {formData.scheduled_date} {formData.scheduled_time} 自动发布
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
              <p className="text-xs text-blue-700 leading-relaxed">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                新闻发布后默认为&ldquo;待发布&rdquo;状态，可在列表中手动发布。支持富文本编辑，可在正文中插入图片。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings Panel (shown when switching to "设置" tab in editor area)
function SettingsPanel({
  formData,
  setFormData,
  handleImageUpload,
  isPending,
}: {
  formData: any;
  setFormData: any;
  handleImageUpload: (file: File) => Promise<string>;
  isPending: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">封面图片设置</h4>
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="settings_image_source"
              value="local"
              checked={formData.image_source_type === 'local'}
              onChange={() => setFormData({ ...formData, image_source_type: 'local', image_url: '' })}
              className="w-4 h-4 text-[#b71c1c] focus:ring-[#b71c1c]"
            />
            <span className="text-sm text-gray-700">本地上传</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="settings_image_source"
              value="external"
              checked={formData.image_source_type === 'external'}
              onChange={() => setFormData({ ...formData, image_source_type: 'external', image_url: '' })}
              className="w-4 h-4 text-[#b71c1c] focus:ring-[#b71c1c]"
            />
            <span className="text-sm text-gray-700">外部链接</span>
          </label>
        </div>
        {formData.image_source_type === 'local' ? (
          <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#b71c1c] transition-colors bg-white">
            <div className="text-center">
              <FontAwesomeIcon icon={faImage} className="text-xl text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">点击上传封面图片</p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    const url = await handleImageUpload(file);
                    setFormData({ ...formData, image_url: url });
                  } catch {
                    // handled by parent
                  }
                }
              }}
            />
          </label>
        ) : (
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
        )}
        {formData.image_url && (
          <div className="mt-3 relative">
            <img src={formData.image_url} alt="封面预览" className="w-full h-32 rounded-lg object-cover" />
            <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-black/50 text-white rounded">
              {formData.image_source_type === 'local' ? '本地' : '外链'}
            </span>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">轮播图设置</h4>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_carousel}
            onChange={(e) => setFormData({ ...formData, is_carousel: e.target.checked })}
            disabled={isPending}
            className="rounded border-gray-300 text-[#b71c1c] focus:ring-[#b71c1c] h-5 w-5"
          />
          <span className="text-sm text-gray-700">
            设为轮播图
            {isPending && <span className="ml-2 text-xs text-orange-600">(需先发布)</span>}
          </span>
        </label>
        {formData.is_carousel && (
          <div className="mt-3 flex items-center gap-2">
            <label className="text-sm text-gray-600">排序值:</label>
            <input
              type="number"
              value={formData.carousel_order}
              onChange={(e) =>
                setFormData({ ...formData, carousel_order: parseInt(e.target.value) || 0 })
              }
              className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
              min="0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
