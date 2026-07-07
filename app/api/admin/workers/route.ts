import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logOperation } from '@/lib/operation-logger';

// GET - Fetch all workers with optional search
export async function GET(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { title: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const workers = await prisma.worker.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ success: true, data: workers });
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workers' },
      { status: 500 }
    );
  }
}

// POST - Create new worker
export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, title, department, story, imageUrl, imageSourceType, isActive = true, orderIndex = 0 } = body;

    if (!name || !title || !department || !story) {
      return NextResponse.json(
        { error: 'Name, title, department, and story are required' },
        { status: 400 }
      );
    }

    const worker = await prisma.worker.create({
      data: {
        name,
        title,
        department,
        story,
        imageUrl: imageUrl || null,
        imageSourceType: imageSourceType || 'local',
        isActive,
        orderIndex,
      },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'workers',
      action: 'create',
      targetId: worker.id,
      targetType: 'worker',
      targetTitle: name,
    });

    return NextResponse.json({ success: true, data: worker });
  } catch (error) {
    console.error('Error creating worker:', error);
    return NextResponse.json(
      { error: 'Failed to create worker' },
      { status: 500 }
    );
  }
}

// PUT - Update worker
export async function PUT(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, title, department, story, imageUrl, imageSourceType, isActive, orderIndex } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Worker ID is required' },
        { status: 400 }
      );
    }

    const worker = await prisma.worker.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(title !== undefined && { title }),
        ...(department !== undefined && { department }),
        ...(story !== undefined && { story }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(imageSourceType !== undefined && { imageSourceType }),
        ...(isActive !== undefined && { isActive }),
        ...(orderIndex !== undefined && { orderIndex }),
      },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'workers',
      action: 'update',
      targetId: id,
      targetType: 'worker',
      targetTitle: name || worker.name,
    });

    return NextResponse.json({ success: true, data: worker });
  } catch (error) {
    console.error('Error updating worker:', error);
    return NextResponse.json(
      { error: 'Failed to update worker' },
      { status: 500 }
    );
  }
}

// DELETE - Delete worker
export async function DELETE(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Worker ID is required' },
        { status: 400 }
      );
    }

    const oldWorker = await prisma.worker.findUnique({
      where: { id },
    });

    await prisma.worker.delete({
      where: { id },
    });

    // 记录操作日志
    if (oldWorker) {
      await logOperation({
        request,
        module: 'workers',
        action: 'delete',
        targetId: id,
        targetType: 'worker',
        targetTitle: oldWorker.name,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting worker:', error);
    return NextResponse.json(
      { error: 'Failed to delete worker' },
      { status: 500 }
    );
  }
}
