'use client';

import { useState, useEffect } from 'react';
import { Eye, Download, X } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faFileWord, faFileExcel, faFileImage, faFile } from '@fortawesome/free-solid-svg-icons';

interface PolicyAttachmentItemProps {
  fileUrl: string;
  fileName: string;
}

// 可预览的文件扩展名
const PREVIEWABLE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'pdf'];

function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

function isPreviewable(fileName: string): boolean {
  return PREVIEWABLE_EXTENSIONS.includes(getFileExtension(fileName));
}

function getFileIcon(fileName: string) {
  const ext = getFileExtension(fileName);
  switch (ext) {
    case 'pdf':
      return faFilePdf;
    case 'doc':
    case 'docx':
      return faFileWord;
    case 'xls':
    case 'xlsx':
      return faFileExcel;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'svg':
    case 'bmp':
      return faFileImage;
    default:
      return faFile;
  }
}

function isImage(fileName: string): boolean {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(getFileExtension(fileName));
}

export default function PolicyAttachmentItem({ fileUrl, fileName }: PolicyAttachmentItemProps) {
  const [showPreview, setShowPreview] = useState(false);
  const displayName = fileName || fileUrl.split('/').pop() || '文件';
  const icon = getFileIcon(displayName);
  const previewable = isPreviewable(displayName);

  const downloadUrl = `/api/download?path=${encodeURIComponent(fileUrl)}${fileName ? `&filename=${encodeURIComponent(fileName)}` : ''}`;

  // 预览模态框打开时禁止背景滚动
  useEffect(() => {
    if (showPreview) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPreview]);

  // ESC 键关闭预览
  useEffect(() => {
    if (!showPreview) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPreview(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showPreview]);

  return (
    <>
      <div className="group flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <FontAwesomeIcon icon={icon} className="text-lg text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate">{displayName}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {previewable && (
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
              title="预览"
              aria-label="预览附件"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <a
            href={downloadUrl}
            download={displayName}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
            title="下载"
            aria-label="下载附件"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full mx-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between mb-3 text-white">
              <span className="text-sm font-medium truncate pr-4">{displayName}</span>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
                title="关闭"
                aria-label="关闭预览"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* 预览内容 */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              {isImage(displayName) ? (
                <img
                  src={fileUrl}
                  alt={displayName}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              ) : (
                <iframe
                  src={fileUrl}
                  className="w-full h-[80vh] rounded-lg bg-white"
                  title={displayName}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
