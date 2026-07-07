import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import { logger } from '@/lib/logger';

// GET: 获取所有新闻分类
export async function GET(request: NextRequest) {
  try {
    // 认证检查
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: '未授权访问，请先登录' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where = includeInactive ? {} : { isActive: true };

    const categories = await prisma.newsCategory.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    });

    // 统计每个分类下的新闻数量
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await prisma.news.count({
          where: { category: cat.name },
        });
        return {
          ...cat,
          newsCount: count,
        };
      })
    );

    // 统计"未分类"新闻数量
    const uncategorizedCount = await prisma.news.count({
      where: { category: null },
    });

    return NextResponse.json({
      success: true,
      data: categoriesWithCount,
      uncategorizedCount,
    });
  } catch (error) {
    logger.error('Failed to fetch news categories:', error);
    return NextResponse.json(
      { success: false, error: '获取分类列表失败' },
      { status: 500 }
    );
  }
}

// POST: 创建新分类
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: '未授权访问，请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: '分类名称不能为空' },
        { status: 400 }
      );
    }

    // 检查名称是否已存在
    const existing = await prisma.newsCategory.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: '分类名称已存在' },
        { status: 400 }
      );
    }

    // 获取最大 orderIndex
    const maxOrder = await prisma.newsCategory.aggregate({
      _max: { orderIndex: true },
    });

    const category = await prisma.newsCategory.create({
      data: {
        name: name.trim(),
        slug: slug || name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: description || null,
        color: color || null,
        orderIndex: (maxOrder._max.orderIndex || 0) + 1,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error('Failed to create news category:', error);
    return NextResponse.json(
      { success: false, error: '创建分类失败' },
      { status: 500 }
    );
  }
}

// PUT: 更新分类
export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: '未授权访问，请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, slug, description, color, orderIndex, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '分类ID不能为空' },
        { status: 400 }
      );
    }

    // 获取原分类信息
    const originalCategory = await prisma.newsCategory.findUnique({
      where: { id },
    });

    if (!originalCategory) {
      return NextResponse.json(
        { success: false, error: '分类不存在' },
        { status: 404 }
      );
    }

    // 如果修改名称，检查新名称是否已存在
    if (name && name.trim() !== originalCategory.name) {
      const existing = await prisma.newsCategory.findUnique({
        where: { name: name.trim() },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: '分类名称已存在' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;
    if (isActive !== undefined) updateData.isActive = isActive;

    // 如果名称变更，需要同步更新新闻表中的分类
    if (name && name.trim() !== originalCategory.name) {
      await prisma.news.updateMany({
        where: { category: originalCategory.name },
        data: { category: name.trim() },
      });
    }

    const category = await prisma.newsCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error('Failed to update news category:', error);
    return NextResponse.json(
      { success: false, error: '更新分类失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除分类（将分类下新闻移至"未分类"）
export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: '未授权访问，请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '分类ID不能为空' },
        { status: 400 }
      );
    }

    const category = await prisma.newsCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: '分类不存在' },
        { status: 404 }
      );
    }

    // 将该分类下的新闻设为"未分类"（category = null）
    const affectedNews = await prisma.news.updateMany({
      where: { category: category.name },
      data: { category: null },
    });

    // 删除分类
    await prisma.newsCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCategory: category,
        affectedNewsCount: affectedNews.count,
      },
      message: `分类"${category.name}"已删除，${affectedNews.count} 条新闻已移至"未分类"`,
    });
  } catch (error) {
    logger.error('Failed to delete news category:', error);
    return NextResponse.json(
      { success: false, error: '删除分类失败' },
      { status: 500 }
    );
  }
}
