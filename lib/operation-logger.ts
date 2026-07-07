/**
 * 操作日志记录工具
 */

import { prisma } from './prisma';
import { parseClientInfo } from './user-agent-parser';
import { getAdminSession } from './auth';

export interface OperationLogData {
  request: Request;
  module: string;
  action: string;
  targetId?: string;
  targetType?: string;
  targetTitle?: string;
  details?: any;
  source?: string;
}

/**
 * 记录操作日志
 */
export async function logOperation(data: OperationLogData): Promise<void> {
  try {
    // 从 session 中获取管理员信息
    let adminId = 'unknown';
    let adminName = 'Unknown';

    try {
      const session = await getAdminSession();
      if (session) {
        adminId = session.adminId;
        adminName = session.username;
      }
    } catch (error) {
      // Session 解析失败，使用默认值
      console.warn('Failed to parse admin session:', error);
    }

    const clientInfo = parseClientInfo(data.request);

    await prisma.operationLog.create({
      data: {
        adminId,
        adminName,
        module: data.module,
        action: data.action,
        targetId: data.targetId || null,
        targetType: data.targetType || null,
        targetTitle: data.targetTitle || null,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        os: clientInfo.os,
        browser: clientInfo.browser,
        source: data.source || 'admin_panel',
      },
    });
  } catch (error) {
    // 日志记录失败不应影响主流程
    console.error('Failed to log operation:', error);
  }
}
