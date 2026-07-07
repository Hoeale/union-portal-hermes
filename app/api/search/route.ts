import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // news, policy, service
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    if (!query || query.trim() === '') {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        totalPages: 0,
      });
    }

    // XSS 防护: 清洗搜索输入
    const sanitizedQuery = sanitizeHtml(query.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();

    if (!sanitizedQuery) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        totalPages: 0,
      });
    }

    const skip = (page - 1) * pageSize;
    let allResults: Array<{
      id: string;
      title: string;
      category: string;
      type: string;
      excerpt: string;
      publishedAt: string;
    }> = [];
    let total = 0;

    // 根据类型筛选进行搜索
    const searchTypes = type ? [type] : ['news', 'policy', 'service'];

    for (const searchType of searchTypes) {
      let typeResults: any[] = [];
      let typeTotal = 0;

      if (searchType === 'news') {
        // 只在匹配类型或无类型筛选时搜索
        const whereClause: any = {
          status: 'published',
          OR: [
            { title: { contains: sanitizedQuery } },
            { content: { contains: sanitizedQuery } },
          ],
        };

        if (category) {
          whereClause.category = category;
        }

        const news = await prisma.news.findMany({
          where: whereClause,
          orderBy: { publishedAt: 'desc' },
          skip: type === 'news' ? skip : 0,
          take: type === 'news' ? pageSize : 100, // 无类型筛选时获取更多
        });

        typeTotal = await prisma.news.count({ where: whereClause });

        typeResults = news.map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          type: 'news',
          excerpt: item.content?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
          publishedAt: item.publishedAt.toISOString(),
        }));
      } else if (searchType === 'policy') {
        const whereClause: any = {
          status: 'published',
          OR: [
            { title: { contains: sanitizedQuery } },
            { content: { contains: sanitizedQuery } },
          ],
        };

        if (category) {
          whereClause.category = category;
        }

        const policies = await prisma.policy.findMany({
          where: whereClause,
          orderBy: { publishDate: 'desc' },
          skip: type === 'policy' ? skip : 0,
          take: type === 'policy' ? pageSize : 100,
        });

        typeTotal = await prisma.policy.count({ where: whereClause });

        typeResults = policies.map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          type: 'policy',
          excerpt: item.content?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
          publishedAt: new Date(item.publishDate).toISOString(),
        }));
      } else if (searchType === 'service') {
        const whereClause: any = {
          isActive: true,
          OR: [
            { title: { contains: sanitizedQuery } },
            { description: { contains: sanitizedQuery } },
            { process: { contains: sanitizedQuery } },
            { requirements: { contains: sanitizedQuery } },
          ],
        };

        const services = await prisma.service.findMany({
          where: whereClause,
          orderBy: { orderIndex: 'asc' },
          skip: type === 'service' ? skip : 0,
          take: type === 'service' ? pageSize : 100,
        });

        typeTotal = await prisma.service.count({ where: whereClause });

        typeResults = services.map((item) => ({
          id: item.id,
          title: item.title,
          category: '工会服务',
          type: 'service',
          excerpt: item.description?.substring(0, 200) || '',
          publishedAt: item.updatedAt.toISOString(),
        }));
      }

      allResults = allResults.concat(typeResults);
      total += typeTotal;
    }

    // 如果没有类型筛选，需要对所有结果排序并分页
    if (!type) {
      // 按时间排序
      allResults.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      // 分页
      allResults = allResults.slice(skip, skip + pageSize);
    }

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: allResults,
      total,
      totalPages,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      success: false,
      error: '搜索失败',
      data: [],
      total: 0,
      totalPages: 0,
    }, { status: 500 });
  }
}
