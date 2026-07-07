'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faImage, faComments, faBell, faCog,
  faNewspaper, faFileAlt, faVideo, faChartBar
} from '@fortawesome/free-solid-svg-icons';

interface QuickAction {
  title: string;
  href: string;
  icon: any;
  color: string;
  hoverColor: string;
}

export default function DashboardQuickActions() {
  const actions: QuickAction[] = [
    {
      title: '新建新闻',
      href: '/admin/news?action=create',
      icon: faNewspaper,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
    },
    {
      title: '新建政策',
      href: '/admin/policies?action=create',
      icon: faFileAlt,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
    },
    {
      title: '上传视频',
      href: '/admin/videos?action=create',
      icon: faVideo,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
    },
    {
      title: '媒体库',
      href: '/admin/media',
      icon: faImage,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
    },
    {
      title: '留言管理',
      href: '/admin/feedback',
      icon: faComments,
      color: 'bg-pink-500',
      hoverColor: 'hover:bg-pink-600',
    },
    {
      title: '操作日志',
      href: '/admin/operation-logs',
      icon: faChartBar,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
    },
    {
      title: '通知中心',
      href: '/admin/notifications',
      icon: faBell,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
    },
    {
      title: '系统设置',
      href: '/admin/settings',
      icon: faCog,
      color: 'bg-gray-600',
      hoverColor: 'hover:bg-gray-700',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`group flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all`}
          >
            <div
              className={`w-12 h-12 rounded-lg ${action.color} ${action.hoverColor} flex items-center justify-center text-white mb-3 transition-colors`}
            >
              <FontAwesomeIcon icon={action.icon} className="text-xl" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 text-center">
              {action.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
