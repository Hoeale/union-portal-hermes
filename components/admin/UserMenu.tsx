'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faCog,
  faKey,
  faHistory,
  faSignOutAlt,
  faChevronDown,
  faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';

interface UserMenuProps {
  username: string;
  role?: string;
}

export default function UserMenu({ username, role = 'admin' }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC 键关闭菜单
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // 获取角色显示名称
  const getRoleDisplay = (role: string, username?: string) => {
    // admin 用户固定显示为超级管理员
    if (username === 'admin') return '超级管理员';
    const roleMap: Record<string, string> = {
      super_admin: '超级管理员',
      admin: '管理员',
      editor: '编辑',
      reviewer: '审核员',
    };
    return roleMap[role] || '管理员';
  };

  // 获取角色对应的颜色
  const getRoleColor = (role: string, username?: string) => {
    // admin 用户或 super_admin 角色显示红色
    if (username === 'admin' || role === 'super_admin') return 'bg-red-100 text-red-700';
    const colorMap: Record<string, string> = {
      admin: 'bg-blue-100 text-blue-700',
      editor: 'bg-green-100 text-green-700',
      reviewer: 'bg-purple-100 text-purple-700',
    };
    return colorMap[role] || 'bg-gray-100 text-gray-700';
  };

  // 获取CSRF token
  const getCsrfToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrf_token=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return '';
  };

  // 处理退出登录
  const handleLogout = async () => {
    try {
      const csrfToken = getCsrfToken() || '';
      await apiClient.post('/api/admin/logout', {}, { csrfToken });
    } catch (error) {
      logger.error('Logout failed:', error);
    } finally {
      router.push('/admin/login');
    }
  };

  const menuItems = [
    {
      label: '个人中心',
      href: '/admin/profile',
      icon: faUser,
      description: '查看和编辑个人信息',
    },
    {
      label: '修改密码',
      href: '/admin/change-password',
      icon: faKey,
      description: '修改登录密码',
    },
    {
      label: '操作日志',
      href: '/admin/operation-logs',
      icon: faHistory,
      description: '查看操作记录',
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
          isOpen
            ? 'bg-gray-100 text-gray-900'
            : 'hover:bg-gray-50 text-gray-700'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* 用户头像/标识 */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#b71c1c] to-[#d32f2f] flex items-center justify-center text-white font-medium text-sm">
          {username.charAt(0).toUpperCase()}
        </div>

        {/* 用户名和角色 */}
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900 leading-tight">
            {username}
          </span>
          <span className="text-xs text-gray-500 leading-tight">
            {getRoleDisplay(role, username)}
          </span>
        </div>

        {/* 下拉箭头 */}
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
        >
          {/* 用户信息头部 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#b71c1c] to-[#d32f2f] flex items-center justify-center text-white font-medium">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {username}
                </p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                    role, username
                  )}`}
                >
                  <FontAwesomeIcon icon={faShieldAlt} className="w-3 h-3 mr-1" />
                  {getRoleDisplay(role, username)}
                </span>
              </div>
            </div>
          </div>

          {/* 菜单项 */}
          <div className="py-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                role="menuitem"
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="block font-medium">{item.label}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* 分隔线 */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* 退出登录 */}
          <div className="px-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              role="menuitem"
            >
              <FontAwesomeIcon
                icon={faSignOutAlt}
                className="w-4 h-4 flex-shrink-0"
              />
              <span className="font-medium">退出登录</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
