/**
 * Web Vitals 性能监控
 * 收集 Core Web Vitals 指标并发送到分析系统
 */

import { NextRouter } from 'next/router';
import { type Metric } from 'web-vitals';

// Web Vitals 指标类型
type MetricType = 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';

// 性能阈值（Good / Needs Improvement / Poor）
const THRESHOLDS: Record<MetricType, [number, number]> = {
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  FID: [100, 300],
  INP: [200, 500],
  LCP: [2500, 4000],
  TTFB: [800, 1800],
};

// 获取性能等级
function getRating(name: MetricType, value: number): 'good' | 'needs-improvement' | 'poor' {
  const [good, poor] = THRESHOLDS[name];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

// 发送指标到分析系统
function sendToAnalytics(metric: Metric) {
  const { name, value, id, delta } = metric;
  const metricType = name as MetricType;
  const rating = getRating(metricType, value);

  // 构建指标数据
  const metricData = {
    name,
    value: Math.round(name === 'CLS' ? value * 1000 : value), // CLS 转为毫秒
    delta,
    rating,
    id,
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    connection: (navigator as any).connection?.effectiveType || 'unknown',
    deviceMemory: (navigator as any).deviceMemory || 'unknown',
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
  };

  // 开发环境：输出到控制台
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${name}:`, {
      value: metricData.value,
      rating,
      delta: Math.round(delta),
    });
    return;
  }

  // 生产环境：发送到 API 端点
  // 使用 navigator.sendBeacon 确保数据在页面卸载时也能发送
  try {
    const blob = new Blob([JSON.stringify(metricData)], { type: 'application/json' });
    
    // 如果支持 sendBeacon，使用它（更可靠）
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/web-vitals', blob);
    } else {
      // 降级方案：使用 fetch
      fetch('/api/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metricData),
        keepalive: true,
      });
    }
  } catch (error) {
    console.error('[Web Vitals] Failed to send metrics:', error);
  }
}

// 批量上报（优化性能）
let metricsBuffer: Metric[] = [];
let reportTimeout: NodeJS.Timeout | null = null;

function sendBatchToAnalytics() {
  if (metricsBuffer.length === 0) return;

  const batchData = metricsBuffer.map((metric) => {
    const { name, value, id, delta } = metric;
    const metricType = name as MetricType;
    const rating = getRating(metricType, value);

    return {
      name,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      delta,
      rating,
      id,
      url: window.location.href,
      timestamp: Date.now(),
    };
  });

  // 发送批量数据
  try {
    const blob = new Blob([JSON.stringify(batchData)], { type: 'application/json' });
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/web-vitals', blob);
    } else {
      fetch('/api/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData),
        keepalive: true,
      });
    }
  } catch (error) {
    console.error('[Web Vitals] Failed to send batch:', error);
  }

  metricsBuffer = [];
}

// Web Vitals 报告函数
export function reportWebVitals(metric: Metric) {
  // 添加到缓冲区
  metricsBuffer.push(metric);

  // 立即发送单个指标
  sendToAnalytics(metric);

  // 5秒后批量发送（如果还有其他指标）
  if (reportTimeout) clearTimeout(reportTimeout);
  reportTimeout = setTimeout(() => {
    sendBatchToAnalytics();
  }, 5000);
}

// 页面切换时清理
export function cleanupWebVitals() {
  if (reportTimeout) {
    clearTimeout(reportTimeout);
    sendBatchToAnalytics();
  }
}
