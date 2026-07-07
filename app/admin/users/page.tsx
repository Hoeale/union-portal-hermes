'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCsrfToken, useMessage } from '@/hooks';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';

interface Admin {
  id: string;
  username: string;
  role: string;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState<{role: string; username: string}>({role: 'admin', username: ''});
  const pageSize = 20;

  // 是否是超级管理员（role为super_admin或用户名为admin）
  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.username === 'admin';

  // 获取当前用户角色
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await apiClient.get('/api/admin/check-auth') as { data: { admin?: { role: string; username: string } } };
        setCurrentUser({
          role: data?.admin?.role || 'admin',
          username: data?.admin?.username || '',
        });
      } catch (error) {
        logger.error('Failed to fetch current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // 获取管理员列表
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
      });

      const result = await apiClient.get<any>(`/api/admin/users?${params}`);
      setAdmins(result.data || []);
      setTotal(result.meta?.total || 0);
    } catch (error) {
      logger.error('Failed to fetch admins:', error);
      showMessage('error', '获取管理员列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [page, search]);

  // 删除管理员
  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`确定要删除管理员 "${username}" 吗？`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/admin/users/${id}`, { csrfToken });
      showMessage('success', '管理员已删除');
      fetchAdmins();
    } catch (error) {
      logger.error('Failed to delete admin:', error);
      showMessage('error', '删除管理员失败');
    }
  };

  // 切换状态
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.put(
        `/api/admin/users/${id}`,
        { isActive: !currentStatus },
        { csrfToken }
      );
      showMessage('success', '状态已更新');
      fetchAdmins();
    } catch (error) {
      logger.error('Failed to toggle status:', error);
      showMessage('error', '更新状态失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-600 mt-1">管理系统的所有用户账户</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => router.push('/admin/users/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 新增用户
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="搜索用户名或昵称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => fetchAdmins()}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            搜索
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : admins.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            暂无管理员数据
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">昵称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最后登录</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{admin.username}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{admin.nickname || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        admin.role === 'super_admin' || admin.username === 'admin'
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {admin.role === 'super_admin' || admin.username === 'admin' ? '超级管理员' : '管理员'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isSuperAdmin ? (
                        <button
                          onClick={() => handleToggleStatus(admin.id, admin.isActive)}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            admin.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {admin.isActive ? '启用' : '禁用'}
                        </button>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          admin.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {admin.isActive ? '启用' : '禁用'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString('zh-CN') : '从未登录'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {isSuperAdmin ? (
                          <>
                            <button
                              onClick={() => router.push(`/admin/users/${admin.id}/edit`)}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDelete(admin.id, admin.username)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              删除
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">无操作权限</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  共 {total} 条记录，第 {page} / {totalPages} 页
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
