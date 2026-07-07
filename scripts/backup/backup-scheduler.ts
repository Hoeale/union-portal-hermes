/**
 * 自动备份调度器
 * 使用 node-cron 实现定时备份
 */

import { backupDatabase, cleanupOldBackups } from './backup-database';
import cron from 'node-cron';

interface BackupScheduleConfig {
  enabled: boolean;
  schedule: string; // cron 表达式
  retentionDays: number;
}

// 默认配置：每天凌晨 2 点备份
const DEFAULT_CONFIG: BackupScheduleConfig = {
  enabled: process.env.AUTO_BACKUP_ENABLED === 'true',
  schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // 每天 2:00
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
};

/**
 * 启动自动备份
 */
export function startAutoBackup(config: BackupScheduleConfig = DEFAULT_CONFIG): void {
  if (!config.enabled) {
    console.log('自动备份已禁用');
    return;
  }

  console.log(`启动自动备份服务...`);
  console.log(`备份时间: ${config.schedule} (cron表达式)`);
  console.log(`保留天数: ${config.retentionDays} 天`);

  // 验证 cron 表达式
  if (!cron.validate(config.schedule)) {
    console.error('无效的 cron 表达式:', config.schedule);
    return;
  }

  // 创建定时任务
  const task = cron.schedule(config.schedule, async () => {
    console.log('\n========================================');
    console.log('           自动备份开始');
    console.log('========================================');
    
    try {
      const backupConfig = {
        dbHost: process.env.DB_HOST || 'localhost',
        dbPort: process.env.DB_PORT || '3306',
        dbName: process.env.DB_NAME || 'union_portal',
        dbUser: process.env.DB_USER || 'root',
        dbPassword: process.env.DB_PASSWORD || '',
        backupDir: process.env.BACKUP_DIR || './backups',
        retentionDays: config.retentionDays,
      };

      await backupDatabase(backupConfig);
      await cleanupOldBackups(backupConfig);
      
      console.log('✓ 自动备份完成');
    } catch (error) {
      console.error('✗ 自动备份失败:', error);
      // 这里可以添加告警通知（邮件、短信等）
    }
    
    console.log('========================================\n');
  }, {
    scheduled: true,
    timezone: 'Asia/Shanghai',
  });

  console.log('✓ 自动备份服务已启动');

  // 优雅关闭
  process.on('SIGTERM', () => {
    console.log('正在停止自动备份服务...');
    task.stop();
    process.exit(0);
  });
}

/**
 * 手动执行备份
 */
export async function runManualBackup(): Promise<void> {
  const config = {
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: process.env.DB_PORT || '3306',
    dbName: process.env.DB_NAME || 'union_portal',
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    backupDir: process.env.BACKUP_DIR || './backups',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  };

  await backupDatabase(config);
  await cleanupOldBackups(config);
}

// 如果直接运行
if (require.main === module) {
  startAutoBackup();
}
