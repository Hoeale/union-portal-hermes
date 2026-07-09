'use client';

import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useCsrfToken } from '@/hooks';

interface ImageUploadProps {
  /** 当前图片 URL */
  value?: string;
  /** 值变化回调 */
  onChange: (url: string) => void;
  /** 上传类型，对应 /api/admin/upload 的 type 字段，默认 'image' */
  uploadType?: string;
  /** 接受的文件类型，默认 'image/*' */
  accept?: string;
  /** 最大文件大小（字节），默认 10MB */
  maxSize?: number;
  /** 预览缩略图尺寸（px），默认 80 */
  previewSize?: number;
  /** 预览宽度，默认使用 previewSize */
  previewWidth?: number | string;
  /** 预览高度，默认使用 previewSize */
  previewHeight?: number | string;
  /** 图片填充方式，默认 contain */
  objectFit?: 'contain' | 'cover';
  /** 提示文字 */
  hint?: string;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function ImageUpload({
  value,
  onChange,
  uploadType = 'image',
  accept = 'image/*',
  maxSize = DEFAULT_MAX_SIZE,
  previewSize = 80,
  previewWidth,
  previewHeight,
  objectFit = 'contain',
  hint,
}: ImageUploadProps) {
  const csrfToken = useCsrfToken();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 验证文件大小
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / 1024 / 1024);
      setError(`文件大小不能超过 ${maxMB}MB`);
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
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onChange(result.url);
      } else {
        setError(result.error || '上传失败');
      }
    } catch (err) {
      setError('上传失败，请重试');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      // 清空 input 以便可以再次选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasImage = !!value;
  const width = previewWidth ?? previewSize;
  const height = previewHeight ?? previewSize;

  return (
    <div>
      <div className="flex items-start gap-4">
        {/* 上传/预览卡片 */}
        <div
          className={`relative rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 group ${
            hasImage
              ? 'border border-gray-200 bg-gray-100'
              : `border-2 border-dashed bg-gray-50 cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                    : 'border-gray-300 hover:border-[hsl(var(--primary))]'
                }`
          }`}
          style={{ width, height }}
          onClick={() => !hasImage && !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
          }}
          onDrop={handleDrop}
        >
          {hasImage ? (
            <>
              <img
                src={value}
                alt="预览"
                className={objectFit === 'cover' ? 'w-full h-full object-cover' : 'w-full h-full object-contain'}
              />
              {/* hover 遮罩 + 操作 */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="w-7 h-7 flex items-center justify-center text-white hover:text-red-400 transition-colors"
                  title="删除图片"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-lg" />
                </button>
              </div>
            </>
          ) : uploading ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400 text-2xl" />
          ) : (
            <FontAwesomeIcon icon={faPlus} className="text-gray-400 text-2xl" />
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </div>
      </div>

      {/* 提示与错误 */}
      {hint && !error && (
        <p className="text-xs text-gray-500 mt-2">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
