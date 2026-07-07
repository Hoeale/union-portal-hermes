import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';

// 热门搜索关键词配置
const POPULAR_KEYWORDS = [
  { text: '工会福利', type: 'news', count: 120 },
  { text: '职工培训', type: 'news', count: 98 },
  { text: '劳模评选', type: 'policy', count: 85 },
  { text: '法律援助', type: 'service', count: 76 },
  { text: '困难帮扶', type: 'service', count: 65 },
  { text: '医疗互助', type: 'service', count: 58 },
  { text: '五一表彰', type: 'news', count: 52 },
  { text: '入会指南', type: 'service', count: 45 },
  { text: '工会政策', type: 'policy', count: 42 },
  { text: '女职工权益', type: 'policy', count: 38 },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '5');

    // 如果没有输入，返回热门搜索
    if (!query || query.trim() === '') {
      return NextResponse.json({
        suggestions: POPULAR_KEYWORDS.slice(0, limit),
      });
    }

    // XSS 防护
    const sanitizedQuery = sanitizeHtml(query.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();

    if (!sanitizedQuery) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions: Array<{ text: string; type: string; count: number }> = [];

    // 1. 从搜索日志中查找历史热门搜索
    const searchLogs = await prisma.$queryRaw<
      Array<{ query: string; type: string; count: bigint }>
    >`
      SELECT query, type, COUNT(*) as count
      FROM search_logs
      WHERE query LIKE CONCAT('%', ${sanitizedQuery}, '%')
      GROUP BY query, type
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    searchLogs.forEach((log) => {
      suggestions.push({
        text: log.query,
        type: log.type || 'all',
        count: Number(log.count),
      });
    });

    // 2. 如果历史搜索不够，补充热门搜索
    if (suggestions.length < limit) {
      const popularMatches = POPULAR_KEYWORDS.filter(
        (kw) =>
          kw.text.includes(sanitizedQuery) &&
          !suggestions.some((s) => s.text === kw.text)
      );
      suggestions.push(...popularMatches);
    }

    // 3. 从新闻标题中获取匹配建议
    if (suggestions.length < limit) {
      const newsTitles = await prisma.news.findMany({
        where: {
          status: 'published',
          title: { contains: sanitizedQuery },
        },
        select: { title: true, category: true },
        take: limit - suggestions.length,
        orderBy: { publishedAt: 'desc' },
      });

      newsTitles.forEach((news) => {
        suggestions.push({
          text: news.title,
          type: 'news',
          count: 1,
        });
      });
    }

    // 4. 从政策标题中获取匹配建议
    if (suggestions.length < limit) {
      const policyTitles = await prisma.policy.findMany({
        where: {
          status: 'published',
          title: { contains: sanitizedQuery },
        },
        select: { title: true, category: true },
        take: limit - suggestions.length,
        orderBy: { publishDate: 'desc' },
      });

      policyTitles.forEach((policy) => {
        suggestions.push({
          text: policy.title,
          type: 'policy',
          count: 1,
        });
      });
    }

    // 去重并限制数量
    const uniqueSuggestions = suggestions
      .filter((s, index, self) => index === self.findIndex((t) => t.text === s.text))
      .slice(0, limit);

    return NextResponse.json({
      suggestions: uniqueSuggestions,
    });
  } catch (error) {
    console.error('Search suggest error:', error);
    // 出错时返回基于输入的热门搜索
    const fallbackQuery = request.nextUrl.searchParams.get('q') || '';
    return NextResponse.json({
      suggestions: POPULAR_KEYWORDS.filter(
        (kw) => !fallbackQuery || kw.text.includes(fallbackQuery.trim())
      ).slice(0, parseInt(request.nextUrl.searchParams.get('limit') || '5')),
    });
  }
}
