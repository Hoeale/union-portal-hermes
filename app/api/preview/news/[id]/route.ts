import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic'

// GET - 预览新闻
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const news = await prisma.news.findUnique({
      where: { id: params.id },
    });

    if (!news) {
      return NextResponse.json({ error: '新闻不存在' }, { status: 404 });
    }

    return NextResponse.json({ data: news });
  } catch (error) {
    console.error('Error fetching news preview:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
