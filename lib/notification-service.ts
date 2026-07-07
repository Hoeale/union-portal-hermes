import { prisma } from '@/lib/prisma';

/**
 * 通知类型定义
 */
export type NotificationType = 'feedback' | 'schedule' | 'content_expired' | 'system';

/**
 * 创建通知
 */
export async function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        link: link || null,
        isRead: false,
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * 新反馈时创建通知
 */
export async function notifyNewFeedback(feedbackId: string, feedbackName: string) {
  return createNotification(
    'feedback',
    '新的留言建议',
    `用户 <strong>${escapeHtml(feedbackName)}</strong> 提交了新的留言建议，请及时查看处理。`,
    `/admin/feedback`
  );
}

/**
 * 定时发布时创建通知
 */
export async function notifyScheduledPublish(contentType: string, contentTitle: string, publishTime: Date) {
  const timeStr = publishTime.toLocaleString('zh-CN');
  return createNotification(
    'schedule',
    '定时发布提醒',
    `<strong>${escapeHtml(contentTitle)}</strong> 将于 ${escapeHtml(timeStr)} 自动发布。`,
    `/admin/${contentType === 'news' ? 'news' : contentType === 'policy' ? 'policies' : contentType === 'video' ? 'videos' : 'scheduled'}`
  );
}

/**
 * 内容过期时创建通知
 */
export async function notifyContentExpired(contentType: string, contentTitle: string, contentId: string) {
  return createNotification(
    'content_expired',
    '内容过期提醒',
    `<strong>${escapeHtml(contentTitle)}</strong> 已发布超过30天，建议检查内容是否需要更新或下架。`,
    `/admin/${contentType === 'news' ? 'news' : contentType === 'policy' ? 'policies' : 'services'}?id=${contentId}`
  );
}

/**
 * 创建系统通知
 */
export async function notifySystem(title: string, message: string, link?: string) {
  return createNotification('system', title, message, link);
}

/**
 * HTML 转义工具函数
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
