import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiErrorResponse, apiUnauthorizedError } from '@/lib/api-errors';

// GET - 获取未读留言数量
export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return apiUnauthorizedError();
    }

    const count = await prisma.feedback.count({
      where: { isRead: false },
    });

    return NextResponse.json({ count });
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/admin/feedback/unread-count');
  }
}
