'use client';

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useCsrfToken } from '@/hooks';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'news' | 'policy';
  onImportSuccess: () => void;
  // 导出筛选条件
  exportFilters?: {
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  };
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  total: number;
  successCount: number;
  failCount: number;
  status: 'success' | 'partial' | 'failed';
  errors: ValidationError[];
}

type ModalTab = 'import' | 'export';

export default function ImportExportModal({
  isOpen,
  onClose,
  type,
  onImportSuccess,
  exportFilters = {},
}: ImportExportModalProps) {
  const csrfToken = useCsrfToken();
  const [activeTab, setActiveTab] = useState<ModalTab>('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // 生成模板下载
  const handleDownloadTemplate = useCallback(() => {
    const workbook = XLSX.utils.book_new();

    let headers: string[];
    let exampleData: any[][];

    if (type === 'news') {
      headers = ['title', 'category', 'content', 'status'];
      exampleData = [
        headers,
        ['工会举办迎新春活动', '动态', '<p>活动内容详情...</p>', 'pending'],
        ['关于春节放假的通知', '通知', '<p>放假安排...</p>', 'published'],
        ['工会换届选举公告', '公告', '<p>选举流程...</p>', 'pending'],
      ];
    } else {
      headers = ['title', 'category', 'publishDate', 'source', 'content', 'status'];
      exampleData = [
        headers,
        ['西安市总工会政策文件', '劳动保障', '2024-01-15', '西安市总工会', '<p>政策内容...</p>', 'pending'],
        ['高新区补贴政策', '补贴政策', '2024-02-01', '高新区管委会', '<p>补贴详情...</p>', 'published'],
      ];
    }

    const worksheet = XLSX.utils.aoa_to_sheet(exampleData);

    // 设置列宽
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));

    XLSX.utils.book_append_sheet(workbook, worksheet, '模板');

    // 下载
    const fileName = type === 'news' ? '新闻导入模板.xlsx' : '政策导入模板.xlsx';
    XLSX.writeFile(workbook, fileName);
  }, [type]);

  // 处理文件选择
  const handleFileSelect = useCallback(
    (file: File) => {
      // 验证文件类型
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      if (
        !validTypes.includes(file.type) &&
        !file.name.endsWith('.xlsx') &&
        !file.name.endsWith('.xls')
      ) {
        alert('请上传Excel文件 (.xlsx 或 .xls)');
        return;
      }

      setSelectedFile(file);
      setImportResult(null);

      // 读取预览数据
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          // 只显示前10行预览
          setPreviewData(jsonData.slice(0, 10));
        } catch (error) {
          console.error('Failed to read file:', error);
          alert('文件读取失败，请检查文件格式');
        }
      };
      reader.readAsArrayBuffer(file);
    },
    []
  );

  // 处理拖放
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // 处理导入
  const handleImport = useCallback(async () => {
    if (!selectedFile) {
      alert('请先选择文件');
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const apiEndpoint =
        type === 'news' ? '/api/admin/news/import' : '/api/admin/policies/import';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult(result);
        if (result.success) {
          onImportSuccess();
        }
      } else {
        alert(result.error || '导入失败');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  }, [selectedFile, type, onImportSuccess]);

  // 处理导出
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (exportFilters.category) params.append('category', exportFilters.category);
      if (exportFilters.status) params.append('status', exportFilters.status);
      if (exportFilters.startDate) params.append('startDate', exportFilters.startDate);
      if (exportFilters.endDate) params.append('endDate', exportFilters.endDate);

      const apiEndpoint =
        type === 'news'
          ? `/api/admin/news/export?${params}`
          : `/api/admin/policies/export?${params}`;

      const response = await fetch(apiEndpoint);

      if (response.ok) {
        // 下载文件
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // 从 Content-Disposition 头获取文件名
        const disposition = response.headers.get('Content-Disposition');
        let fileName = type === 'news' ? '新闻导出.xlsx' : '政策导出.xlsx';
        if (disposition) {
          const match = disposition.match(/filename="?(.+)"?/);
          if (match) {
            fileName = decodeURIComponent(match[1]);
          }
        }

        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const result = await response.json();
        alert(result.error || '导出失败');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  }, [type, exportFilters]);

  // 重置状态
  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setPreviewData([]);
    setImportResult(null);
    setActiveTab('import');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const title = type === 'news' ? '新闻' : '政策';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* 背景遮罩 */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-900/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* 弹窗内容 */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
          {/* 头部 */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {title}导入/导出
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 标签页切换 */}
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => setActiveTab('import')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'import'
                    ? 'bg-[#b71c1c] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="inline-block h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                导入
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'export'
                    ? 'bg-[#b71c1c] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="inline-block h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'import' ? (
              <div className="space-y-6">
                {/* 下载模板按钮 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-blue-800 font-medium">
                        请先下载模板，按模板格式填写数据
                      </span>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      下载模板
                    </button>
                  </div>
                </div>

                {/* 文件上传区域 */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragOver
                      ? 'border-[#b71c1c] bg-red-50'
                      : selectedFile
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div>
                      <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="mt-3 text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewData([]);
                          setImportResult(null);
                        }}
                        className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        移除文件
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3" />
                      </svg>
                      <p className="mt-3 text-sm text-gray-600">
                        拖拽文件到此处，或
                      </p>
                      <label className="mt-3 inline-flex items-center px-4 py-2 bg-[#b71c1c] text-white text-sm font-semibold rounded-lg hover:bg-[#8b0000] transition-colors cursor-pointer">
                        选择文件
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                          }}
                        />
                      </label>
                      <p className="mt-2 text-xs text-gray-500">支持 .xlsx, .xls 格式</p>
                    </>
                  )}
                </div>

                {/* 预览数据 */}
                {previewData.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      数据预览（前10行）
                    </h4>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(previewData[0]).map((key) => (
                              <th
                                key={key}
                                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              {Object.values(row).map((value: any, i) => (
                                <td key={i} className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      共 {previewData.length} 行预览数据
                    </p>
                  </div>
                )}

                {/* 导入结果 */}
                {importResult && (
                  <div
                    className={`rounded-lg p-4 border ${
                      importResult.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : importResult.status === 'partial'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      {importResult.status === 'success' ? (
                        <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : importResult.status === 'partial' ? (
                        <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <h4 className="text-sm font-semibold">
                        导入{importResult.status === 'success' ? '成功' : importResult.status === 'partial' ? '部分成功' : '失败'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{importResult.total}</div>
                        <div className="text-xs text-gray-600">总行数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{importResult.successCount}</div>
                        <div className="text-xs text-gray-600">成功</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{importResult.failCount}</div>
                        <div className="text-xs text-gray-600">失败</div>
                      </div>
                    </div>

                    {/* 错误详情 */}
                    {importResult.errors.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">错误详情：</h5>
                        <div className="max-h-48 overflow-y-auto bg-white rounded border border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">行号</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">字段</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">错误信息</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {importResult.errors.slice(0, 20).map((error, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-sm text-gray-900">{error.row}</td>
                                  <td className="px-3 py-2 text-sm font-medium text-gray-700">{error.field}</td>
                                  <td className="px-3 py-2 text-sm text-red-600">{error.message}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {importResult.errors.length > 20 && (
                            <div className="px-3 py-2 text-xs text-gray-500 text-center bg-gray-50">
                              仅显示前20条错误，共 {importResult.errors.length} 条
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* 导出标签页 */
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-green-800">
                      将根据当前筛选条件导出{title}数据为Excel文件
                    </span>
                  </div>
                </div>

                {/* 导出条件预览 */}
                {(exportFilters.category || exportFilters.status || exportFilters.startDate || exportFilters.endDate) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">当前筛选条件：</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {exportFilters.category && (
                        <div>
                          <span className="text-xs text-gray-500">分类：</span>
                          <span className="text-sm font-medium">{exportFilters.category}</span>
                        </div>
                      )}
                      {exportFilters.status && (
                        <div>
                          <span className="text-xs text-gray-500">状态：</span>
                          <span className="text-sm font-medium">
                            {exportFilters.status === 'published' ? '已发布' : '待发布'}
                          </span>
                        </div>
                      )}
                      {exportFilters.startDate && (
                        <div>
                          <span className="text-xs text-gray-500">开始日期：</span>
                          <span className="text-sm font-medium">{exportFilters.startDate}</span>
                        </div>
                      )}
                      {exportFilters.endDate && (
                        <div>
                          <span className="text-xs text-gray-500">结束日期：</span>
                          <span className="text-sm font-medium">{exportFilters.endDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!exportFilters.category && !exportFilters.status && !exportFilters.startDate && !exportFilters.endDate && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-sm text-yellow-800">
                        未设置筛选条件，将导出所有{title}数据
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="bg-gray-50 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse gap-3">
            {activeTab === 'import' ? (
              <>
                <button
                  onClick={handleImport}
                  disabled={!selectedFile || importing}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-transparent shadow-sm px-8 py-3 bg-[#b71c1c] text-base font-semibold text-white hover:bg-[#8b0000] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {importing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      导入中...
                    </>
                  ) : (
                    '开始导入'
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-8 py-3 bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
                >
                  关闭
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-transparent shadow-sm px-8 py-3 bg-[#b71c1c] text-base font-semibold text-white hover:bg-[#8b0000] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {exporting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      导出中...
                    </>
                  ) : (
                    '开始导出'
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-8 py-3 bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
                >
                  关闭
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
