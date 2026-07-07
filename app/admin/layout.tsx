'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNewspaper, faLink, faChartBar, faBars, faTimes, faSignOutAlt, faExternalLinkAlt, faInfoCircle, faTasks, faFileAlt, faUsers, faImages, faVideo, faBuilding, faHome, faComments, faFileArchive, faCircle, faCog, faDatabase, faBell, faTachometerAlt, faPhotoVideo, faUserShield } from '@fortawesome/free-solid-svg-icons';
import NotificationBell from '@/components/admin/notification-bell';
import UserMenu from '@/components/admin/UserMenu';
import ErrorBoundary from '@/components/error-boundary';
import { logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<{ username: string; role: string } | null>(null);

  // 登录页不显示侧边栏
  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 路由变化时关闭侧边栏
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // 检查认证状态
  useEffect(() => {
    const checkAuth = async () => {
      // 登录页不需要检查认证
      if (isLoginPage) {
        setIsAuthenticated(true);
        return;
      }

      try {
        const response = await fetch('/api/admin/check-auth', {
          credentials: 'include', // 发送 session cookie
        });
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUserInfo({
            username: data.admin?.username || '管理员',
            role: data.admin?.role || 'admin',
          });
        } else {
          setIsAuthenticated(false);
          router.push('/admin/login');
        }
      } catch (error) {
        logger.error('Auth check failed:', error);
        setIsAuthenticated(false);
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [isLoginPage, router]);

  // 获取未读留言数量
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/admin/feedback/unread-count', {
        credentials: 'include', // 发送 session cookie
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      logger.error('Failed to fetch unread count:', error);
    }
  };

  const navigation = [
    { name: '仪表板', href: '/admin', icon: faChartBar },
    { name: '工会概况', href: '/admin/about', icon: faInfoCircle },
    { name: '新闻管理', href: '/admin/news', icon: faNewspaper },
    { name: '办事服务', href: '/admin/services', icon: faTasks },
    { name: '政策文件', href: '/admin/policies', icon: faFileAlt },
    { name: '最美劳动者', href: '/admin/workers', icon: faUsers },
    { name: '页脚管理', href: '/admin/footer', icon: faBuilding },
    { name: '首页内容', href: '/admin/v2-content', icon: faHome },
    { name: '留言建议', href: '/admin/feedback', icon: faComments, badge: unreadCount },
    { name: '系统设置', href: '/admin/settings', icon: faCog },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  // 登录页直接渲染子组件，不显示侧边栏
  if (isLoginPage) {
    return <>{children}</>;
  }

  // 认证检查中显示加载状态
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b71c1c] mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 未认证不渲染内容（会被重定向）
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b71c1c] mx-auto mb-4"></div>
          <p className="text-gray-600">正在跳转登录页面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Mobile sidebar backdrop - 仅在移动端且菜单打开时显示 */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#1e2b3c] to-[#141d29] shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-lg font-bold text-white block">
                  管理后台
                </span>
                <span className="text-xs text-gray-400">
                  工会门户系统
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
              aria-label="关闭菜单"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  isActive(item.href)
                    ? 'bg-[#b71c1c] text-white shadow-lg'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={item.icon} className={`w-5 mr-3 ${isActive(item.href) ? '' : 'text-gray-400'}`} />
                  {item.name}
                </div>
                {'badge' in item && (item as any).badge > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">
                    {(item as any).badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/10">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-4 py-3 mb-3 text-sm font-medium text-gray-300 bg-white/5 rounded-xl hover:bg-white/10 hover:text-white transition-all"
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} className="w-4 mr-2" />
              访问网站
            </a>
            <button
              onClick={async () => {
                try {
                  // 从 cookie 获取 CSRF token
                  const getCookie = (name: string) => {
                    const value = `; ${document.cookie}`;
                    const parts = value.split(`; ${name}=`);
                    if (parts.length === 2) return parts.pop()?.split(';').shift();
                    return undefined;
                  };
                  const csrfToken = getCookie('csrf_token') || '';
                  await apiClient.post('/api/admin/logout', {}, { csrfToken });
                } catch (error) {
                  logger.error('Logout failed:', error);
                } finally {
                  // 无论成功与否都跳转到登录页
                  router.push('/admin/login');
                }
              }}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="w-5 mr-2" />
              退出登录
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 lg:px-8 bg-white border-b border-gray-200">
          <button
            type="button"
            className="lg:hidden text-gray-400 hover:text-gray-600 mr-4"
            onClick={() => setSidebarOpen(true)}
            aria-label="打开菜单"
          >
            <FontAwesomeIcon icon={faBars} className="text-xl" />
          </button>
          <div className="flex-1 flex justify-between items-center">
            <h1 className="text-lg font-bold text-[#1e2b3c]">
              {navigation.find((item) => isActive(item.href))?.name || '管理后台'}
            </h1>
            <div className="flex items-center gap-3">
              {/* 通知铃铛 */}
              <NotificationBell />
              {/* 用户菜单 */}
              {userInfo && (
                <UserMenu username={userInfo.username} role={userInfo.role} />
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
