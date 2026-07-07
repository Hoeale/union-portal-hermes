import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logOperation } from '@/lib/operation-logger';

const ALLOWED_CATEGORIES = ['工会活动', '培训教学', '宣传视频'];
const ALLOWED_SOURCE_TYPES = ['local', 'external'];

// GET - Fetch all videos with optional category filter
export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }

    const videos = await prisma.video.findMany({
      where,
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
    });

    const data = videos.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      description: item.description,
      source_type: item.sourceType,
      video_url: item.videoUrl,
      thumbnail_url: item.thumbnailUrl,
      duration: item.duration,
      file_size: item.fileSize,
      is_active: item.isActive,
      view_count: item.viewCount,
      order_index: item.orderIndex,
      created_at: item.createdAt.toISOString(),
      updated_at: item.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Videos GET error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}

// POST - Create new video
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      category,
      description,
      source_type,
      video_url,
      thumbnail_url,
      duration,
      file_size,
      is_active,
      order_index,
    } = body;

    // Validate input
    if (!title || !category || !source_type || !video_url) {
      return NextResponse.json(
        { error: '标题、分类、视频来源和视频链接不能为空' },
        { status: 400 }
      );
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: '无效的视频分类' },
        { status: 400 }
      );
    }

    if (!ALLOWED_SOURCE_TYPES.includes(source_type)) {
      return NextResponse.json(
        { error: '无效的视频来源类型' },
        { status: 400 }
      );
    }

    // Create video
    const video = await prisma.video.create({
      data: {
        title,
        category,
        description: description || null,
        sourceType: source_type,
        videoUrl: video_url,
        thumbnailUrl: thumbnail_url || null,
        duration: duration || null,
        fileSize: file_size || null,
        isActive: is_active !== undefined ? is_active : true,
        orderIndex: order_index || 0,
      },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'videos',
      action: 'create',
      targetId: video.id,
      targetType: 'video',
      targetTitle: title,
    });

    const data = {
      id: video.id,
      title: video.title,
      category: video.category,
      description: video.description,
      source_type: video.sourceType,
      video_url: video.videoUrl,
      thumbnail_url: video.thumbnailUrl,
      duration: video.duration,
      file_size: video.fileSize,
      is_active: video.isActive,
      view_count: video.viewCount,
      order_index: video.orderIndex,
      created_at: video.createdAt.toISOString(),
      updated_at: video.updatedAt.toISOString(),
    };

    // Revalidate pages
    revalidatePath('/');
    revalidatePath('/videos');
    revalidatePath('/admin/videos');

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Video POST error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}

// PUT - Update existing video
export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      title,
      category,
      description,
      source_type,
      video_url,
      thumbnail_url,
      duration,
      file_size,
      is_active,
      order_index,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: '视频ID不能为空' },
        { status: 400 }
      );
    }

    // Validate if provided
    if (category && !ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: '无效的视频分类' },
        { status: 400 }
      );
    }

    if (source_type && !ALLOWED_SOURCE_TYPES.includes(source_type)) {
      return NextResponse.json(
        { error: '无效的视频来源类型' },
        { status: 400 }
      );
    }

    // Update video with partial update pattern
    const video = await prisma.video.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(source_type !== undefined && { sourceType: source_type }),
        ...(video_url !== undefined && { videoUrl: video_url }),
        ...(thumbnail_url !== undefined && { thumbnailUrl: thumbnail_url }),
        ...(duration !== undefined && { duration }),
        ...(file_size !== undefined && { fileSize: file_size }),
        ...(is_active !== undefined && { isActive: is_active }),
        ...(order_index !== undefined && { orderIndex: order_index }),
      },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'videos',
      action: 'update',
      targetId: id,
      targetType: 'video',
      targetTitle: title || video.title,
    });

    const data = {
      id: video.id,
      title: video.title,
      category: video.category,
      description: video.description,
      source_type: video.sourceType,
      video_url: video.videoUrl,
      thumbnail_url: video.thumbnailUrl,
      duration: video.duration,
      file_size: video.fileSize,
      is_active: video.isActive,
      view_count: video.viewCount,
      order_index: video.orderIndex,
      created_at: video.createdAt.toISOString(),
      updated_at: video.updatedAt.toISOString(),
    };

    // Revalidate pages
    revalidatePath('/');
    revalidatePath('/videos');
    revalidatePath('/admin/videos');

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Video PUT error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}

// DELETE - Delete video
export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '视频ID不能为空' },
        { status: 400 }
      );
    }

    const oldVideo = await prisma.video.findUnique({
      where: { id },
    });

    await prisma.video.delete({
      where: { id },
    });

    // 记录操作日志
    if (oldVideo) {
      await logOperation({
        request,
        module: 'videos',
        action: 'delete',
        targetId: id,
        targetType: 'video',
        targetTitle: oldVideo.title,
      });
    }

    // Revalidate pages
    revalidatePath('/');
    revalidatePath('/videos');
    revalidatePath('/admin/videos');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Video DELETE error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}
