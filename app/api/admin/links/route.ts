import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { logOperation } from '@/lib/operation-logger';

async function checkAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

// GET - Fetch all links
export async function GET() {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const links = await prisma.friendlyLink.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    // Transform to match the component format
    const data = links.map((link) => ({
      id: link.id,
      title: link.title,
      url: link.url,
      is_required: link.isRequired,
      order_index: link.orderIndex,
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Links GET error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}

// POST - Create new link
export async function POST(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { title, url, is_required, order_index } = body;

    // Validate input
    if (!title || !url) {
      return NextResponse.json(
        { error: '标题和链接不能为空' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: '无效的链接格式' },
        { status: 400 }
      );
    }

    // Get max order_index if not provided
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const existingLink = await prisma.friendlyLink.findFirst({
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      });

      finalOrderIndex = existingLink ? existingLink.orderIndex + 1 : 0;
    }

    // Create link
    const link = await prisma.friendlyLink.create({
      data: {
        title,
        url,
        isRequired: is_required || false,
        orderIndex: finalOrderIndex,
      },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'links',
      action: 'create',
      targetId: link.id,
      targetType: 'link',
      targetTitle: title,
    });

    // Transform to match the component format
    const data = {
      id: link.id,
      title: link.title,
      url: link.url,
      is_required: link.isRequired,
      order_index: link.orderIndex,
    };

    // Revalidate pages
    revalidatePath('/');
    revalidatePath('/admin/links');

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Links POST error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}

// DELETE - Delete link
export async function DELETE(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '链接ID不能为空' },
        { status: 400 }
      );
    }

    // Check if link is required
    const link = await prisma.friendlyLink.findUnique({
      where: { id },
      select: { isRequired: true },
    });

    if (link?.isRequired) {
      return NextResponse.json(
        { error: '必填链接不能删除' },
        { status: 400 }
      );
    }

    // Delete link
    const oldLink = await prisma.friendlyLink.findUnique({
      where: { id },
    });

    await prisma.friendlyLink.delete({
      where: { id },
    });

    // 记录操作日志
    if (oldLink) {
      await logOperation({
        request,
        module: 'links',
        action: 'delete',
        targetId: id,
        targetType: 'link',
        targetTitle: oldLink.title,
      });
    }

    // Revalidate pages
    revalidatePath('/');
    revalidatePath('/admin/links');

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Links DELETE error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}

// PUT - Update link
export async function PUT(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, title, url, is_required, order_index } = body;

    if (!id) {
      return NextResponse.json(
        { error: '链接ID不能为空' },
        { status: 400 }
      );
    }

    if (!title || !url) {
      return NextResponse.json(
        { error: '标题和链接不能为空' },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: '无效的链接格式' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (url !== undefined) updateData.url = url;
    if (is_required !== undefined) updateData.isRequired = is_required;
    if (order_index !== undefined) updateData.orderIndex = order_index;

    const link = await prisma.friendlyLink.update({
      where: { id },
      data: updateData,
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'links',
      action: 'update',
      targetId: id,
      targetType: 'link',
      targetTitle: title || link.title,
    });

    const data = {
      id: link.id,
      title: link.title,
      url: link.url,
      is_required: link.isRequired,
      order_index: link.orderIndex,
    };

    revalidatePath('/');
    revalidatePath('/admin/links');

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Links PUT error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}
