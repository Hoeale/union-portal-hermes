'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar, faTimes, faSpinner,
  faComments, faClock, faHourglassHalf, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

interface FeedbackStatsProps {
  onClose: () => void;
}

interface StatsData {
  total: number;
  unread: number;
  read: number;
  processing: number;
  resolved: number;
  byCategory: {
    suggestion: number;
    complaint: number;
    praise: number;
    question: number;
    uncategorized: number;
  };
  recentTrend: Array<{
    date: string;
    label: string;
    count: number;
  }>;
}

const CATEGORY_CONFIG = [
  { key: 'suggestion', label: '建议', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  { key: 'complaint', label: '投诉', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  { key: 'praise', label: '表扬', color: '#22c55e', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  { key: 'question', label: '咨询', color: '#a855f7', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
];

export default function FeedbackStats({ onClose }: FeedbackStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/feedback/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-12 text-center">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-gray-400" />
            <p className="mt-4 text-gray-500">加载统计数据中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const maxCategoryCount = Math.max(
    stats.byCategory.suggestion,
    stats.byCategory.complaint,
    stats.byCategory.praise,
    stats.byCategory.question,
    1
  );

  const maxTrendCount = Math.max(...stats.recentTrend.map(t => t.count), 1);

  // 简单 SVG 折线图
  const renderTrendChart = () => {
    const width = 500;
    const height = 120;
    const padding = 30;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = stats.recentTrend.map((item, index) => {
      const x = padding + (index / (stats.recentTrend.length - 1)) * chartWidth;
      const y = padding + chartHeight - (item.count / maxTrendCount) * chartHeight;
      return { x, y, ...item };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        {/* 背景网格 */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e5e7eb" strokeWidth="1" />
        <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
        <line x1={padding} y1={padding + chartHeight} x2={width - padding} y2={padding + chartHeight} stroke="#e5e7eb" strokeWidth="1" />

        {/* 面积 */}
        <path d={areaPath} fill="#b71c1c" opacity="0.1" />

        {/* 折线 */}
        <path d={linePath} fill="none" stroke="#b71c1c" strokeWidth="2" />

        {/* 数据点 */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#b71c1c" />
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fill="#6b7280">
              {p.count}
            </text>
            <text x={p.x} y={height - 5} textAnchor="middle" fontSize="9" fill="#9ca3af">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-10">
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faChartBar} className="text-[#b71c1c]" />
              反馈统计数据
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faComments} className="text-gray-500" />
                <span className="text-sm text-gray-600">总数</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faClock} className="text-red-500" />
                <span className="text-sm text-red-600">未读</span>
              </div>
              <div className="text-3xl font-bold text-red-700">{stats.unread}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faHourglassHalf} className="text-orange-500" />
                <span className="text-sm text-orange-600">处理中</span>
              </div>
              <div className="text-3xl font-bold text-orange-700">{stats.processing}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                <span className="text-sm text-green-600">已解决</span>
              </div>
              <div className="text-3xl font-bold text-green-700">{stats.resolved}</div>
            </div>
          </div>

          {/* Category Stats */}
          <div className="mb-8">
            <h4 className="text-base font-semibold text-gray-800 mb-4">分类统计</h4>
            <div className="space-y-3">
              {CATEGORY_CONFIG.map((cat) => {
                const count = stats.byCategory[cat.key as keyof typeof stats.byCategory];
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                const barWidth = maxCategoryCount > 0 ? (count / maxCategoryCount) * 100 : 0;

                return (
                  <div key={cat.key} className="flex items-center gap-4">
                    <span className={`w-16 text-sm ${cat.textColor} font-medium`}>{cat.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                    <span className="w-12 text-sm text-gray-600 text-right">{count}</span>
                    <span className="w-14 text-xs text-gray-400">{percentage.toFixed(1)}%</span>
                  </div>
                );
              })}
              {stats.byCategory.uncategorized > 0 && (
                <div className="flex items-center gap-4">
                  <span className="w-16 text-sm text-gray-500 font-medium">未分类</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-gray-400 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.byCategory.uncategorized / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-sm text-gray-600 text-right">{stats.byCategory.uncategorized}</span>
                  <span className="w-14 text-xs text-gray-400">
                    {stats.total > 0 ? ((stats.byCategory.uncategorized / stats.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Trend Chart */}
          <div>
            <h4 className="text-base font-semibold text-gray-800 mb-4">近7天趋势</h4>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              {renderTrendChart()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
