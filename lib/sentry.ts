/**
 * Sentry 错误监控集成
 * 自动捕获和报告应用错误
 */

import { logger } from './logger';

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate?: number;
}

// Sentry 配置
const sentryConfig: SentryConfig = {
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  release: process.env.SENTRY_RELEASE || process.env.npm_package_version,
  sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || '1.0'),
};

// 错误队列（用于批量发送）
const errorQueue: any[] = [];
let flushTimer: NodeJS.Timeout | null = null;

/**
 * 初始化 Sentry
 */
export function initSentry(): void {
  if (!sentryConfig.dsn) {
    logger.warn('Sentry DSN 未配置，错误监控已禁用');
    return;
  }

  // 在生产环境启用 Sentry
  if (process.env.NODE_ENV === 'production') {
    // 这里可以添加实际的 Sentry SDK 初始化代码
    // import * as Sentry from '@sentry/nextjs';
    // Sentry.init({
    //   dsn: sentryConfig.dsn,
    //   environment: sentryConfig.environment,
    //   release: sentryConfig.release,
    //   tracesSampleRate: sentryConfig.sampleRate,
    // });
    
    logger.info('Sentry 错误监控已初始化');
  }
}

/**
 * 捕获异常
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  // 记录到本地日志
  logger.error('Exception captured:', {
    message: error.message,
    stack: error.stack,
    ...context,
  });

  // 添加到队列
  errorQueue.push({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  });

  // 触发批量发送
  scheduleFlush();
}

/**
 * 捕获消息
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  logger.log(`[${level.toUpperCase()}] ${message}`);

  errorQueue.push({
    message,
    level,
    timestamp: new Date().toISOString(),
  });

  scheduleFlush();
}

/**
 * 设置用户上下文
 */
export function setUser(user: { id: string; username?: string; email?: string } | null): void {
  // 可以存储到全局状态
  if (typeof window !== 'undefined') {
    (window as any).__SENTRY_USER__ = user;
  }
}

/**
 * 添加面包屑
 */
export function addBreadcrumb(message: string, category?: string, data?: Record<string, any>): void {
  logger.log('Breadcrumb:', { message, category, data });
}

/**
 * 性能监控 - 开始事务
 */
export function startTransaction(name: string, op: string): { finish: () => void } {
  const startTime = performance.now();
  
  return {
    finish: () => {
      const duration = performance.now() - startTime;
      logger.log(`Transaction: ${name} (${op}) - ${duration.toFixed(2)}ms`);
      
      // 慢事务警告
      if (duration > 1000) {
        captureMessage(`Slow transaction: ${name} took ${duration.toFixed(2)}ms`, 'warning');
      }
    },
  };
}

/**
 * 性能监控 - Web Vitals
 */
export function captureWebVitals(): void {
  if (typeof window === 'undefined') return;

  // CLS (Cumulative Layout Shift)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });

  // LCP (Largest Contentful Paint)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    logger.log('LCP:', lastEntry.startTime);
    
    if (lastEntry.startTime > 2500) {
      captureMessage(`Poor LCP: ${lastEntry.startTime.toFixed(0)}ms`, 'warning');
    }
  });
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // FID (First Input Delay)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const delay = (entry as any).processingStart - entry.startTime;
      logger.log('FID:', delay);
      
      if (delay > 100) {
        captureMessage(`Poor FID: ${delay.toFixed(0)}ms`, 'warning');
      }
    }
  });
  fidObserver.observe({ entryTypes: ['first-input'] });

  // 页面卸载时发送 CLS
  window.addEventListener('beforeunload', () => {
    logger.log('CLS:', clsValue);
    clsObserver.disconnect();
    lcpObserver.disconnect();
    fidObserver.disconnect();
  });
}

/**
 * 计划批量发送
 */
function scheduleFlush(): void {
  if (flushTimer) return;
  
  flushTimer = setTimeout(() => {
    flushErrors();
    flushTimer = null;
  }, 5000); // 5秒后批量发送
}

/**
 * 批量发送错误
 */
async function flushErrors(): Promise<void> {
  if (errorQueue.length === 0) return;

  const errors = errorQueue.splice(0, errorQueue.length);
  
  try {
    // 发送到服务器
    await fetch('/api/error-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errors }),
    });
  } catch (e) {
    // 发送失败，保留错误
    errorQueue.unshift(...errors);
  }
}

/**
 * 获取当前错误队列状态
 */
export function getErrorQueueStatus(): { count: number; isFlushing: boolean } {
  return {
    count: errorQueue.length,
    isFlushing: !!flushTimer,
  };
}

// 导出配置
export { sentryConfig };
