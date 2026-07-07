'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface PermissionGuardProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default function PermissionGuard({ permission, fallback, children }: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // 获取当前用户权限
    fetch('/api/admin/user/permissions')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setHasPermission(result.data.permissions.includes(permission) || result.data.role === 'admin');
        } else {
          setHasPermission(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch permissions:', err);
        setHasPermission(false);
      });
  }, [permission]);

  if (hasPermission === null) {
    return <div className="text-center py-4 text-gray-500">加载中...</div>;
  }

  if (!hasPermission) {
    return (
      <>
        {fallback || (
          <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg text-gray-500">
            <FontAwesomeIcon icon={faLock} className="mr-2" />
            <span className="text-sm">权限不足</span>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}

/**
 * 权限检查Hook
 */
export function usePermission(permission: string) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/user/permissions')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setHasPermission(result.data.permissions.includes(permission) || result.data.role === 'admin');
        } else {
          setHasPermission(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch permissions:', err);
        setHasPermission(false);
      })
      .finally(() => setLoading(false));
  }, [permission]);

  return { hasPermission, loading };
}

/**
 * 待办审核组件
 */
export function PendingReviewList({ type = 'news' }: { type?: 'news' | 'policy' }) {
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/${type}?status=pending`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setPendingItems(result.data.slice(0, 10)); // 最多显示10条
        }
      })
      .catch((err) => console.error('Failed to fetch pending items:', err))
      .finally(() => setLoading(false));
  }, [type]);

  if (loading) {
    return <div className="text-center py-4 text-gray-500">加载中...</div>;
  }

  if (pendingItems.length === 0) {
    return (
      <div className="text-center py-8">
        <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-gray-300 mb-3" />
        <p className="text-gray-500">暂无待审核内容</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingItems.map((item) => (
        <a
          key={item.id}
          href={`/admin/${type}/${item.id}/review`}
          className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                提交时间：{new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              待审核
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
