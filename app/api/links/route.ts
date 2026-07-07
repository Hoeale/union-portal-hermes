import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const links = await prisma.friendlyLink.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    // Transform database format to component format
    const items = links.map((link) => ({
      id: link.id,
      title: link.title,
      url: link.url,
      is_required: link.isRequired,
      order_index: link.orderIndex,
    }));

    // 禁用浏览器/CDN缓存，确保后台修改后立即生效
    const response = NextResponse.json(items);
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error fetching friendly links:', error);
    return NextResponse.json({ error: 'Failed to fetch friendly links' }, { status: 500 });
  }
}
