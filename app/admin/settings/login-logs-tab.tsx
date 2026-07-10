'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faTrash, faDownload, faSync } from '@fortawesome/free-solid-svg-icons';
import { LoginLog, VisitorLog, LogSubTabType } from '@/lib/types';
import { useCsrfToken, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

// IP 地址格式化
const formatIp = (ip: string): string => {
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1 (本机)';
  if (ip.startsWith('::ffff:')) return ip.substring(7);
  return ip;
};

// 解析浏览器和操作系统
const parseBrowser = (userAgent: string | null): string => {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
};

const parseOS = (userAgent: string | null): string => {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'MacOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return 'Other';
};

export default function LoginLogsTab() {
  const csrfToken = useCsrfToken();
  const [activeSubTab, setActiveSubTab] = useState<LogSubTabType>('admin');

  // 管理员登录日志状态
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [username, setUsername] = useState('');
  const [loginType, setLoginType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 游客访问日志状态
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [visitorLoading, setVisitorLoading] = useState(true);
  const [visitorPage, setVisitorPage] = useState(1);
  const [visitorTotal, setVisitorTotal] = useState(0);
  const [visitorTotalPages, setVisitorTotalPages] = useState(0);
  const [visitorIp, setVisitorIp] = useState('');

  const loadLogs = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p.toString(), pageSize: pageSize.toString() });
      if (username) params.append('username', username);
      if (loginType !== 'all') params.append('loginType', loginType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const result = await apiClient.get<any>(`/api/admin/login-logs?${params}`);
      if (result.success) { setLogs(result.data); setTotal(result.total); setTotalPages(result.totalPages); }
    } catch (error) { logger.error('Failed to fetch login logs:', error); }
    finally { setLoading(false); }
  };

  const loadVisitorLogs = async (p = visitorPage) => {
    setVisitorLoading(true);
    try {
      const params = new URLSearchParams({ page: p.toString(), pageSize: pageSize.toString() });
      if (visitorIp) params.append('ip', visitorIp);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const result = await apiClient.get<any>(`/api/admin/visitor-logs?${params}`);
      if (result.success) { setVisitorLogs(result.data); setVisitorTotal(result.total); setVisitorTotalPages(result.totalPages); }
    } catch (error) { logger.error('Failed to fetch visitor logs:', error); }
    finally { setVisitorLoading(false); }
  };

  // 初始加载两种日志的数量
  useEffect(() => {
    loadLogs();
    loadVisitorLogs();
  }, []);

  // 切换标签页或分页时加载数据
  useEffect(() => {
    if (activeSubTab === 'admin') {
      loadLogs();
    } else {
      loadVisitorLogs();
    }
  }, [page, visitorPage, activeSubTab]);

  const handleSearch = () => {
    if (activeSubTab === 'admin') {
      setPage(1); loadLogs(1);
    } else {
      setVisitorPage(1); loadVisitorLogs(1);
    }
  };
  const handleClear = () => {
    setUsername(''); setLoginType('all');
    setVisitorIp('');
    setStartDate(''); setEndDate('');
    setPage(1); setVisitorPage(1);
    if (activeSubTab === 'admin') {
      loadLogs(1);
    } else {
      loadVisitorLogs(1);
    }
  };

  const handleExport = async () => {
    try {
      if (activeSubTab === 'admin') {
        const params = new URLSearchParams({ page: '1', pageSize: '10000' });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const result = await apiClient.get<any>(`/api/admin/login-logs?${params}`);
        if (result.success) {
          const headers = ['序号', '用户名', 'IP地址', '操作系统', '浏览器', '登录类型', '登录时间'];
          const csvRows = [headers.join(',')];
          result.data.forEach((log: LoginLog, i: number) => {
            csvRows.push([i + 1, log.username, formatIp(log.ipAddress), log.os, log.browser, log.loginType === 'success' ? '成功' : '失败', new Date(log.loginAt).toLocaleString('zh-CN')].map(c => `"${c}"`).join(','));
          });
          const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `登录日志_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
        }
      } else {
        const params = new URLSearchParams({ page: '1', pageSize: '10000' });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (visitorIp) params.append('ip', visitorIp);
        const result = await apiClient.get<any>(`/api/admin/visitor-logs?${params}`);
        if (result.success) {
          const headers = ['序号', 'IP地址', '设备类型', '浏览器', '操作系统', '访问时间'];
          const csvRows = [headers.join(',')];
          result.data.forEach((log: VisitorLog, i: number) => {
            csvRows.push([i + 1, formatIp(log.ip), log.deviceType, parseBrowser(log.userAgent), parseOS(log.userAgent), new Date(log.createdAt).toLocaleString('zh-CN')].map(c => `"${c}"`).join(','));
          });
          const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `游客访问日志_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
        }
      }
    } catch (error) { logger.error('Failed to export:', error); }
  };

  const handleCleanOldLogs = async () => {
    if (!confirm('确定要清理90天前的旧日志吗？')) return;
    try {
      if (activeSubTab === 'admin') {
        const result = await apiClient.delete<any>('/api/admin/login-logs', { csrfToken });
        if (result.success) { alert(result.message); loadLogs(); }
      } else {
        const result = await apiClient.delete<any>('/api/admin/visitor-logs', { csrfToken });
        if (result.success) { alert(result.message); loadVisitorLogs(); }
      }
    } catch (error) { logger.error('Failed to clean old logs:', error); }
  };

  return (
    <div className="space-y-6">
      {/* 子标签页切换 */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveSubTab('admin')}
              className={`w-1/2 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeSubTab === 'admin'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              管理员登录
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{total}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('visitor')}
              className={`w-1/2 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeSubTab === 'visitor'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              游客访问
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{visitorTotal}</span>
            </button>
          </nav>
        </div>
      </div>

      {/* 筛选条件 */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeSubTab === 'admin' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="搜索用户名" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">登录类型</label>
              <select value={loginType} onChange={(e) => setLoginType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500">
                <option value="all">全部</option><option value="success">成功</option><option value="failed">失败</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IP 地址</label>
              <input type="text" value={visitorIp} onChange={(e) => setVisitorIp(e.target.value)} placeholder="搜索 IP 地址" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500" />
            </div>
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <button onClick={handleSearch} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"><FontAwesomeIcon icon={faSearch} className="mr-2" />搜索</button>
          <button onClick={handleClear} className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md"><FontAwesomeIcon icon={faFilter} className="mr-2" />清除筛选</button>
          <button onClick={handleExport} className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md"><FontAwesomeIcon icon={faDownload} className="mr-2" />导出CSV</button>
          <button onClick={handleCleanOldLogs} className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-md"><FontAwesomeIcon icon={faTrash} className="mr-2" />清理旧日志</button>
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {activeSubTab === 'admin' ? (
          loading ? (
            <div className="p-8 text-center"><FontAwesomeIcon icon={faSync} spin className="text-2xl text-gray-400" /><p className="mt-2 text-gray-600">加载中...</p></div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无日志数据</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">序号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP地址</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作系统</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">浏览器</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">登录类型</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">登录时间</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log, index) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(page - 1) * pageSize + index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatIp(log.ipAddress)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.os || 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.browser || 'Unknown'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.loginType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {log.loginType === 'success' ? '成功' : '失败'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.loginAt).toLocaleString('zh-CN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* 分页 */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-700">共 <span className="font-medium">{total}</span> 条记录，当前第 <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span> 页</p>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">上一页</button>
                    <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">下一页</button>
                  </nav>
                </div>
              </div>
            </>
          )
        ) : (
          visitorLoading ? (
            <div className="p-8 text-center"><FontAwesomeIcon icon={faSync} spin className="text-2xl text-gray-400" /><p className="mt-2 text-gray-600">加载中...</p></div>
          ) : visitorLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无游客访问记录</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">序号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP地址</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">设备类型</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">浏览器</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作系统</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">访问时间</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visitorLogs.map((log, index) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(visitorPage - 1) * pageSize + index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatIp(log.ip)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            log.deviceType === 'mobile' ? 'bg-blue-100 text-blue-800' :
                            log.deviceType === 'tablet' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.deviceType === 'mobile' ? '移动端' : log.deviceType === 'tablet' ? '平板' : 'PC'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parseBrowser(log.userAgent)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parseOS(log.userAgent)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.createdAt).toLocaleString('zh-CN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* 分页 */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-700">共 <span className="font-medium">{visitorTotal}</span> 条记录，当前第 <span className="font-medium">{visitorPage}</span> / <span className="font-medium">{visitorTotalPages}</span> 页</p>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button onClick={() => setVisitorPage(Math.max(1, visitorPage - 1))} disabled={visitorPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">上一页</button>
                    <button onClick={() => setVisitorPage(Math.min(visitorTotalPages, visitorPage + 1))} disabled={visitorPage === visitorTotalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">下一页</button>
                  </nav>
                </div>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
