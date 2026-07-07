import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';

// POST: 记录用户搜索行为
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { q: query, type, resultCount = 0 } = body;

    if (!query || query.trim() === '') {
      return NextResponse.json({
        success: false,
        error: '搜索关键词不能为空',
      }, { status: 400 });
    }

    // XSS 防护
    const sanitizedQuery = sanitizeHtml(query.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();

    // 获取用户IP
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // 异步记录，不阻塞主流程
    // 使用 create 直接插入数据库
    await prisma.searchLog.create({
      data: {
        query: sanitizedQuery,
        type: type || null,
        resultCount: parseInt(resultCount) || 0,
        ip: ip.substring(0, 50),
        userAgent: userAgent.substring(0, 500),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Search log error:', error);
    // 日志记录失败不应影响主流程，返回成功
    return NextResponse.json({ success: true });
  }
}

// GET: 管理员查看搜索统计
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // 获取热门搜索关键词
    if (action === 'popular') {
      const days = parseInt(searchParams.get('days') || '30');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const popularKeywords = await prisma.$queryRaw<
        Array<{ query: string; type: string; count: bigint; avgResults: number }>
      >`
        SELECT
          query,
          type,
          COUNT(*) as count,
          AVG(result_count) as avgResults
        FROM search_logs
        WHERE created_at >= ${startDate}
        GROUP BY query, type
        ORDER BY count DESC
        LIMIT 50
      `;

      return NextResponse.json({
        success: true,
        data: popularKeywords.map((item) => ({
          query: item.query,
          type: item.type || 'all',
          count: Number(item.count),
          avgResults: Number(item.avgResults).toFixed(1),
        })),
      });
    }

    // 获取搜索趋势（按天统计）
    if (action === 'trend') {
      const days = parseInt(searchParams.get('days') || '30');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trendData = await prisma.$queryRaw<
        Array<{ date: string; count: bigint }>
      >`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM search_logs
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      return NextResponse.json({
        success: true,
        data: trendData.map((item) => ({
          date: item.date,
          count: Number(item.count),
        })),
      });
    }

    // 获取类型分布
    if (action === 'type-distribution') {
      const days = parseInt(searchParams.get('days') || '30');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const typeDistribution = await prisma.$queryRaw<
        Array<{ type: string; count: bigint }>
      >`
        SELECT
          COALESCE(type, 'all') as type,
          COUNT(*) as count
        FROM search_logs
        WHERE created_at >= ${startDate}
        GROUP BY type
        ORDER BY count DESC
      `;

      return NextResponse.json({
        success: true,
        data: typeDistribution.map((item) => ({
          type: item.type,
          count: Number(item.count),
        })),
      });
    }

    // 默认返回综合统计
    const totalSearches = await prisma.searchLog.count();
    const uniqueQueries = await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`SELECT COUNT(DISTINCT query) as count FROM search_logs`;

    const todaySearches = await prisma.searchLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalSearches,
        uniqueQueries: Number(uniqueQueries[0].count),
        todaySearches,
      },
    });
  } catch (error) {
    console.error('Search stats error:', error);
    return NextResponse.json({
      success: false,
      error: '获取搜索统计失败',
    }, { status: 500 });
  }
}
