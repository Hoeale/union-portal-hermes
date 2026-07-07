'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye, faChartLine, faNewspaper
} from '@fortawesome/free-solid-svg-icons';

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

interface DashboardStatsProps {
  pageViewStats: PageViewStats;
  topNews: TopNews[];
}

export default function DashboardStats({ pageViewStats, topNews }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 访问统计 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faEye} className="text-[#b71c1c]" />
          访问统计
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">今日访问</p>
            <p className="text-xl font-bold text-blue-900 mt-1">{pageViewStats.todayViews}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600">本周访问</p>
            <p className="text-xl font-bold text-green-900 mt-1">{pageViewStats.weekViews}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-600">本月访问</p>
            <p className="text-xl font-bold text-purple-900 mt-1">{pageViewStats.monthViews}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-xs text-orange-600">总访问量</p>
            <p className="text-xl font-bold text-orange-900 mt-1">{pageViewStats.totalViews}</p>
          </div>
        </div>

        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">今日独立访客</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{pageViewStats.uniqueVisitors}</p>
          </div>
          <FontAwesomeIcon icon={faChartLine} className="text-2xl text-gray-300" />
        </div>
      </div>

      {/* 热门新闻 TOP 10 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faChartLine} className="text-[#b71c1c]" />
          热门新闻 TOP 10
        </h3>

        {topNews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FontAwesomeIcon icon={faNewspaper} className="text-3xl text-gray-300 mb-2" />
            <p>暂无数据</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {topNews.map((news, index) => (
              <div
                key={news.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : index === 1
                        ? 'bg-gray-200 text-gray-600'
                        : index === 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700 truncate">{news.title}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <FontAwesomeIcon icon={faEye} className="text-xs text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">{news.views}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
