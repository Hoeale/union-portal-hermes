import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFilePdf, faFileWord, faFileExcel, faFileImage } from '@fortawesome/free-solid-svg-icons';

interface FileDownloadButtonProps {
  fileUrl: string;
  fileName?: string;
  label?: string;
  variant?: 'primary' | 'outline';
}

// 根据文件扩展名返回图标
function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
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
      return faFileImage;
    default:
      return faDownload;
  }
}

export default function FileDownloadButton({
  fileUrl,
  fileName,
  label,
  variant = 'primary',
}: FileDownloadButtonProps) {
  if (!fileUrl) return null;

  const displayName = fileName || fileUrl.split('/').pop() || '文件';
  const icon = getFileIcon(displayName);

  // 使用下载 API 端点以启用频率限制和安全检查
  // 传递原始文件名以支持中文文件名下载
  const downloadUrl = `/api/download?path=${encodeURIComponent(fileUrl)}${fileName ? `&filename=${encodeURIComponent(fileName)}` : ''}`;

  const baseClasses = 'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium';
  const variantClasses =
    variant === 'primary'
      ? 'bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary-dark))]'
      : 'border border-gray-300 text-gray-700 hover:bg-gray-50';

  return (
    <Link
      href={downloadUrl}
      download={displayName}
      className={`${baseClasses} ${variantClasses}`}
    >
      <FontAwesomeIcon icon={icon} className="text-base" />
      <span>{label || displayName}</span>
    </Link>
  );
}
