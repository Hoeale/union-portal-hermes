import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import { logger } from '@/lib/logger';

// POST: 初始化默认分类并迁移旧数据
export async function POST(request: NextRequest) {
  try {
    // 认证检查
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: '未授权访问,请先登录' }, { status: 401 });
    }

    // 检查是否已有分类
    const existingCount = await prisma.newsCategory.count();
    if (existingCount > 0) {
      return NextResponse.json({
        success: false,
        error: '分类数据已存在,无需重复初始化',
        existingCount,
      });
    }

    // 创建默认分类 - 使用 createMany 批量插入优化 N+1 问题
    const defaultCategories = [
      { name: '新闻动态', slug: 'news', color: '#b71c1c', orderIndex: 1 },
      { name: '通知要闻', slug: 'notices', color: '#1565c0', orderIndex: 2 },
      { name: '公示公告', slug: 'announcements', color: '#2e7d32', orderIndex: 3 },
    ];

    await prisma.newsCategory.createMany({
      data: defaultCategories,
      skipDuplicates: true,
    });

    // 迁移旧分类数据
    const migrations = [
      { old: '动态', new: '新闻动态' },
      { old: '工会动态', new: '新闻动态' },
      { old: '通知', new: '通知要闻' },
      { old: '公告', new: '公示公告' },
    ];

    let totalMigrated = 0;
    for (const m of migrations) {
      const result = await prisma.news.updateMany({
        where: { category: m.old },
        data: { category: m.new },
      });
      totalMigrated += result.count;
    }

    return NextResponse.json({
      success: true,
      message: '初始化完成',
      data: {
        createdCategories: defaultCategories.length,
        migratedNews: totalMigrated,
      },
    });
  } catch (error) {
    logger.error('Failed to initialize categories:', error);
    return NextResponse.json(
      { success: false, error: '初始化失败' },
      { status: 500 }
    );
  }
}
