'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faShieldAlt,
  faClock,
  faEdit,
  faKey,
  faHistory,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface UserProfile {
  username: string;
  email: string | null;
  role: string;
  createdAt: string;
  lastLoginAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiClient.get<any>('/api/admin/profile');
      setProfile(data.profile);
    } catch (error) {
      logger.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: '超级管理员',
      editor: '编辑',
      reviewer: '审核员',
    };
    return roleMap[role] || '管理员';
  };

  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      editor: 'bg-blue-100 text-blue-700 border-blue-200',
      reviewer: 'bg-green-100 text-green-700 border-green-200',
    };
    return colorMap[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b71c1c]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">无法加载用户信息</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faUser} className="text-[#b71c1c]" />
          个人中心
        </h1>
        <p className="text-gray-500 mt-1">查看和管理您的账户信息</p>
      </div>

      {/* 用户信息卡片 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* 头像 */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#b71c1c] to-[#d32f2f] flex items-center justify-center text-white text-4xl font-bold">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* 基本信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.username}
              </h2>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(
                  profile.role
                )}`}
              >
                <FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4 mr-1" />
                {getRoleDisplay(profile.role)}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gray-400" />
                <span>{profile.email || '未设置邮箱'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-gray-400" />
                <span>注册时间：{new Date(profile.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-gray-400" />
                <span>
                  最后登录：
                  {profile.lastLoginAt
                    ? new Date(profile.lastLoginAt).toLocaleString('zh-CN')
                    : '暂无记录'}
                </span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex-shrink-0 space-y-2">
            <Link
              href="/admin/change-password"
              className="flex items-center gap-2 px-4 py-2 bg-[#b71c1c] text-white rounded-lg hover:bg-[#9a1818] transition-colors"
            >
              <FontAwesomeIcon icon={faKey} />
              修改密码
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FontAwesomeIcon icon={faUsers} />
              用户管理
            </Link>
            <Link
              href="/admin/operation-logs"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FontAwesomeIcon icon={faHistory} />
              操作日志
            </Link>
          </div>
        </div>
      </div>

      {/* 功能模块 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 账户安全 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldAlt} className="text-[#b71c1c]" />
            账户安全
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">登录密码</p>
                <p className="text-sm text-gray-500">定期修改密码可以提高账户安全性</p>
              </div>
              <Link
                href="/admin/change-password"
                className="text-[#b71c1c] hover:text-[#9a1818] font-medium"
              >
                修改
              </Link>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">操作日志</p>
                <p className="text-sm text-gray-500">查看您的所有操作记录</p>
              </div>
              <Link
                href="/admin/operation-logs"
                className="text-[#b71c1c] hover:text-[#9a1818] font-medium"
              >
                查看
              </Link>
            </div>
          </div>
        </div>

        {/* 权限说明 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldAlt} className="text-[#b71c1c]" />
            权限说明
          </h3>
          <div className="space-y-3">
            <div className={`p-3 rounded-lg ${getRoleColor(profile.role)}`}>
              <p className="font-medium">{getRoleDisplay(profile.role)}</p>
              <p className="text-sm mt-1">
                {profile.role === 'admin'
                  ? '拥有系统的所有权限，可以管理所有内容和用户'
                  : profile.role === 'editor'
                  ? '可以创建和编辑内容，但需要审核后才能发布'
                  : '负责审核内容，可以批准或拒绝发布请求'}
              </p>
            </div>
            {/* 超级管理员专属：用户管理入口 */}
            {(profile.role === 'admin' || profile.role === 'super_admin') && (
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-purple-900">用户管理</p>
                  <p className="text-sm text-purple-600">查看和管理系统用户账户</p>
                </div>
                <FontAwesomeIcon icon={faUsers} className="text-purple-500" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
