'use client';

import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFile, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useCsrfToken } from '@/hooks';

interface FileUploadProps {
  uploadType: 'policy' | 'service';
  value?: string;
  fileName?: string;
  onChange: (url: string, fileName: string) => void;
}

// 允许的文件扩展名
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.jpg', '.jpeg', '.png'];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

export default function FileUpload({ uploadType, value, fileName, onChange }: FileUploadProps) {
  const csrfToken = useCsrfToken();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件扩展名
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError(`不支持的文件格式，支持的格式: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    // 验证文件大小
    if (file.size > MAX_SIZE) {
      setError('文件大小不能超过 100MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onChange(result.url, result.filename);
      } else {
        setError(result.error || '上传失败');
      }
    } catch (err) {
      setError('上传失败，请重试');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasFile = !!value;

  return (
    <div className="space-y-2">
      {!hasFile ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:bg-[hsl(var(--primary-dark))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FontAwesomeIcon icon={uploading ? faFile : faUpload} className="text-sm" />
            {uploading ? '上传中...' : '选择文件'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <span className="text-sm text-gray-500">
            支持 {ALLOWED_EXTENSIONS.join(' / ')}，最大 100MB
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <FontAwesomeIcon icon={faCheck} className="text-green-500" />
          <span className="flex-1 text-sm text-gray-700 truncate">{fileName || value}</span>
          <button
            type="button"
            onClick={handleRemove}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="移除文件"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
