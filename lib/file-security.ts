/**
 * 文件上传安全工具
 * 包含文件类型校验、病毒扫描、文件大小限制等功能
 */

import { promises as fs } from 'fs';
import path from 'path';

// 允许的文件类型
export const ALLOWED_FILE_TYPES = {
  // 图片
  'image/jpeg': { ext: ['.jpg', '.jpeg'], maxSize: 10 * 1024 * 1024 }, // 10MB
  'image/png': { ext: ['.png'], maxSize: 10 * 1024 * 1024 },
  'image/gif': { ext: ['.gif'], maxSize: 5 * 1024 * 1024 },
  'image/webp': { ext: ['.webp'], maxSize: 10 * 1024 * 1024 },
  'image/svg+xml': { ext: ['.svg'], maxSize: 2 * 1024 * 1024 },
  
  // 文档
  'application/pdf': { ext: ['.pdf'], maxSize: 50 * 1024 * 1024 }, // 50MB
  'application/msword': { ext: ['.doc'], maxSize: 20 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: ['.docx'], maxSize: 20 * 1024 * 1024 },
  'application/vnd.ms-excel': { ext: ['.xls'], maxSize: 20 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: ['.xlsx'], maxSize: 20 * 1024 * 1024 },
  'text/plain': { ext: ['.txt'], maxSize: 5 * 1024 * 1024 },
  
  // 视频
  'video/mp4': { ext: ['.mp4'], maxSize: 500 * 1024 * 1024 }, // 500MB
  'video/webm': { ext: ['.webm'], maxSize: 500 * 1024 * 1024 },
  'video/ogg': { ext: ['.ogv'], maxSize: 500 * 1024 * 1024 },
  'video/quicktime': { ext: ['.mov'], maxSize: 500 * 1024 * 1024 },
};

// 危险的文件扩展名（禁止上传）
const DANGEROUS_EXTENSIONS = [
  '.exe', '.dll', '.bat', '.cmd', '.sh', '.php', '.jsp', '.asp', '.aspx',
  '.py', '.rb', '.pl', '.cgi', '.jar', '.war', '.ear', '.class',
  '.js', '.vbs', '.wsf', '.hta', '.scr', '.pif', '.com', '.msi',
  '.ps1', '.psm1', '.psd1', '.ps1xml', '.pssc', '.psc1',
];

// 危险的 MIME 类型
const DANGEROUS_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-msdos-windows',
  'application/x-exe',
  'application/x-msi',
  'application/x-javascript',
  'text/javascript',
  'application/javascript',
  'application/x-php',
  'application/x-python-code',
  'application/x-python-bytecode',
  'application/x-ruby',
  'application/x-perl',
  'application/x-shellscript',
];

interface FileValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  extension?: string;
}

interface FileScanResult {
  safe: boolean;
  threats?: string[];
  details?: string;
}

/**
 * 获取文件的真实 MIME 类型
 * 通过读取文件头魔数来判断
 */
async function getRealMimeType(filePath: string): Promise<string | null> {
  try {
    const buffer = Buffer.alloc(8);
    const fileHandle = await fs.open(filePath, 'r');
    await fileHandle.read(buffer, 0, 8, 0);
    await fileHandle.close();
    
    // 魔数检测
    const magicNumbers: { [key: string]: number[] } = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      'image/gif': [0x47, 0x49, 0x46, 0x38], // GIF87a or GIF89a
      'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
      'image/svg+xml': [0x3C, 0x3F, 0x78, 0x6D, 0x6C], // <?xml
      'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
      'application/zip': [0x50, 0x4B, 0x03, 0x04], // PK (docx, xlsx are zip-based)
    };

    for (const [mime, magic] of Object.entries(magicNumbers)) {
      if (buffer.slice(0, magic.length).toString('hex') === Buffer.from(magic).toString('hex')) {
        return mime;
      }
    }

    // 检查 SVG（基于内容）
    const content = await fs.readFile(filePath, 'utf-8');
    if (content.trim().startsWith('<?xml') || content.trim().startsWith('<svg')) {
      return 'image/svg+xml';
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 验证文件类型
 */
export async function validateFileType(
  file: File,
  filePath?: string
): Promise<FileValidationResult> {
  const originalName = file.name;
  const extension = path.extname(originalName).toLowerCase();
  const declaredMimeType = file.type;

  // 1. 检查危险扩展名
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `禁止上传的文件类型: ${extension}`,
    };
  }

  // 2. 检查危险的 MIME 类型
  if (DANGEROUS_MIME_TYPES.includes(declaredMimeType)) {
    return {
      valid: false,
      error: `禁止上传的文件类型: ${declaredMimeType}`,
    };
  }

  // 3. 检查是否在允许列表中
  const allowedType = ALLOWED_FILE_TYPES[declaredMimeType as keyof typeof ALLOWED_FILE_TYPES];
  if (!allowedType) {
    return {
      valid: false,
      error: `不支持的文件类型: ${declaredMimeType || 'unknown'}`,
    };
  }

  // 4. 检查扩展名是否匹配
  if (!allowedType.ext.includes(extension)) {
    return {
      valid: false,
      error: `文件扩展名不匹配: ${extension} 不是 ${declaredMimeType} 的有效扩展名`,
    };
  }

  // 5. 检查文件大小
  if (file.size > allowedType.maxSize) {
    const maxSizeMB = allowedType.maxSize / 1024 / 1024;
    return {
      valid: false,
      error: `文件大小超过限制: ${maxSizeMB}MB`,
    };
  }

  // 6. 如果提供了文件路径，进行魔数校验
  if (filePath) {
    const realMimeType = await getRealMimeType(filePath);
    
    // 特殊处理：ZIP 格式的文件（docx, xlsx 等）
    if (realMimeType === 'application/zip') {
      // 检查是否是 Office 文档
      if (declaredMimeType.includes('officedocument') || declaredMimeType.includes('msword') || declaredMimeType.includes('ms-excel')) {
        // 允许 Office 文档
      } else {
        return {
          valid: false,
          error: '文件内容与实际类型不符（可能是伪装的压缩包）',
        };
      }
    } else if (realMimeType && realMimeType !== declaredMimeType) {
      // SVG 特殊处理
      if (realMimeType === 'image/svg+xml' && declaredMimeType.startsWith('image/')) {
        // 允许
      } else {
        return {
          valid: false,
          error: `文件内容与实际类型不符: 声明为 ${declaredMimeType}，实际为 ${realMimeType}`,
        };
      }
    }
  }

  return {
    valid: true,
    mimeType: declaredMimeType,
    extension,
  };
}

/**
 * 扫描文件内容（基础病毒扫描）
 * 检查是否包含恶意代码特征
 */
export async function scanFileContent(filePath: string, mimeType?: string): Promise<FileScanResult> {
  const threats: string[] = [];
  
  try {
    // 对于二进制文件（图片、视频、音频、PDF、Office 文档），跳过内容扫描
    // 这些文件天然是二进制格式，无法用 utf-8 读取
    if (!mimeType ||
        mimeType.startsWith('image/') ||
        mimeType.startsWith('video/') ||
        mimeType.startsWith('audio/') ||
        mimeType === 'application/pdf' ||
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/vnd.ms-excel' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'application/zip' ||
        mimeType === 'application/octet-stream') {
      return { safe: true, threats: [] };
    }

    // 读取文件内容（仅对文本文件）
    const content = await fs.readFile(filePath, 'utf-8');
    const lowerContent = content.toLowerCase();

    // 检查可疑的代码模式
    const suspiciousPatterns = [
      { pattern: /<script[^>]*>/i, desc: '包含脚本标签' },
      { pattern: /javascript:/i, desc: '包含 JavaScript 协议' },
      { pattern: /on\w+\s*=/i, desc: '包含事件处理器' },
      { pattern: /eval\s*\(/i, desc: '包含 eval 函数' },
      { pattern: /document\.write/i, desc: '包含 document.write' },
      { pattern: /innerHTML/i, desc: '包含 innerHTML' },
      { pattern: /<iframe/i, desc: '包含 iframe 标签' },
      { pattern: /<object/i, desc: '包含 object 标签' },
      { pattern: /<embed/i, desc: '包含 embed 标签' },
      { pattern: /base64,/i, desc: '包含 Base64 数据' },
      { pattern: /data:text\/html/i, desc: '包含 Data URI' },
      { pattern: /<%.*%>/, desc: '包含服务器端代码标记' },
      { pattern: /<?php/i, desc: '包含 PHP 代码' },
      { pattern: /import\s+\(/i, desc: '包含动态导入' },
      { pattern: /fetch\s*\(/i, desc: '包含 fetch 调用' },
      { pattern: /XMLHttpRequest/i, desc: '包含 AJAX 请求' },
    ];

    for (const { pattern, desc } of suspiciousPatterns) {
      if (pattern.test(content)) {
        threats.push(desc);
      }
    }

    // 检查是否包含可执行代码
    const executableSignatures = [
      'MZ', // Windows executable
      '\x7fELF', // Linux executable
      '#!/bin/bash',
      '#!/bin/sh',
      '#!/usr/bin/env',
      '<?php',
      '<%@',
    ];

    for (const sig of executableSignatures) {
      if (content.includes(sig)) {
        threats.push(`包含可执行代码签名: ${sig}`);
      }
    }

    // 检查文件是否包含过多的 null 字节（可能是二进制文件伪装）
    const nullByteCount = (content.match(/\x00/g) || []).length;
    if (nullByteCount > 10) {
      threats.push('包含异常的二进制数据');
    }

    return {
      safe: threats.length === 0,
      threats: threats.length > 0 ? threats : undefined,
      details: threats.length > 0 ? `发现 ${threats.length} 个潜在威胁` : '文件扫描通过',
    };
  } catch (error) {
    // 如果是二进制文件，无法读取为 UTF-8，这是正常的
    return {
      safe: true,
      details: '二进制文件，跳过内容扫描',
    };
  }
}

/**
 * 生成安全的文件名
 */
export function generateSafeFileName(originalName: string): string {
  const extension = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}${extension}`;
}

/**
 * 清理文件名中的危险字符
 */
export function sanitizeFileName(fileName: string): string {
  // 移除路径遍历字符
  let sanitized = fileName.replace(/\.\./g, '');
  // 移除控制字符
  sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, '');
  // 限制长度
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }
  return sanitized;
}

/**
 * 验证图片文件（额外检查）
 */
export async function validateImageFile(
  file: File,
  filePath: string
): Promise<FileValidationResult> {
  // 基础验证
  const baseValidation = await validateFileType(file, filePath);
  if (!baseValidation.valid) {
    return baseValidation;
  }

  // 确保是图片类型
  if (!baseValidation.mimeType?.startsWith('image/')) {
    return {
      valid: false,
      error: '文件不是有效的图片格式',
    };
  }

  // 检查图片尺寸（防止图片炸弹攻击）
  try {
    // 这里可以添加图片尺寸检查
    // 需要引入 sharp 等库
    // const metadata = await sharp(filePath).metadata();
    // if (metadata.width && metadata.height) {
    //   const pixelCount = metadata.width * metadata.height;
    //   if (pixelCount > 100_000_000) { // 1亿像素限制
    //     return { valid: false, error: '图片尺寸过大' };
    //   }
    // }
  } catch {
    // 如果无法读取图片元数据，继续处理
  }

  return baseValidation;
}

/**
 * 完整的文件安全检查流程
 */
export async function performSecurityCheck(
  file: File,
  filePath: string,
  options?: {
    allowedTypes?: string[];
    maxSize?: number;
    scanContent?: boolean;
  }
): Promise<{ success: boolean; error?: string; safeFileName?: string }> {
  // 1. 验证文件类型
  const typeValidation = await validateFileType(file, filePath);
  if (!typeValidation.valid) {
    return { success: false, error: typeValidation.error };
  }

  // 2. 检查特定类型限制
  if (options?.allowedTypes && !options.allowedTypes.includes(typeValidation.mimeType!)) {
    return {
      success: false,
      error: `只允许上传以下类型: ${options.allowedTypes.join(', ')}`,
    };
  }

  // 3. 检查自定义大小限制
  if (options?.maxSize && file.size > options.maxSize) {
    return {
      success: false,
      error: `文件大小超过限制: ${options.maxSize / 1024 / 1024}MB`,
    };
  }

  // 4. 内容扫描
  if (options?.scanContent !== false) {
    const scanResult = await scanFileContent(filePath, typeValidation.mimeType);
    if (!scanResult.safe) {
      return {
        success: false,
        error: `文件安全检测失败: ${scanResult.threats?.join(', ')}`,
      };
    }
  }

  // 5. 生成安全文件名
  const safeFileName = generateSafeFileName(file.name);

  return {
    success: true,
    safeFileName,
  };
}
