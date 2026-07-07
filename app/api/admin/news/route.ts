import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/auth';
import { withCsrfProtection } from '@/lib/csrf';
import { logOperation } from '@/lib/operation-logger';
import { logger } from '@/lib/logger';
import { deleteCache, CACHE_KEYS } from '@/lib/cache';

// Helper: check auth and return unauthorized response if failed
async function checkAuth(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: '未授权访问，请先登录' },
      { status: 401 }
    );
  }
  return null;
}

// GET - Fetch all news with optional category filter, search, and pagination
export async function GET(request: NextRequest) {
  const authError = await checkAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);

    // Support fetching single news by ID
    const id = searchParams.get('id');
    if (id) {
      const item = await prisma.news.findUnique({ where: { id } });
      if (!item) {
        return NextResponse.json({ error: '新闻不存在' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: {
          id: item.id,
          title: item.title,
          category: item.category,
          content: item.content,
          image_url: item.imageUrl,
          image_source_type: item.imageSourceType,
          is_carousel: item.isCarousel,
          carousel_order: item.carouselOrder,
          is_notice: item.isNotice,
          status: item.status,
          publish_status: item.publishStatus,
          scheduled_publish_at: item.scheduledPublishAt?.toISOString() || null,
          published_at: item.publishedAt.toISOString(),
          created_at: item.createdAt.toISOString(),
        },
      });
    }

    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const publishStatus = searchParams.get('publishStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }
    if (search) {
      where.title = { contains: search };
    }
    if (status) {
      where.status = status;
    }
    // 支持按 publishStatus 过滤（scheduled = 定时发布）
    if (publishStatus) {
      where.publishStatus = publishStatus;
    }

    // Get total count
    const total = await prisma.news.count({ where });

    // Get paginated news
    const news = await prisma.news.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Transform to match the component format
    const data = news.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      content: item.content,
      image_url: item.imageUrl,
      image_source_type: item.imageSourceType,
      is_carousel: item.isCarousel,
      carousel_order: item.carouselOrder,
      is_notice: item.isNotice,
      status: item.status,
      publish_status: item.publishStatus,
      scheduled_publish_at: item.scheduledPublishAt?.toISOString() || null,
      published_at: item.publishedAt.toISOString(),
      created_at: item.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    logger.error('News GET error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}

// POST - Create new news
export async function POST(request: NextRequest) {
  const authError = await checkAuth(request);
  if (authError) return authError;

  // CSRF 保护
  const csrfError = await withCsrfProtection(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const { title, category, content, image_url, image_source_type, is_carousel, carousel_order } =
      body;

    // Validate input
    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    // 验证分类有效性（如果提供了分类）
    if (category) {
      const validCategory = await prisma.newsCategory.findUnique({
        where: { name: category },
      });
      if (!validCategory) {
        return NextResponse.json(
          { error: '无效的新闻分类' },
          { status: 400 }
        );
      }
    }

    // Create news
    const news = await prisma.news.create({
      data: {
        title,
        category,
        content,
        imageUrl: image_url || null,
        imageSourceType: image_source_type || 'local',
        isCarousel: is_carousel !== undefined ? is_carousel : true, // 默认勾选轮播图
        carouselOrder: (is_carousel !== undefined ? is_carousel : true) ? carousel_order || 0 : null,
        status: body.status || 'pending', // 默认为待发布
        publishStatus: body.publish_status || 'immediate', // immediate 或 scheduled
        scheduledPublishAt: body.scheduled_publish_at ? new Date(body.scheduled_publish_at) : null,
        publishedAt: new Date(),
      },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'news',
      action: 'create',
      targetId: news.id,
      targetType: 'news',
      targetTitle: title,
    });

    // Transform to match the component format
    const data = {
      id: news.id,
      title: news.title,
      category: news.category,
      content: news.content,
      image_url: news.imageUrl,
      image_source_type: news.imageSourceType,
      is_carousel: news.isCarousel,
      carousel_order: news.carouselOrder,
      is_notice: news.isNotice,
      published_at: news.publishedAt.toISOString(),
      created_at: news.createdAt.toISOString(),
    };

    // Revalidate pages
    revalidatePath('/');
    revalidatePath('/news');
    revalidatePath('/admin/news');

    // 清除相关缓存（包括所有带参数的缓存键）
    await deleteCache(CACHE_KEYS.NEWS_LIST);
    // 清除带参数的缓存键（category:isCarousel:isNotice:page:pageSize）
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:all:false:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:动态:false:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:通知:false:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:公告:false:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:all:true:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:all:false:true:1:10`);
    await deleteCache(CACHE_KEYS.CAROUSEL);
    await deleteCache(CACHE_KEYS.DASHBOARD);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('News POST error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}

// PUT - Update existing news
export async function PUT(request: NextRequest) {
  const authError = await checkAuth(request);
  if (authError) return authError;

  // CSRF 保护
  const csrfError = await withCsrfProtection(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const { id } = body;

    // Validate input
    if (!id) {
      return NextResponse.json(
        { error: '新闻ID不能为空' },
        { status: 400 }
      );
    }

    // 部分更新验证：只验证提供的字段
    // 如果提供了 category，验证其有效性
    if (body.category !== undefined && body.category !== null) {
      const validCategory = await prisma.newsCategory.findUnique({
        where: { name: body.category },
      });
      if (!validCategory) {
        return NextResponse.json(
          { error: '无效的新闻分类' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.image_url !== undefined) updateData.imageUrl = body.image_url || null;
    if (body.image_source_type !== undefined) updateData.imageSourceType = body.image_source_type || 'local';
    if (body.is_carousel !== undefined) updateData.isCarousel = body.is_carousel;
    if (body.carousel_order !== undefined) updateData.carouselOrder = body.carousel_order;
    if (body.is_notice !== undefined) updateData.isNotice = body.is_notice;
    // 如果取消轮播图，清空 carouselOrder
    if (body.is_carousel === false) updateData.carouselOrder = null;
    // 如果启用轮播图且没有指定顺序，默认为 0
    if (body.is_carousel === true && body.carousel_order === undefined) updateData.carouselOrder = 0;
    if (body.status !== undefined) updateData.status = body.status;
    // 定时发布相关字段
    if (body.publish_status !== undefined) updateData.publishStatus = body.publish_status;
    if (body.scheduled_publish_at !== undefined) {
      updateData.scheduledPublishAt = body.scheduled_publish_at ? new Date(body.scheduled_publish_at) : null;
    }
    // 手动设置的发布日期
    if (body.published_at !== undefined) {
      updateData.publishedAt = body.published_at ? new Date(body.published_at) : new Date();
    }

    const news = await prisma.news.update({
      where: { id },
      data: updateData,
    });

    // 记录操作日志
    const action = updateData.status === 'published' ? 'publish' : 'update';
    await logOperation({
      request,
      module: 'news',
      action,
      targetId: id,
      targetType: 'news',
      targetTitle: updateData.title || news.title,
      details: { before: updateData, after: news },
    });

    // Transform to match the component format
    const data = {
      id: news.id,
      title: news.title,
      category: news.category,
      content: news.content,
      image_url: news.imageUrl,
      image_source_type: news.imageSourceType,
      is_carousel: news.isCarousel,
      carousel_order: news.carouselOrder,
      is_notice: news.isNotice,
      published_at: news.publishedAt.toISOString(),
      created_at: news.createdAt.toISOString(),
    };

    // Revalidate pages
    revalidatePath('/');
    revalidatePath('/news');
    revalidatePath('/admin/news');

    // 清除相关缓存（包括所有带参数的缓存键）
    await deleteCache(CACHE_KEYS.NEWS_LIST);
    // 清除带参数的缓存键（category:isCarousel:isNotice:page:pageSize）
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:all:false:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:动态:false:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:通知:false:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:公告:false:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:all:true:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:all:false:true:1:10`);
    await deleteCache(CACHE_KEYS.CAROUSEL);
    await deleteCache(CACHE_KEYS.DASHBOARD);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('News PUT error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}

// DELETE - Delete news
export async function DELETE(request: NextRequest) {
  const authError = await checkAuth(request);
  if (authError) return authError;

  // CSRF 保护
  const csrfError = await withCsrfProtection(request);
  if (csrfError) return csrfError;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '新闻ID不能为空' },
        { status: 400 }
      );
    }

    // Delete news
    const oldNews = await prisma.news.findUnique({
      where: { id },
    });

    await prisma.news.delete({
      where: { id },
    });

    // 记录操作日志
    if (oldNews) {
      await logOperation({
        request,
        module: 'news',
        action: 'delete',
        targetId: id,
        targetType: 'news',
        targetTitle: oldNews.title,
      });
    }

    // Revalidate pages
    revalidatePath('/');
    revalidatePath('/news');
    revalidatePath('/admin/news');

    // 清除相关缓存（包括所有带参数的缓存键）
    await deleteCache(CACHE_KEYS.NEWS_LIST);
    // 清除带参数的缓存键（category:isCarousel:isNotice:page:pageSize）
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:all:false:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:动态:false:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:通知:false:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:公告:false:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:all:true:false:1:10`);
    await deleteCache(`${CACHE_KEYS.NEWS_LIST}:all:false:true:1:10`);
    await deleteCache(CACHE_KEYS.CAROUSEL);
    await deleteCache(CACHE_KEYS.DASHBOARD);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error('News DELETE error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}
