import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic'

// GET - 获取草稿内容
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const draft = await prisma.draft.findUnique({
      where: { id: params.id },
    });

    if (!draft) {
      return NextResponse.json({ error: '草稿不存在' }, { status: 404 });
    }

    return NextResponse.json({ data: draft });
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json({ error: '获取草稿失败' }, { status: 500 });
  }
}
