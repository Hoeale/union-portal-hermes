import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteCache, CACHE_KEYS } from '@/lib/cache';

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

// GET - Fetch union profile content for frontend (no auth required)
export async function GET() {
  try {
    const introContent = await prisma.siteInfo.findUnique({
      where: { key: 'union_introduction' },
    });

    const result = introContent?.content || ''

    // 禁用浏览器/CDN缓存，确保管理后台修改后立即生效
    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    return response
  } catch (error) {
    console.error('Error fetching about:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about' },
      { status: 500 }
    );
  }
}
