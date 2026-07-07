import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

// GET - 获取单个政策详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 检查缓存
    const cacheKey = `${CACHE_KEYS.POLICY_DETAIL}:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const policy = await prisma.policy.findFirst({
      where: {
        id,
        status: 'published',
        isActive: true,
      },
    });

    if (!policy) {
      return NextResponse.json(
        { error: '政策不存在或未发布' },
        { status: 404 }
      );
    }

    // 缓存结果
    await setCache(cacheKey, policy, CACHE_TTL.MEDIUM);

    // 禁用浏览器/CDN缓存，确保后台修改后立即生效
    const response = NextResponse.json(policy);
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error fetching policy detail:', error);
    return NextResponse.json(
      { error: '获取政策详情失败' },
      { status: 500 }
    );
  }
}
