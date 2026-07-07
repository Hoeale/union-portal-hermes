import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic'

// GET - 预览政策
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const policy = await prisma.policy.findUnique({
      where: { id: params.id },
    });

    if (!policy) {
      return NextResponse.json({ error: '政策不存在' }, { status: 404 });
    }

    return NextResponse.json({ data: policy });
  } catch (error) {
    console.error('Error fetching policy preview:', error);
    return NextResponse.json({ error: 'Failed to fetch policy' }, { status: 500 });
  }
}
