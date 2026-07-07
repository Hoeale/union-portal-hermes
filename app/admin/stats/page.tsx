'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faNewspaper, faFileAlt, faVideo, faTools,
  faComments, faEye, faChartLine, faCalendarAlt,
  faSpinner, faArrowUp, faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import { logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface StatsOverview {
  contentStats: {
    news: number;
    policies: number;
    videos: number;
    services: number;
  };
  feedbackStats: {
    total: number;
    unread: number;
  };
  pageViewStats: {
    todayViews: number;
    weekViews: number;
    monthViews: number;
    totalViews: number;
    uniqueVisitors: number;
  };
  topNews: Array<{
    id: string;
    title: string;
    views: number;
  }>;
}

interface DailyViewData {
  date: string;
  views: number;
  visitors: number;
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');
  const [dailyViews, setDailyViews] = useState<DailyViewData[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<any>('/api/admin/stats/overview');
      const d = result.data;
      // 映射API响应到前端接口
      setStats({
        contentStats: d.content,
        feedbackStats: d.feedback,
        pageViewStats: {
          todayViews: d.pageViews?.total ?? 0,
          weekViews: d.pageViews?.total ?? 0,
          monthViews: d.pageViews?.total ?? 0,
          totalViews: d.pageViews?.total ?? 0,
          uniqueVisitors: 0,
        },
        topNews: d.topContent ?? [],
      });
    } catch (error) {
      logger.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-gray-400" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-12 text-center text-gray-500">
        加载统计数据失败，请刷新重试
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">统计分析</h1>
          <p className="mt-1 text-sm text-gray-500">
            查看网站内容统计和访问数据分析
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              timeRange === 'today'
                ? 'bg-[hsl(var(--primary))] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            今日
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              timeRange === 'week'
                ? 'bg-[hsl(var(--primary))] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            本周
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              timeRange === 'month'
                ? 'bg-[hsl(var(--primary))] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            本月
          </button>
        </div>
      </div>

      {/* Content Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* News */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">新闻总数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.contentStats.news}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FontAwesomeIcon icon={faNewspaper} className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">政策文件</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.contentStats.policies}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FontAwesomeIcon icon={faFileAlt} className="text-2xl text-green-600" />
            </div>
          </div>
        </div>

        {/* Videos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">视频数量</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.contentStats.videos}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FontAwesomeIcon icon={faVideo} className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">服务模块</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.contentStats.services}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FontAwesomeIcon icon={faTools} className="text-2xl text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Page View Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faEye} className="text-[hsl(var(--primary))]" />
          访问统计
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">今日访问</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.pageViewStats.todayViews}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">本周访问</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.pageViewStats.weekViews}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">本月访问</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.pageViewStats.monthViews}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">总访问量</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.pageViewStats.totalViews}</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800">独立访客数</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.pageViewStats.uniqueVisitors}</p>
            </div>
            <FontAwesomeIcon icon={faChartLine} className="text-3xl text-blue-300" />
          </div>
        </div>
      </div>

      {/* Feedback Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faComments} className="text-[hsl(var(--primary))]" />
          反馈统计
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">反馈总数</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.feedbackStats.total}</p>
          </div>
          <div className={`p-4 rounded-lg ${stats.feedbackStats.unread > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className={`text-sm ${stats.feedbackStats.unread > 0 ? 'text-red-600' : 'text-gray-500'}`}>
              未读反馈
            </p>
            <p className={`text-xl font-bold mt-1 ${stats.feedbackStats.unread > 0 ? 'text-red-700' : 'text-gray-900'}`}>
              {stats.feedbackStats.unread}
            </p>
          </div>
        </div>

        {stats.feedbackStats.unread > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              有 {stats.feedbackStats.unread} 条未读反馈需要处理
            </p>
          </div>
        )}
      </div>

      {/* Top News by Views */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faChartLine} className="text-[hsl(var(--primary))]" />
          热门新闻 TOP 10
        </h2>

        {stats.topNews.length === 0 ? (
          <p className="text-center text-gray-500 py-8">暂无数据</p>
        ) : (
          <div className="space-y-3">
            {stats.topNews.map((news, index) => (
              <div
                key={news.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : index === 1
                        ? 'bg-gray-100 text-gray-600'
                        : index === 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{news.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faEye} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">{news.views}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <FontAwesomeIcon icon={faCalendarAlt} />
          数据管理
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={fetchStats}
            className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors text-left"
          >
            <p className="text-sm font-medium text-gray-900">刷新数据</p>
            <p className="text-xs text-gray-500 mt-1">获取最新统计数据</p>
          </button>
          <button
            onClick={() => {
              if (confirm('确定要清空访问记录吗？此操作不可恢复。')) {
                // TODO: Implement clear page views
                alert('功能开发中...');
              }
            }}
            className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors text-left"
          >
            <p className="text-sm font-medium text-gray-900">清空访问记录</p>
            <p className="text-xs text-gray-500 mt-1">重置页面浏览统计</p>
          </button>
          <button
            onClick={() => {
              // TODO: Export stats
              alert('功能开发中...');
            }}
            className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors text-left"
          >
            <p className="text-sm font-medium text-gray-900">导出数据</p>
            <p className="text-xs text-gray-500 mt-1">下载统计报表 (Excel)</p>
          </button>
        </div>
      </div>
    </div>
  );
}
