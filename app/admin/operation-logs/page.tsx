'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faTrash, faDownload, faSync, faEye } from '@fortawesome/free-solid-svg-icons';
import { useCsrfToken, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface OperationLog {
  id: string;
  adminId: string;
  adminName: string;
  module: string;
  action: string;
  targetId: string | null;
  targetType: string | null;
  targetTitle: string | null;
  details: string | null;
  ipAddress: string;
  userAgent: string | null;
  os: string;
  browser: string;
  source: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  data: OperationLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 模块映射
const MODULE_MAP: Record<string, string> = {
  news: '新闻管理',
  policies: '政策文件',
  videos: '视频管理',
  services: '服务管理',
  workers: '最美劳动者',
  feedback: '留言管理',
  settings: '系统设置',
  media: '媒体管理',
  links: '友情链接',
  carousel: '轮播管理',
  about: '关于我们',
  'site-info': '网站信息',
  'news-categories': '新闻分类',
  drafts: '草稿管理',
  upload: '上传管理',
};

// 操作映射
const ACTION_MAP: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  publish: '发布',
  unpublish: '取消发布',
  login: '登录',
  logout: '登出',
  batch_action: '批量操作',
  import: '导入',
  export: '导出',
  reply: '回复',
  update_status: '更新状态',
};

// IP 地址格式化
const formatIp = (ip: string): string => {
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1 (本机)';
  if (ip.startsWith('::ffff:')) return ip.substring(7);
  return ip;
};

export default function OperationLogsPage() {
  const csrfToken = useCsrfToken();
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 筛选条件
  const [adminName, setAdminName] = useState('');
  const [module, setModule] = useState('all');
  const [action, setAction] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 详情弹窗
  const [selectedLog, setSelectedLog] = useState<OperationLog | null>(null);

  // 加载日志数据
  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (adminName) params.append('adminName', adminName);
      if (module !== 'all') params.append('module', module);
      if (action !== 'all') params.append('action', action);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const result: ApiResponse = await apiClient.get<ApiResponse>(`/api/admin/operation-logs?${params}`);

      if (result.success) {
        setLogs(result.data);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      logger.error('Failed to fetch operation logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  // 搜索
  const handleSearch = () => {
    setPage(1);
    loadLogs();
  };

  // 清除筛选
  const handleClear = () => {
    setAdminName('');
    setModule('all');
    setAction('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setTimeout(() => loadLogs(), 0);
  };

  // 导出 CSV
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '10000', // 获取所有数据
      });

      if (adminName) params.append('adminName', adminName);
      if (module !== 'all') params.append('module', module);
      if (action !== 'all') params.append('action', action);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const result: ApiResponse = await apiClient.get<ApiResponse>(`/api/admin/operation-logs?${params}`);

      if (result.success) {
        // 构建 CSV 内容
        const headers = ['序号', '操作人', '业务模块', '操作行为', '操作目标', '目标标题', 'IP地址', '操作系统', '浏览器', '日志来源', '操作时间'];
        const csvRows = [headers.join(',')];

        result.data.forEach((log, index) => {
          const row = [
            index + 1,
            log.adminName,
            MODULE_MAP[log.module] || log.module,
            ACTION_MAP[log.action] || log.action,
            log.targetId || '-',
            log.targetTitle || '-',
            log.ipAddress,
            log.os || 'Unknown',
            log.browser || 'Unknown',
            log.source,
            new Date(log.createdAt).toLocaleString('zh-CN'),
          ];
          csvRows.push(row.map(cell => `"${cell}"`).join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `操作日志_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      logger.error('Failed to export:', error);
    }
  };

  // 清理旧日志
  const handleCleanOldLogs = async () => {
    if (!confirm('确定要清理90天前的旧日志吗？')) {
      return;
    }

    try {
      await apiClient.delete('/api/admin/operation-logs', { csrfToken });
      alert('清理成功');
      loadLogs();
    } catch (error) {
      logger.error('Failed to clean old logs:', error);
    }
  };

  // 查看详情
  const handleViewDetails = (log: OperationLog) => {
    setSelectedLog(log);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">操作日志</h1>
          <p className="mt-2 text-sm text-gray-600">追踪所有后台管理操作记录</p>
        </div>

        {/* 筛选条件 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">操作人</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="搜索操作人"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">业务模块</label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全部</option>
                {Object.entries(MODULE_MAP).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">操作行为</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全部</option>
                {Object.entries(ACTION_MAP).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSearch}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FontAwesomeIcon icon={faSearch} className="mr-2" />
              搜索
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FontAwesomeIcon icon={faFilter} className="mr-2" />
              清除筛选
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              导出CSV
            </button>
            <button
              onClick={handleCleanOldLogs}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FontAwesomeIcon icon={faTrash} className="mr-2" />
              清理旧日志
            </button>
          </div>
        </div>

        {/* 表格 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <FontAwesomeIcon icon={faSync} spin className="text-2xl text-gray-400" />
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无日志数据</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">序号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">业务模块</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作行为</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户端信息</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日志来源</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">详情</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log, index) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(page - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.adminName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {MODULE_MAP[log.module] || log.module}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.action === 'delete' ? 'bg-red-100 text-red-800' :
                              log.action === 'create' ? 'bg-green-100 text-green-800' :
                              log.action === 'update' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {ACTION_MAP[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{formatIp(log.ipAddress)}</div>
                          <div className="text-xs text-gray-400">{log.os} / {log.browser}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.createdAt).toLocaleString('zh-CN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleViewDetails(log)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      共 <span className="font-medium">{total}</span> 条记录，当前第{' '}
                      <span className="font-medium">{page}</span> /{' '}
                      <span className="font-medium">{totalPages}</span> 页
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        上一页
                      </button>
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        下一页
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 详情弹窗 */}
        {selectedLog && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">操作详情</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">操作人</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.adminName}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">业务模块</label>
                    <p className="mt-1 text-sm text-gray-900">{MODULE_MAP[selectedLog.module] || selectedLog.module}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">操作行为</label>
                    <p className="mt-1 text-sm text-gray-900">{ACTION_MAP[selectedLog.action] || selectedLog.action}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">操作目标</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.targetTitle || '-'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">客户端信息</label>
                    <p className="mt-1 text-sm text-gray-900">{formatIp(selectedLog.ipAddress)}</p>
                    <p className="text-xs text-gray-500">{selectedLog.os} / {selectedLog.browser}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">操作时间</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedLog.createdAt).toLocaleString('zh-CN')}</p>
                  </div>
                  
                  {selectedLog.details && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">操作详情</label>
                      <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-x-auto">
                        {(() => {
                          try {
                            const details = JSON.parse(selectedLog.details);
                            return JSON.stringify(details, null, 2);
                          } catch {
                            return selectedLog.details;
                          }
                        })()}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
