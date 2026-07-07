import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiErrorResponse, apiUnauthorizedError } from '@/lib/api-errors';

// GET - 获取反馈统计数据
export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return apiUnauthorizedError();
    }

    // 总数统计
    const total = await prisma.feedback.count();

    // 按状态统计
    const unread = await prisma.feedback.count({ where: { status: 'unread' } });
    const read = await prisma.feedback.count({ where: { status: 'read' } });
    const processing = await prisma.feedback.count({ where: { status: 'processing' } });
    const resolved = await prisma.feedback.count({ where: { status: 'resolved' } });

    // 按分类统计
    const suggestionCount = await prisma.feedback.count({ where: { category: 'suggestion' } });
    const complaintCount = await prisma.feedback.count({ where: { category: 'complaint' } });
    const praiseCount = await prisma.feedback.count({ where: { category: 'praise' } });
    const questionCount = await prisma.feedback.count({ where: { category: 'question' } });
    const noCategoryCount = await prisma.feedback.count({ where: { category: null } });

    // 近7天趋势
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const count = await prisma.feedback.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      recentTrend.push({
        date: date.toISOString().split('T')[0],
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        count,
      });
    }

    return NextResponse.json({
      total,
      unread,
      read,
      processing,
      resolved,
      byCategory: {
        suggestion: suggestionCount,
        complaint: complaintCount,
        praise: praiseCount,
        question: questionCount,
        uncategorized: noCategoryCount,
      },
      recentTrend,
    });
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/admin/feedback/stats');
  }
}
