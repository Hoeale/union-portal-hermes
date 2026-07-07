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
  bio: string | null;
  isActive: boolean;
}

export default function EditAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();
  const [id, setId] = useState<string>('');

  // 解析 params
  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    nickname: '',
    bio: '',
    isActive: true,
  });
  const [adminInfo, setAdminInfo] = useState<Admin | null>(null);

  // 获取管理员信息
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const result = await apiClient.get<any>(`/api/admin/users/${id}`);
        const admin = result.data;
        setAdminInfo(admin);
        setFormData({
          nickname: admin.nickname || '',
          bio: admin.bio || '',
          isActive: admin.isActive,
        });
      } catch (error) {
        logger.error('Failed to fetch admin:', error);
        showMessage('error', '获取管理员信息失败');
      } finally {
        setFetching(false);
      }
    };
    fetchAdmin();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.put(`/api/admin/users/${id}`, {
        nickname: formData.nickname || null,
        bio: formData.bio || null,
        isActive: formData.isActive,
      }, { csrfToken });

      showMessage('success', '管理员信息已更新');
      setTimeout(() => {
        router.push('/admin/users');
      }, 1000);
    } catch (error: any) {
      logger.error('Failed to update admin:', error);
      showMessage('error', error.response?.data?.error || '更新管理员失败');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!adminInfo) {
    return (
      <div className="text-center py-20 text-gray-500">
        管理员不存在或已被删除
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">编辑管理员</h1>
          <p className="text-gray-600 mt-1">修改管理员信息</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* 用户名 - 只读 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            用户名
          </label>
          <input
            type="text"
            disabled
            value={adminInfo.username}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
          />
          <p className="mt-1 text-sm text-gray-500">用户名不可修改</p>
        </div>

        {/* 角色 - 只读 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            角色
          </label>
          <input
            type="text"
            disabled
            value={adminInfo.role === 'super_admin' ? '超级管理员' : '管理员'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
          />
          <p className="mt-1 text-sm text-gray-500">角色不可修改</p>
        </div>

        {/* 状态 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            状态
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.isActive}
                onChange={() => setFormData({ ...formData, isActive: true })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2">启用</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={!formData.isActive}
                onChange={() => setFormData({ ...formData, isActive: false })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2">禁用</span>
            </label>
          </div>
        </div>

        {/* 昵称 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            昵称
          </label>
          <input
            type="text"
            maxLength={100}
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入昵称（可选）"
          />
        </div>

        {/* 简介 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            简介
          </label>
          <textarea
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入简介（可选）"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '保存中...' : '保存修改'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
