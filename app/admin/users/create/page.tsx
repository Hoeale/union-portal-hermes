'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCsrfToken, useMessage } from '@/hooks';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';

export default function CreateAdminPage() {
  const router = useRouter();
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    nickname: '',
    bio: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    if (formData.password !== formData.confirmPassword) {
      showMessage('error', '两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      showMessage('error', '密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/api/admin/users', {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        nickname: formData.nickname || null,
        bio: formData.bio || null,
      }, { csrfToken });

      showMessage('success', '管理员创建成功');
      setTimeout(() => {
        router.push('/admin/users');
      }, 1000);
    } catch (error: any) {
      logger.error('Failed to create admin:', error);
      showMessage('error', error.response?.data?.error || '创建管理员失败');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">新增管理员</h1>
          <p className="text-gray-600 mt-1">创建新的管理员账户</p>
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
        {/* 用户名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            用户名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={50}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入用户名"
          />
          <p className="mt-1 text-sm text-gray-500">3-50个字符，创建后不可修改</p>
        </div>

        {/* 密码 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            密码 <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入密码"
          />
          <p className="mt-1 text-sm text-gray-500">至少6个字符</p>
        </div>

        {/* 确认密码 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            确认密码 <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请再次输入密码"
          />
        </div>

        {/* 角色 - 固定为管理员，不可选择超级管理员 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            角色
          </label>
          <input
            type="text"
            disabled
            value="管理员"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
          />
          <p className="mt-1 text-sm text-gray-500">
            仅可创建普通管理员账户
          </p>
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
            {loading ? '创建中...' : '创建管理员'}
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
