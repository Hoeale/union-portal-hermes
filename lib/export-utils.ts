/**
 * 数据导出工具
 * 支持导出为 Excel 和 PDF 格式
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  formatter?: (value: any) => string;
}

interface ExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExportColumn[];
  data: any[];
}

/**
 * 导出数据到 Excel
 */
export function exportToExcel(options: ExportOptions): void {
  const { filename, sheetName = 'Sheet1', columns, data } = options;

  // 准备表头
  const headers = columns.map(col => col.header);

  // 准备数据
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      if (col.formatter) {
        return col.formatter(value);
      }
      return value ?? '';
    });
  });

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // 设置列宽
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  ws['!cols'] = colWidths;

  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // 导出文件
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * 导出数据到 PDF
 */
export function exportToPDF(options: ExportOptions): void {
  const { filename, columns, data } = options;

  // 创建 PDF 文档
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // 设置中文字体（使用系统默认字体）
  doc.setFont('helvetica');

  // 准备表头
  const headers = columns.map(col => col.header);

  // 准备数据
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      if (col.formatter) {
        return col.formatter(value);
      }
      return String(value ?? '');
    });
  });

  // 添加标题
  doc.setFontSize(16);
  doc.text(filename, 14, 20);

  // 添加表格
  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: 30,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: columns.reduce((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width };
      }
      return acc;
    }, {} as any),
  });

  // 添加页脚
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `第 ${i} 页 / 共 ${pageCount} 页`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `导出时间: ${new Date().toLocaleString('zh-CN')}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  // 保存文件
  doc.save(`${filename}.pdf`);
}

/**
 * 新闻导出配置
 */
export const newsExportColumns: ExportColumn[] = [
  { key: 'title', header: '标题', width: 40 },
  { key: 'category', header: '分类', width: 15 },
  { key: 'status', header: '状态', width: 12, formatter: (v) => v === 'published' ? '已发布' : '待审核' },
  { key: 'publishedAt', header: '发布时间', width: 20, formatter: (v) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
  { key: 'viewCount', header: '浏览量', width: 12 },
  { key: 'createdAt', header: '创建时间', width: 20, formatter: (v) => new Date(v).toLocaleString('zh-CN') },
];

/**
 * 政策导出配置
 */
export const policyExportColumns: ExportColumn[] = [
  { key: 'title', header: '标题', width: 40 },
  { key: 'category', header: '分类', width: 15 },
  { key: 'publishDate', header: '发布日期', width: 15 },
  { key: 'source', header: '来源', width: 20 },
  { key: 'status', header: '状态', width: 12, formatter: (v) => v === 'published' ? '已发布' : '待审核' },
  { key: 'downloadCount', header: '下载量', width: 12 },
  { key: 'createdAt', header: '创建时间', width: 20, formatter: (v) => new Date(v).toLocaleString('zh-CN') },
];

/**
 * 反馈导出配置
 */
export const feedbackExportColumns: ExportColumn[] = [
  { key: 'name', header: '姓名', width: 15 },
  { key: 'contact', header: '联系方式', width: 20 },
  { key: 'category', header: '类型', width: 12 },
  { key: 'content', header: '内容', width: 50 },
  { key: 'status', header: '状态', width: 12, formatter: (v) => {
    const statusMap: Record<string, string> = {
      unread: '未读',
      read: '已读',
      processing: '处理中',
      resolved: '已解决',
    };
    return statusMap[v] || v;
  }},
  { key: 'isPublic', header: '公开', width: 10, formatter: (v) => v ? '是' : '否' },
  { key: 'createdAt', header: '提交时间', width: 20, formatter: (v) => new Date(v).toLocaleString('zh-CN') },
];

/**
 * 通用导出函数
 */
export async function exportData(
  type: 'excel' | 'pdf',
  options: ExportOptions
): Promise<void> {
  if (type === 'excel') {
    exportToExcel(options);
  } else {
    exportToPDF(options);
  }
}

export type { ExportColumn, ExportOptions };
