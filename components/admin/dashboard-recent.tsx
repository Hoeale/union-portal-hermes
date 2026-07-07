'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faNewspaper, faFileAlt, faEdit, faCheckCircle, faClock
} from '@fortawesome/free-solid-svg-icons';

interface RecentContent {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface DashboardRecentProps {
  recentContent: RecentContent[];
}

export default function DashboardRecent({ recentContent }: DashboardRecentProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'published':
        return {
          label: '已发布',
          color: 'text-green-600',
          icon: faCheckCircle,
        };
      case 'pending':
        return {
          label: '待发布',
          color: 'text-orange-600',
          icon: faClock,
        };
      case 'draft':
        return {
          label: '草稿',
          color: 'text-gray-600',
          icon: faEdit,
        };
      default:
        return {
          label: status,
          color: 'text-gray-600',
          icon: faEdit,
        };
    }
  };

  const getTypeIcon = (id: string) => {
    // 简单判断：根据链接或其他逻辑判断类型
    // 这里简化处理，实际可以根据额外字段判断
    return faNewspaper;
  };

  if (recentContent.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">最近编辑</h3>
        <div className="text-center py-8 text-gray-500">
          <FontAwesomeIcon icon={faEdit} className="text-4xl mb-3 text-gray-300" />
          <p>暂无内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">最近编辑</h3>
        <Link href="/admin/news" className="text-sm text-blue-600 hover:text-blue-700">
          查看全部
        </Link>
      </div>

      <div className="space-y-3">
        {recentContent.map((item) => {
          const statusConfig = getStatusConfig(item.status);
          return (
            <Link
              key={item.id}
              href={`/admin/news/${item.id}/edit`}
              className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="mt-1">
                    <FontAwesomeIcon
                      icon={getTypeIcon(item.id)}
                      className="text-gray-400"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className={`inline-flex items-center text-xs ${statusConfig.color}`}>
                        <FontAwesomeIcon icon={statusConfig.icon} className="mr-1" />
                        {statusConfig.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
