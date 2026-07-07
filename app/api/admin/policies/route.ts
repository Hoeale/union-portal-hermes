import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logOperation } from '@/lib/operation-logger';
import { logger } from '@/lib/logger';
import { deleteCache, CACHE_KEYS } from '@/lib/cache';

// GET - Fetch all policies with pagination and search
export async function GET(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.title = { contains: search };
    }
    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.policy.count({ where });

    // Get paginated policies
    const policies = await prisma.policy.findMany({
      where,
      orderBy: [{ publishDate: 'desc' }, { orderIndex: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      data: policies,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    logger.error('Error fetching policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}

// POST - Create new policy
export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      category,
      publishDate,
      source,
      fileUrl,
      fileUrls,
      fileNames,
      content,
      isActive = true,
      orderIndex = 0
    } = body;

    if (!title || !category || !publishDate) {
      return NextResponse.json(
        { error: 'Title, category, and publish date are required' },
        { status: 400 }
      );
    }

    const policy = await prisma.policy.create({
      data: {
        title,
        category,
        publishDate,
        source: source || '',
        fileUrl: fileUrl || null,
        fileUrls: fileUrls || null,
        fileNames: fileNames || null,
        fileName: body.fileName || null,
        enableDownload: body.enableDownload || false,
        content: content || '',
        isActive,
        orderIndex,
        status: body.status || 'pending', // 默认为待发布
      },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'policies',
      action: 'create',
      targetId: policy.id,
      targetType: 'policy',
      targetTitle: title,
    });

    // 清除相关缓存（包括所有带参数的缓存键）
    await deleteCache(CACHE_KEYS.POLICY_LIST);
    // 清除带参数的缓存键
    await deleteCache(`${CACHE_KEYS.POLICY_LIST}:all:all`);
    await deleteCache(`${CACHE_KEYS.POLICY_LIST}:all:10`);
    await deleteCache(`${CACHE_KEYS.POLICY_LIST}:公示公告:all`);
    await deleteCache(`${CACHE_KEYS.POLICY_LIST}:公示公告:10`);
    await deleteCache(CACHE_KEYS.DASHBOARD);

    return NextResponse.json({ success: true, data: policy });
  } catch (error) {
    logger.error('Error creating policy:', error);
    return NextResponse.json(
      { error: 'Failed to create policy' },
      { status: 500 }
    );
  }
}

// PUT - Update policy
export async function PUT(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, category, publishDate, source, fileUrl, fileUrls, fileNames, fileName, enableDownload, content, isActive, orderIndex } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Policy ID is required' },
        { status: 400 }
      );
    }

    const policy = await prisma.policy.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(publishDate !== undefined && { publishDate }),
        ...(source !== undefined && { source }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(fileUrls !== undefined && { fileUrls }),
        ...(fileNames !== undefined && { fileNames }),
        ...(fileName !== undefined && { fileName }),
        ...(enableDownload !== undefined && { enableDownload }),
        ...(content !== undefined && { content }),
        ...(isActive !== undefined && { isActive }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    // 记录操作日志
    const action = body.status === 'published' ? 'publish' : 'update';
    await logOperation({
      request,
      module: 'policies',
      action,
      targetId: id,
      targetType: 'policy',
      targetTitle: title || policy.title,
    });

    // 清除相关缓存（包括所有带参数的缓存键）
    await deleteCache(CACHE_KEYS.POLICY_LIST);
    // 清除带参数的缓存键
    await deleteCache(`${CACHE_KEYS.POLICY_LIST}:all:all`);
    await deleteCache(`${CACHE_KEYS.POLICY_LIST}:all:10`);
    await deleteCache(`${CACHE_KEYS.POLICY_LIST}:公示公告:all`);
    await deleteCache(`${CACHE_KEYS.POLICY_LIST}:公示公告:10`);
    await deleteCache(CACHE_KEYS.DASHBOARD);

    return NextResponse.json({ success: true, data: policy });
  } catch (error) {
    logger.error('Error updating policy:', error);
    return NextResponse.json(
      { error: 'Failed to update policy' },
      { status: 500 }
    );
  }
}

// DELETE - Delete policy
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
        { error: 'Policy ID is required' },
        { status: 400 }
      );
    }

    const oldPolicy = await prisma.policy.findUnique({
      where: { id },
    });

    await prisma.policy.delete({
      where: { id },
    });

    // 记录操作日志
    if (oldPolicy) {
      await logOperation({
        request,
        module: 'policies',
        action: 'delete',
        targetId: id,
        targetType: 'policy',
        targetTitle: oldPolicy.title,
      });
    }

    // 清除相关缓存（包括所有带参数的缓存键）
    await deleteCache(CACHE_KEYS.POLICY_LIST);
    // 清除带参数的缓存键
    await deleteCache(`${CACHE_KEYS.POLICY_LIST}:all:all`);
    await deleteCache(`${CACHE_KEYS.POLICY_LIST}:all:10`);
    await deleteCache(`${CACHE_KEYS.POLICY_LIST}:公示公告:all`);
    await deleteCache(`${CACHE_KEYS.POLICY_LIST}:公示公告:10`);
    await deleteCache(CACHE_KEYS.DASHBOARD);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting policy:', error);
    return NextResponse.json(
      { error: 'Failed to delete policy' },
      { status: 500 }
    );
  }
}
