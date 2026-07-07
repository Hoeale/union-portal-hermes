/**
 * 登录日志记录工具
 */

import { prisma } from './prisma';
import { parseClientInfo } from './user-agent-parser';

export interface LoginLogData {
  username: string;
  adminId?: string;
  loginType: 'success' | 'failed';
  failureReason?: string;
  request: Request;
}

/**
 * 记录登录日志
 */
export async function logLogin(data: LoginLogData): Promise<void> {
  try {
    const clientInfo = parseClientInfo(data.request);

    await prisma.loginLog.create({
      data: {
        username: data.username,
        adminId: data.adminId || null,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        os: clientInfo.os,
        browser: clientInfo.browser,
        device: clientInfo.device,
        loginType: data.loginType,
        failureReason: data.failureReason || null,
      },
    });
  } catch (error) {
    // 日志记录失败不应影响主流程
    console.error('Failed to log login:', error);
  }
}
