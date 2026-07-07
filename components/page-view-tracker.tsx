'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // 只跟踪前台页面,不跟踪管理后台
    if (pathname.startsWith('/admin')) {
      return;
    }

    const trackPageView = async () => {
      try {
        await fetch('/api/page-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: pathname,
            contentType: null,
            contentId: null,
          }),
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [pathname]);

  // 这是一个功能组件,不渲染任何 UI
  return null;
}
