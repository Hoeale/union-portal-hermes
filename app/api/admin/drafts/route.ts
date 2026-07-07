import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withCsrfProtection } from '@/lib/csrf';

// GET - 获取草稿列表
export async function GET(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const where: any = {};
    if (typeFilter !== 'all') {
      where.type = typeFilter;
    }

    const total = await prisma.draft.count({ where });
    const drafts = await prisma.draft.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      data: drafts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
  }
}

// POST - 创建草稿
export async function POST(request: NextRequest) {
  // CSRF 保护
  const csrfError = await withCsrfProtection(request);
  if (csrfError) return csrfError;

  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, category, content, imageUrl, fileUrl, source, publishDate } = body;

    if (!type || !title || !content) {
      return NextResponse.json(
        { error: '类型、标题和内容为必填项' },
        { status: 400 }
      );
    }

    const draft = await prisma.draft.create({
      data: {
        type,
        title,
        category: category || '',
        content,
        imageUrl: imageUrl || null,
        fileUrl: fileUrl || null,
        source: source || null,
        publishDate: publishDate || null,
      },
    });

    return NextResponse.json({ success: true, data: draft });
  } catch (error) {
    console.error('Error creating draft:', error);
    return NextResponse.json({ error: '保存草稿失败' }, { status: 500 });
  }
}

// PUT - 更新草稿
export async function PUT(request: NextRequest) {
  // CSRF 保护
  const csrfError = await withCsrfProtection(request);
  if (csrfError) return csrfError;

  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, category, content, imageUrl, fileUrl, source, publishDate } = body;

    if (!id) {
      return NextResponse.json({ error: '草稿 ID 不能为空' }, { status: 400 });
    }

    const draft = await prisma.draft.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(content !== undefined && { content }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(source !== undefined && { source }),
        ...(publishDate !== undefined && { publishDate }),
      },
    });

    return NextResponse.json({ success: true, data: draft });
  } catch (error) {
    console.error('Error updating draft:', error);
    return NextResponse.json({ error: '更新草稿失败' }, { status: 500 });
  }
}

// DELETE - 删除草稿
export async function DELETE(request: NextRequest) {
  // CSRF 保护
  const csrfError = await withCsrfProtection(request);
  if (csrfError) return csrfError;

  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '草稿 ID 不能为空' }, { status: 400 });
    }

    await prisma.draft.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json({ error: '删除草稿失败' }, { status: 500 });
  }
}
