/**
 * 环境变量配置验证
 * 确保所有必需的环境变量都已配置
 */

import { logger } from './logger';

// 环境变量定义
interface EnvConfig {
  // 数据库
  DATABASE_URL: string;
  
  // 会话密钥
  ADMIN_SESSION_SECRET?: string;
  
  // 基础 URL
  NEXT_PUBLIC_BASE_URL: string;
  
  // 备份配置
  BACKUP_DIR?: string;
  BACKUP_RETENTION_DAYS?: string;
  AUTO_BACKUP_ENABLED?: string;
  
  // Sentry 配置
  SENTRY_DSN?: string;
  SENTRY_RELEASE?: string;
  SENTRY_SAMPLE_RATE?: string;
  
  // 其他
  NODE_ENV: 'development' | 'production' | 'test';
}

// 必需的环境变量
const REQUIRED_ENV_VARS: Array<keyof EnvConfig> = [
  'DATABASE_URL',
];

// 可选但有默认值的环境变量
const OPTIONAL_ENV_VARS_WITH_DEFAULTS: Partial<Record<keyof EnvConfig, string>> = {
  NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
  BACKUP_DIR: './backups',
  BACKUP_RETENTION_DAYS: '30',
  AUTO_BACKUP_ENABLED: 'false',
  SENTRY_SAMPLE_RATE: '1.0',
};

/**
 * 验证环境变量
 */
export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查必需变量
  for (const key of REQUIRED_ENV_VARS) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      errors.push(`缺少必需的环境变量: ${key}`);
    }
  }

  // 检查生产环境必需变量
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.ADMIN_SESSION_SECRET) {
      errors.push('生产环境必须设置 ADMIN_SESSION_SECRET');
    }
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      errors.push('生产环境必须设置 NEXT_PUBLIC_BASE_URL');
    }
  }

  // 检查数据库 URL 格式
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith('mysql://')) {
    errors.push('DATABASE_URL 格式不正确，必须以 mysql:// 开头');
  }

  // 检查备份目录
  const backupDir = process.env.BACKUP_DIR;
  if (backupDir && backupDir.startsWith('/')) {
    warnings.push('BACKUP_DIR 使用绝对路径，请确保该路径存在且有写入权限');
  }

  // 检查 Sentry DSN 格式
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn && !sentryDsn.includes('@sentry.io') && !sentryDsn.includes('@o')) {
    warnings.push('SENTRY_DSN 格式可能不正确');
  }

  // 检查保留天数
  const retentionDays = process.env.BACKUP_RETENTION_DAYS;
  if (retentionDays) {
    const days = parseInt(retentionDays, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      errors.push('BACKUP_RETENTION_DAYS 必须是 1-365 之间的数字');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 获取环境变量（带默认值）
 */
export function getEnv<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
  const value = process.env[key];
  const defaultValue = OPTIONAL_ENV_VARS_WITH_DEFAULTS[key];
  
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`环境变量 ${key} 未设置`);
  }
  
  return (value || defaultValue) as EnvConfig[K];
}

/**
 * 获取数值型环境变量
 */
export function getEnvNumber(key: keyof EnvConfig, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`环境变量 ${key} 未设置`);
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error(`环境变量 ${key} 不是有效的数字: ${value}`);
  }
  
  return num;
}

/**
 * 获取布尔型环境变量
 */
export function getEnvBoolean(key: keyof EnvConfig, defaultValue?: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`环境变量 ${key} 未设置`);
  }
  
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * 初始化环境变量
 */
export function initEnv(): void {
  const result = validateEnv();
  
  if (result.errors.length > 0) {
    logger.error('环境变量验证失败:');
    result.errors.forEach(err => logger.error(`  - ${err}`));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('环境变量配置错误，无法启动应用');
    }
  }
  
  if (result.warnings.length > 0) {
    logger.warn('环境变量警告:');
    result.warnings.forEach(warn => logger.warn(`  - ${warn}`));
  }
  
  if (result.valid) {
    logger.info('环境变量验证通过');
  }
}

/**
 * 生成环境变量文档
 */
export function generateEnvDocs(): string {
  return `# 环境变量配置说明

## 必需的环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| DATABASE_URL | MySQL 数据库连接字符串 | mysql://user:pass@localhost:3306/db |

## 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| NEXT_PUBLIC_BASE_URL | 网站基础 URL | http://localhost:3000 |
| ADMIN_SESSION_SECRET | 会话加密密钥（生产必需） | - |
| BACKUP_DIR | 数据库备份目录 | ./backups |
| BACKUP_RETENTION_DAYS | 备份保留天数 | 30 |
| AUTO_BACKUP_ENABLED | 是否启用自动备份 | false |
| SENTRY_DSN | Sentry 错误监控 DSN | - |
| SENTRY_SAMPLE_RATE | Sentry 采样率 | 1.0 |

## 生产环境检查清单

- [ ] DATABASE_URL 已配置且可连接
- [ ] ADMIN_SESSION_SECRET 已设置（至少32位随机字符串）
- [ ] NEXT_PUBLIC_BASE_URL 已设置为实际域名
- [ ] 备份目录已创建且有写入权限
- [ ] Sentry DSN 已配置（可选但推荐）

## 生成随机密钥

\`\`\`bash
# 生成 32 位随机密钥
openssl rand -base64 32
\`\`\`
`;
}

// 导出验证结果类型
export type { EnvConfig };
