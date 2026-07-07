'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faNewspaper, faFileAlt, faVideo, faTasks,
  faComments, faChartLine
} from '@fortawesome/free-solid-svg-icons';

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

interface DashboardOverviewProps {
  contentStats: ContentStats;
  feedbackStats: FeedbackStats;
}

export default function DashboardOverview({ contentStats, feedbackStats }: DashboardOverviewProps) {
  const cards = [
    {
      title: '新闻总数',
      value: contentStats.news,
      icon: faNewspaper,
      color: 'blue',
      link: '/admin/news',
    },
    {
      title: '政策文件',
      value: contentStats.policies,
      icon: faFileAlt,
      color: 'green',
      link: '/admin/policies',
    },
    {
      title: '视频数量',
      value: contentStats.videos,
      icon: faVideo,
      color: 'purple',
      link: '/admin/videos',
    },
    {
      title: '服务模块',
      value: contentStats.services,
      icon: faTasks,
      color: 'orange',
      link: '/admin/services',
    },
    {
      title: '反馈总数',
      value: feedbackStats.total,
      icon: faComments,
      color: 'cyan',
      link: '/admin/feedback',
    },
    {
      title: '未读反馈',
      value: feedbackStats.unread,
      icon: faChartLine,
      color: feedbackStats.unread > 0 ? 'red' : 'gray',
      link: '/admin/feedback?filter=unread',
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-700' },
    green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-600', text: 'text-green-700' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-700' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', text: 'text-orange-700' },
    cyan: { bg: 'bg-cyan-50', icon: 'bg-cyan-100 text-cyan-600', text: 'text-cyan-700' },
    red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-600', text: 'text-red-700' },
    gray: { bg: 'bg-gray-50', icon: 'bg-gray-100 text-gray-600', text: 'text-gray-700' },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const colors = colorMap[card.color];
        return (
          <a
            key={card.title}
            href={card.link}
            className={`${colors.bg} rounded-xl p-6 hover:shadow-md transition-shadow block`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${colors.text}`}>{card.title}</p>
                <p className={`text-3xl font-bold ${colors.text} mt-2`}>{card.value}</p>
              </div>
              <div className={`p-4 rounded-lg ${colors.icon}`}>
                <FontAwesomeIcon icon={card.icon} className="text-2xl" />
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
