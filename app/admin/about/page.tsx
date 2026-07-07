'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import RichTextEditor from '@/components/admin/rich-text-editor';
import { useCsrfToken, useMessage, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

export default function AdminAboutPage() {
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const data = await apiClient.get<any>('/api/admin/about');
      setContent(data || '');
    } catch (error) {
      logger.error('Error fetching content:', error);
      showMessage('error', '加载内容失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showMessage('error', '内容不能为空');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put('/api/admin/about', { content }, { csrfToken });
      showMessage('success', '保存成功');
    } catch (error) {
      logger.error('Error saving content:', error);
      showMessage('error', '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'x-csrf-token': csrfToken,
      },
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      return data.url;
    }
    throw new Error('Upload failed');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e2b3c]">工会概况管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            编辑工会简介内容，支持富文本格式
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#b71c1c] text-white rounded-lg hover:bg-[#9a1616] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {saving ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faSave} />
              保存更改
            </>
          )}
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

      {/* Editor Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-[#1e2b3c]">工会简介</h2>
          <p className="text-sm text-gray-500 mt-1">
            支持段落、标题、列表、加粗、斜体等富文本格式
          </p>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-gray-400" />
            </div>
          ) : (
            <RichTextEditor
              content={content}
              onChange={setContent}
              onImageUpload={handleImageUpload}
              showPreview={true}
            />
          )}
        </div>
      </div>

      {/* Help Card */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
          编辑提示
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>使用工具栏按钮添加格式（加粗、斜体、下划线、标题、列表等）</li>
          <li>支持文字颜色、对齐方式、插入链接、引用、代码块等功能</li>
          <li>点击图片图标可上传本地图片到编辑器</li>
          <li>点击预览图标查看最终显示效果</li>
          <li>更改后记得点击保存更改按钮</li>
          <li>内容将同时显示在原版和新版网站的工会概况页面</li>
        </ul>
      </div>
    </div>
  );
}
