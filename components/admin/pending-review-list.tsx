'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faNewspaper, faFileAlt, faCheckCircle, faClock,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

interface PendingItem {
  id: string;
  title: string;
  createdAt: string;
  type: 'news' | 'policy';
}

export default function PendingReviewList() {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/news?status=pending').then(res => res.json()),
      fetch('/api/admin/policies?status=pending').then(res => res.json()),
    ]).then(([newsResult, policyResult]) => {
      const items: PendingItem[] = [];

      if (newsResult.success && newsResult.data) {
        items.push(...newsResult.data.slice(0, 5).map((item: any) => ({
          ...item,
          type: 'news' as const,
        })));
      }

      if (policyResult.success && policyResult.data) {
        items.push(...policyResult.data.slice(0, 5).map((item: any) => ({
          ...item,
          type: 'policy' as const,
        })));
      }

      // 按创建时间排序
      items.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setPendingItems(items.slice(0, 10));
    }).catch((err) => {
      console.error('Failed to fetch pending items:', err);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-500">加载中...</div>
    );
  }

  if (pendingItems.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">待审核内容</h3>
        <div className="text-center py-8">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-gray-300 mb-3" />
          <p className="text-gray-500">暂无待审核内容</p>
        </div>
      </div>
    );
  }

  const typeConfig = {
    news: {
      icon: faNewspaper,
      label: '新闻',
      color: 'text-blue-600',
      link: (id: string) => `/admin/news/${id}/edit`,
    },
    policy: {
      icon: faFileAlt,
      label: '政策',
      color: 'text-green-600',
      link: (id: string) => `/admin/policies/${id}/edit`,
    },
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">待审核内容</h3>
        <span className="text-sm text-gray-500">{pendingItems.length} 条待审核</span>
      </div>

      <div className="space-y-3">
        {pendingItems.map((item) => {
          const config = typeConfig[item.type];
          return (
            <Link
              key={item.id}
              href={config.link(item.id)}
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="mt-1">
                    <FontAwesomeIcon
                      icon={config.icon}
                      className={config.color}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {config.label} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
                  <FontAwesomeIcon icon={faClock} className="mr-1" />
                  待审核
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
        <Link href="/admin/reviews" className="text-sm text-blue-600 hover:text-blue-700">
          查看全部待审核内容
        </Link>
      </div>
    </div>
  );
}
