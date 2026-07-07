/**
 * 登录失败锁定机制
 * 防止暴力破解攻击
 */

import { NextRequest } from 'next/server';

interface FailedAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil?: number;
}

interface LockoutConfig {
  // 最大失败次数
  maxAttempts: number;
  // 锁定时间（毫秒）
  lockoutDuration: number;
  // 失败计数重置时间（毫秒）
  resetDuration: number;
}

// 默认配置：5次失败后锁定30分钟
const DEFAULT_CONFIG: LockoutConfig = {
  maxAttempts: 5,
  lockoutDuration: 30 * 60 * 1000, // 30分钟
  resetDuration: 60 * 60 * 1000, // 1小时
};

// 内存存储（生产环境应使用 Redis）
const failedAttempts = new Map<string, FailedAttempt>();

/**
 * 获取客户端标识
 */
function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : request.ip || 'unknown';
  return `login:${ip}`;
}

/**
 * 清理过期的失败记录
 */
function cleanupExpiredEntries(config: LockoutConfig): void {
  const now = Date.now();
  for (const [key, attempt] of failedAttempts.entries()) {
    // 清理已解锁且过期的记录
    if (attempt.lockedUntil && attempt.lockedUntil < now) {
      failedAttempts.delete(key);
    }
    // 清理长时间未活动的记录
    if (now - attempt.lastAttempt > config.resetDuration * 2) {
      failedAttempts.delete(key);
    }
  }
}

/**
 * 检查账户是否被锁定
 */
export function isAccountLocked(
  request: NextRequest,
  config: LockoutConfig = DEFAULT_CONFIG
): { locked: boolean; remainingTime?: number; attemptsRemaining?: number } {
  // 定期清理（每100次检查清理一次）
  if (Math.random() < 0.01) {
    cleanupExpiredEntries(config);
  }

  const identifier = getClientIdentifier(request);
  const now = Date.now();
  const attempt = failedAttempts.get(identifier);

  if (!attempt) {
    return { locked: false, attemptsRemaining: config.maxAttempts };
  }

  // 检查是否处于锁定状态
  if (attempt.lockedUntil && attempt.lockedUntil > now) {
    const remainingTime = Math.ceil((attempt.lockedUntil - now) / 1000);
    return { locked: true, remainingTime };
  }

  // 检查是否需要重置计数
  if (now - attempt.lastAttempt > config.resetDuration) {
    failedAttempts.delete(identifier);
    return { locked: false, attemptsRemaining: config.maxAttempts };
  }

  // 计算剩余尝试次数
  const attemptsRemaining = Math.max(0, config.maxAttempts - attempt.count);

  return { locked: false, attemptsRemaining };
}

/**
 * 记录登录失败
 */
export function recordFailedAttempt(
  request: NextRequest,
  config: LockoutConfig = DEFAULT_CONFIG
): { locked: boolean; remainingTime?: number; attemptsRemaining: number } {
  const identifier = getClientIdentifier(request);
  const now = Date.now();

  let attempt = failedAttempts.get(identifier);

  if (!attempt) {
    attempt = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    };
  } else {
    // 检查是否需要重置
    if (now - attempt.lastAttempt > config.resetDuration) {
      attempt = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      };
    } else {
      attempt.count++;
      attempt.lastAttempt = now;
    }
  }

  // 检查是否达到锁定阈值
  if (attempt.count >= config.maxAttempts) {
    attempt.lockedUntil = now + config.lockoutDuration;
    failedAttempts.set(identifier, attempt);
    
    return {
      locked: true,
      remainingTime: Math.ceil(config.lockoutDuration / 1000),
      attemptsRemaining: 0,
    };
  }

  failedAttempts.set(identifier, attempt);

  return {
    locked: false,
    attemptsRemaining: Math.max(0, config.maxAttempts - attempt.count),
  };
}

/**
 * 清除失败记录（登录成功时调用）
 */
export function clearFailedAttempts(request: NextRequest): void {
  const identifier = getClientIdentifier(request);
  failedAttempts.delete(identifier);
}

/**
 * 获取账户锁定状态（用于显示）
 */
export function getLockoutStatus(
  request: NextRequest,
  config: LockoutConfig = DEFAULT_CONFIG
): {
  isLocked: boolean;
  remainingTime?: number;
  failedAttempts: number;
  attemptsRemaining: number;
} {
  const identifier = getClientIdentifier(request);
  const attempt = failedAttempts.get(identifier);
  const now = Date.now();

  if (!attempt) {
    return {
      isLocked: false,
      failedAttempts: 0,
      attemptsRemaining: config.maxAttempts,
    };
  }

  const isLocked = !!(attempt.lockedUntil && attempt.lockedUntil > now);
  const remainingTime = isLocked
    ? Math.ceil((attempt.lockedUntil! - now) / 1000)
    : undefined;

  return {
    isLocked,
    remainingTime,
    failedAttempts: attempt.count,
    attemptsRemaining: Math.max(0, config.maxAttempts - attempt.count),
  };
}

/**
 * 创建锁定响应
 */
export function createLockoutResponse(remainingTime: number): {
  error: string;
  locked: true;
  retryAfter: number;
} {
  const minutes = Math.ceil(remainingTime / 60);
  return {
    error: `登录失败次数过多，账户已锁定。请 ${minutes} 分钟后重试。`,
    locked: true,
    retryAfter: remainingTime,
  };
}

// 导出配置和存储用于测试
export { DEFAULT_CONFIG, failedAttempts };
export type { LockoutConfig, FailedAttempt };
