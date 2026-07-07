/**
 * 数据库备份脚本
 * 支持自动备份和手动备份
 * 备份文件按日期存储，保留最近30天的备份
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';

const execAsync = promisify(exec);

interface BackupConfig {
  dbHost: string;
  dbPort: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  backupDir: string;
  retentionDays: number;
}

// 从环境变量获取配置
const getConfig = (): BackupConfig => ({
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: process.env.DB_PORT || '3306',
  dbName: process.env.DB_NAME || 'union_portal',
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  backupDir: process.env.BACKUP_DIR || './backups',
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
});

/**
 * 创建备份目录
 */
async function ensureBackupDir(backupDir: string): Promise<void> {
  try {
    await fs.access(backupDir);
  } catch {
    await fs.mkdir(backupDir, { recursive: true });
    console.log(`创建备份目录: ${backupDir}`);
  }
}

/**
 * 执行数据库备份
 */
async function backupDatabase(config: BackupConfig): Promise<string> {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const backupFileName = `${config.dbName}_${timestamp}.sql.gz`;
  const backupPath = path.join(config.backupDir, backupFileName);

  // 构建 mysqldump 命令
  const dumpCommand = [
    'mysqldump',
    `--host=${config.dbHost}`,
    `--port=${config.dbPort}`,
    `--user=${config.dbUser}`,
    `--password=${config.dbPassword}`,
    '--single-transaction',
    '--routines',
    '--triggers',
    '--events',
    '--hex-blob',
    '--lock-tables=false',
    config.dbName,
    `| gzip > "${backupPath}"`,
  ].join(' ');

  console.log(`开始备份数据库: ${config.dbName}`);
  console.log(`备份文件: ${backupPath}`);

  try {
    const { stdout, stderr } = await execAsync(dumpCommand);
    
    if (stderr && !stderr.includes('Warning')) {
      console.warn('备份警告:', stderr);
    }

    // 验证备份文件
    const stats = await fs.stat(backupPath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`✓ 备份成功: ${backupFileName}`);
    console.log(`  大小: ${fileSizeMB} MB`);
    console.log(`  时间: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);

    return backupPath;
  } catch (error) {
    // 清理失败的备份文件
    try {
      await fs.unlink(backupPath);
    } catch {
      // 文件可能不存在
    }
    throw new Error(`备份失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 清理过期备份
 */
async function cleanupOldBackups(config: BackupConfig): Promise<void> {
  console.log(`\n清理 ${config.retentionDays} 天前的备份...`);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

  try {
    const files = await fs.readdir(config.backupDir);
    let deletedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.sql.gz')) continue;

      const filePath = path.join(config.backupDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        console.log(`  删除过期备份: ${file}`);
        deletedCount++;
      }
    }

    console.log(`✓ 清理完成，删除 ${deletedCount} 个过期备份`);
  } catch (error) {
    console.error('清理备份失败:', error);
  }
}

/**
 * 列出所有备份
 */
async function listBackups(config: BackupConfig): Promise<void> {
  console.log('\n备份列表:');
  
  try {
    const files = await fs.readdir(config.backupDir);
    const backups = [];

    for (const file of files) {
      if (!file.endsWith('.sql.gz')) continue;

      const filePath = path.join(config.backupDir, file);
      const stats = await fs.stat(filePath);
      
      backups.push({
        name: file,
        size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
        date: format(stats.mtime, 'yyyy-MM-dd HH:mm:ss'),
      });
    }

    // 按日期倒序
    backups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (backups.length === 0) {
      console.log('  暂无备份文件');
    } else {
      backups.forEach((backup, index) => {
        console.log(`  ${index + 1}. ${backup.name}`);
        console.log(`     大小: ${backup.size} | 时间: ${backup.date}`);
      });
    }
  } catch (error) {
    console.error('列出备份失败:', error);
  }
}

/**
 * 恢复数据库
 */
async function restoreDatabase(config: BackupConfig, backupFile: string): Promise<void> {
  const backupPath = path.join(config.backupDir, backupFile);

  // 验证备份文件存在
  try {
    await fs.access(backupPath);
  } catch {
    throw new Error(`备份文件不存在: ${backupFile}`);
  }

  console.log(`\n警告: 这将覆盖数据库 ${config.dbName} 的所有数据!`);
  console.log(`恢复文件: ${backupFile}`);
  
  // 在实际环境中应该添加确认提示
  // 这里为了自动化，直接执行

  const restoreCommand = [
    `gunzip < "${backupPath}"`,
    '|',
    'mysql',
    `--host=${config.dbHost}`,
    `--port=${config.dbPort}`,
    `--user=${config.dbUser}`,
    `--password=${config.dbPassword}`,
    config.dbName,
  ].join(' ');

  console.log('开始恢复数据库...');

  try {
    const { stderr } = await execAsync(restoreCommand);
    
    if (stderr) {
      console.warn('恢复警告:', stderr);
    }

    console.log('✓ 数据库恢复成功');
  } catch (error) {
    throw new Error(`恢复失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'backup';
  const config = getConfig();

  console.log('====================================');
  console.log('      数据库备份工具 v1.0');
  console.log('====================================\n');

  try {
    await ensureBackupDir(config.backupDir);

    switch (command) {
      case 'backup':
        await backupDatabase(config);
        await cleanupOldBackups(config);
        break;

      case 'list':
        await listBackups(config);
        break;

      case 'restore':
        if (!args[1]) {
          console.error('错误: 请指定要恢复的备份文件');
          console.log('用法: tsx scripts/backup/backup-database.ts restore <备份文件名>');
          process.exit(1);
        }
        await restoreDatabase(config, args[1]);
        break;

      case 'clean':
        await cleanupOldBackups(config);
        break;

      default:
        console.log('用法:');
        console.log('  tsx scripts/backup/backup-database.ts backup    # 执行备份');
        console.log('  tsx scripts/backup/backup-database.ts list      # 列出备份');
        console.log('  tsx scripts/backup/backup-database.ts restore   # 恢复数据库');
        console.log('  tsx scripts/backup/backup-database.ts clean     # 清理过期备份');
    }
  } catch (error) {
    console.error('\n✗ 操作失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { backupDatabase, restoreDatabase, listBackups, cleanupOldBackups };
