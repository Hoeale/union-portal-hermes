import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// TODO [P3-Edge Runtime]: 此 API 适合使用 Edge Runtime 加速
// 当前状态: 使用 Node.js Runtime（因为依赖 Prisma）
// 优化方案: 如果未来改为直接读取 Redis 缓存或使用边缘数据库（如 Upstash Redis），
//          可以启用 Edge Runtime:
//          export const runtime = 'edge';
// 预期收益: 冷启动时间从 ~200ms 降至 ~10ms，提升 95%
//          全球 CDN 节点直接响应，降低延迟 50-200ms
// 限制: Edge Runtime 不支持 Prisma Client、Node.js API（fs、crypto 等）
// 注意: 此 API 已有 Redis 缓存，命中率 90%+ 时性能已较好

// 强制动态渲染，避免 Next.js 静态预渲染导致后台修改不生效
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isCarousel = searchParams.get('is_carousel');
    const isNotice = searchParams.get('is_notice');
    
    // 分页参数（优先使用 page/pageSize，兼容 limit/offset）
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : null;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : null;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // 生成缓存键（包含查询参数）
    const cacheKey = `${CACHE_KEYS.NEWS_LIST}:${category || 'all'}:${isCarousel || 'false'}:${isNotice || 'false'}:${page || 1}:${pageSize || limit || 10}`;
    
    // 检查缓存
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const where: any = {
      status: 'published', // 只显示已发布的内容
    };

    if (isCarousel !== null) {
      where.isCarousel = isCarousel === 'true';
    }

    if (isNotice !== null) {
      where.isNotice = isNotice === 'true';
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    // 计算分页
    const currentPage = page || 1;
    const currentPageSize = pageSize || (limit ? parseInt(limit) : 10);
    const skip = page && pageSize ? (page - 1) * pageSize : (offset ? parseInt(offset) : 0);

    // 获取总数
    const total = await prisma.news.count({ where });
    const totalPages = Math.ceil(total / currentPageSize);

    const news = await prisma.news.findMany({
      where,
      orderBy: isCarousel === 'true'
        ? { carouselOrder: 'asc' }  // 轮播图按排序字段升序
        : isNotice === 'true'
        ? { publishedAt: 'desc' }   // 通知公告按发布时间降序
        : { publishedAt: 'desc' },  // 普通列表按发布时间降序
      take: currentPageSize,
      skip,
    });

    // Transform database format to component format
    const items = news.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      content: item.content,
      image_url: item.imageUrl,
      is_carousel: item.isCarousel,
      carousel_order: item.carouselOrder,
      published_at: item.publishedAt.toISOString(),
      created_at: item.createdAt.toISOString(),
    }));

    // 如果使用 page/pageSize 参数，返回分页信息
    if (page && pageSize) {
      const responseData = {
        data: items,
        pagination: {
          total,
          page: currentPage,
          pageSize: currentPageSize,
          totalPages,
        },
      };
      
      // 缓存结果（ISR: 5分钟重新验证）
      await setCache(cacheKey, responseData, CACHE_TTL.MEDIUM);
      
      // 添加 HTTP 缓存头部，实现类似 ISR 的效果
      const response = NextResponse.json(responseData);
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
      return response;
    }

    // 兼容旧的 limit/offset 参数
    const responseData = items;
    
    // 缓存结果（ISR: 5分钟重新验证）
    await setCache(cacheKey, responseData, CACHE_TTL.MEDIUM);
    
    // 禁用浏览器/CDN缓存，确保后台修改后立即生效
    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return response;
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
