import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withCsrfProtection } from '@/lib/csrf';
import { logOperation } from '@/lib/operation-logger';
import { logger } from '@/lib/logger';

// GET - 获取所有政策分类
export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.policyCategory.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Error fetching policy categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - 创建政策分类
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const csrfError = await withCsrfProtection(request);
    if (csrfError) return csrfError;

    const body = await request.json();
    const { name, orderIndex = 0 } = body;

    if (!name) {
      return NextResponse.json(
        { error: '分类名称不能为空' },
        { status: 400 }
      );
    }

    const category = await prisma.policyCategory.create({
      data: {
        name,
        orderIndex,
      },
    });

    await logOperation({
      request,
      module: 'policy-categories',
      action: 'create',
      targetId: category.id,
      targetType: 'policy_category',
      targetTitle: name,
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    logger.error('Error creating policy category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// PUT - 更新政策分类
export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const csrfError = await withCsrfProtection(request);
    if (csrfError) return csrfError;

    const body = await request.json();
    const { id, name, orderIndex, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: '分类ID不能为空' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;
    if (isActive !== undefined) updateData.isActive = isActive;

    const category = await prisma.policyCategory.update({
      where: { id },
      data: updateData,
    });

    await logOperation({
      request,
      module: 'policy-categories',
      action: 'update',
      targetId: id,
      targetType: 'policy_category',
      targetTitle: name || category.name,
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    logger.error('Error updating policy category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE - 删除政策分类
export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const csrfError = await withCsrfProtection(request);
    if (csrfError) return csrfError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '分类ID不能为空' },
        { status: 400 }
      );
    }

    const oldCategory = await prisma.policyCategory.findUnique({
      where: { id },
    });

    await prisma.policyCategory.delete({
      where: { id },
    });

    if (oldCategory) {
      await logOperation({
        request,
        module: 'policy-categories',
        action: 'delete',
        targetId: id,
        targetType: 'policy_category',
        targetTitle: oldCategory.name,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting policy category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
