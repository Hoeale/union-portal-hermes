import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

// GET - Fetch all active workers for frontend
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    const workers = await prisma.worker.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
      take: limit ? parseInt(limit) : undefined,
    });

    // 禁用浏览器/CDN缓存，确保后台修改后立即生效
    const response = NextResponse.json(workers);
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workers' },
      { status: 500 }
    );
  }
}
