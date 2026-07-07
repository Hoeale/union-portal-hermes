import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import { logOperation } from '@/lib/operation-logger';

// Helper to check auth
async function checkAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

// GET - Fetch all carousel items
export async function GET() {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const items = await prisma.carouselItem.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching carousel items:', error);
    return NextResponse.json(
      { success: false, error: '获取轮播图失败' },
      { status: 500 }
    );
  }
}

// POST - Create new carousel item
export async function POST(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { title, imageUrl, linkUrl, displayOrder } = body;

    if (!title || !imageUrl) {
      return NextResponse.json(
        { success: false, error: '标题和图片链接不能为空' },
        { status: 400 }
      );
    }

    // Get max order if not provided
    let order = displayOrder;
    if (order === undefined || order === null) {
      const lastItem = await prisma.carouselItem.findFirst({
        orderBy: { displayOrder: 'desc' },
      });
      order = (lastItem?.displayOrder || 0) + 1;
    }

    const item = await prisma.carouselItem.create({
      data: {
        title,
        imageUrl,
        linkUrl: linkUrl || '',
        newsId: '00000000-0000-0000-0000-000000000000', // 独立轮播图没有关联新闻
        displayOrder: order,
      },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'carousel',
      action: 'create',
      targetId: item.id,
      targetType: 'carousel',
      targetTitle: title,
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error creating carousel item:', error);
    return NextResponse.json(
      { success: false, error: '创建轮播图失败' },
      { status: 500 }
    );
  }
}

// PUT - Update carousel item
export async function PUT(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, title, imageUrl, linkUrl, displayOrder } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID不能为空' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    const item = await prisma.carouselItem.update({
      where: { id },
      data: updateData,
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'carousel',
      action: 'update',
      targetId: id,
      targetType: 'carousel',
      targetTitle: title || item.title,
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating carousel item:', error);
    return NextResponse.json(
      { success: false, error: '更新轮播图失败' },
      { status: 500 }
    );
  }
}

// DELETE - Delete carousel item
export async function DELETE(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID不能为空' },
        { status: 400 }
      );
    }

    const oldItem = await prisma.carouselItem.findUnique({
      where: { id },
    });

    await prisma.carouselItem.delete({
      where: { id },
    });

    // 记录操作日志
    if (oldItem) {
      await logOperation({
        request,
        module: 'carousel',
        action: 'delete',
        targetId: id,
        targetType: 'carousel',
        targetTitle: oldItem.title,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting carousel item:', error);
    return NextResponse.json(
      { success: false, error: '删除轮播图失败' },
      { status: 500 }
    );
  }
}
