'use client';

import { useState, useEffect } from 'react';
import DashboardOverview from '@/components/admin/dashboard-overview';
import DashboardTodo from '@/components/admin/dashboard-todo';
import DashboardQuickActions from '@/components/admin/dashboard-quick-actions';
import DashboardRecent from '@/components/admin/dashboard-recent';
import DashboardStats from '@/components/admin/dashboard-stats';
import { logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface TodoItem {
  id: string;
  title: string;
  count: number;
  link: string;
  priority: 'high' | 'medium' | 'low';
}

interface ContentStats {
  news: number;
  policies: number;
  videos: number;
  services: number;
}

interface FeedbackStats {
  total: number;
  unread: number;
}

interface RecentContent {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface PageViewStats {
  todayViews: number;
  weekViews: number;
  monthViews: number;
  totalViews: number;
  uniqueVisitors: number;
}

interface TopNews {
  id: string;
  title: string;
  views: number;
}

interface DashboardData {
  contentStats: ContentStats;
  feedbackStats: FeedbackStats;
  pageViewStats: PageViewStats;
  topNews: TopNews[];
  todos: TodoItem[];
  recentContent: RecentContent[];
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<any>('/api/admin/dashboard')
      .then((result) => {
        if (result.success) {
          setDashboardData(result.data);
        } else {
          setError(result.error || '获取数据失败');
        }
      })
      .catch((err) => {
        logger.error('Failed to fetch dashboard data:', err);
        setError('加载失败，请刷新重试');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          刷新页面
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">仪表盘</h2>
        <p className="text-gray-600 mt-1">欢迎来到工会门户管理系统</p>
      </div>

      {/* Overview Cards */}
      <DashboardOverview
        contentStats={dashboardData.contentStats}
        feedbackStats={dashboardData.feedbackStats}
      />

      {/* 访问统计 + 热门新闻 */}
      <DashboardStats
        pageViewStats={dashboardData.pageViewStats}
        topNews={dashboardData.topNews}
      />

      {/* Two Column Layout: Todos + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardTodo todos={dashboardData.todos} />
        <DashboardQuickActions />
      </div>

      {/* Recent Content */}
      <DashboardRecent recentContent={dashboardData.recentContent} />
    </div>
  );
}
