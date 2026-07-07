'use client';

import { useEffect, Suspense } from 'react';
import { reportWebVitals, cleanupWebVitals } from '@/lib/web-vitals';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Web Vitals 监控组件内部实现
 */
function WebVitalsMonitorInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 页面加载完成后，延迟收集 Web Vitals
    const timeoutId = setTimeout(() => {
      // 使用 Performance API 收集额外指标
      if (typeof performance !== 'undefined' && 'getEntriesByType' in performance) {
        // 收集 Navigation Timing
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          console.log('[Web Vitals] Navigation Timing:', {
            TTFB: Math.round(navigation.responseStart - navigation.requestStart),
            DOMContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.startTime),
            LoadComplete: Math.round(navigation.loadEventEnd - navigation.startTime),
          });
        }

        // 收集 Resource Timing（分析第三方资源）
        const resources = performance.getEntriesByType('resource');
        const slowResources = resources.filter(
          (r) => r.duration > 1000 // 超过 1 秒的资源
        );
        
        if (slowResources.length > 0) {
          console.warn('[Web Vitals] Slow resources detected:', slowResources.map(r => ({
            name: r.name.split('/').slice(3).join('/'), // 简化 URL
            duration: Math.round(r.duration),
            size: r.transferSize,
          })));
        }
      }
    }, 3000); // 延迟 3 秒收集

    // 页面切换时清理
    return () => {
      clearTimeout(timeoutId);
      cleanupWebVitals();
    };
  }, [pathname, searchParams]); // 路由变化时重新收集

  // Next.js App Router 不直接支持 reportWebVitals 函数
  // 我们通过 Performance Observer 手动收集
  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return;

    // 收集 LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        reportWebVitals({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: 'good',
          delta: lastEntry.startTime,
          id: `lcp-${Date.now()}`,
          entries: [lastEntry],
          navigationType: 'navigate',
        });
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // LCP observer not supported
    }

    // 收集 CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            
            reportWebVitals({
              name: 'CLS',
              value: clsValue,
              rating: 'good',
              delta: (entry as any).value,
              id: `cls-${Date.now()}`,
              entries: [entry],
              navigationType: 'navigate',
            });
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // CLS observer not supported
    }

    // 收集 INP (Interaction to Next Paint)
    try {
      const inpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          reportWebVitals({
            name: 'INP',
            value: entry.duration,
            rating: 'good',
            delta: entry.duration,
            id: `inp-${entry.startTime}-${Date.now()}`,
            entries: [entry],
            navigationType: 'navigate',
          });
        });
      });
      inpObserver.observe({ type: 'event', buffered: true });
    } catch (e) {
      // INP observer not supported
    }

    // 清理函数
    return () => {
      // Observers 会在页面卸载时自动清理
    };
  }, []);

  // 不渲染任何内容
  return null;
}

/**
 * Web Vitals 监控组件
 * 使用 Suspense 包裹以避免 useSearchParams 问题
 */
export default function WebVitalsMonitor() {
  return (
    <Suspense fallback={null}>
      <WebVitalsMonitorInner />
    </Suspense>
  );
}
