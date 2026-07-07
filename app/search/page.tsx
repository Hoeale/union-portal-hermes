'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FrontendWrapper from '@/components/frontend-wrapper';
import SearchSuggestDropdown from '@/components/search-suggest-dropdown';
import { Search, Filter, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  category: string;
  type: string;
  excerpt: string;
  publishedAt: string;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || '';
  const initialPage = parseInt(searchParams.get('page') || '1');

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!initialQuery);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const pageSize = 10;

  // 高级筛选
  const [filterType, setFilterType] = useState(initialType);
  const [showFilters, setShowFilters] = useState(false);

  // 执行搜索
  const performSearch = useCallback(
    async (
      searchQuery: string,
      type?: string,
      category?: string,
      page?: number
    ) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setSearched(false);
        setTotal(0);
        setTotalPages(0);
        return;
      }

      setLoading(true);
      setSearched(true);

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          page: String(page || 1),
          pageSize: String(pageSize),
        });

        if (type) params.set('type', type);
        if (category) params.set('category', category);

        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setResults(data.data || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 0);
        } else {
          setResults([]);
          setTotal(0);
          setTotalPages(0);
        }

        // 异步记录搜索日志，不阻塞主流程
        fetch('/api/search/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: searchQuery,
            type: type || '',
            resultCount: data.total || 0,
          }),
        }).catch((err) =>
          console.error('Failed to log search:', err)
        );
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 初始加载时执行搜索
  useEffect(() => {
    if (initialQuery.trim()) {
      performSearch(initialQuery, initialType, '', initialPage);
    }
  }, []);

  // 处理搜索
  const handleSearch = useCallback(
    (searchQuery: string) => {
      setCurrentPage(1);
      performSearch(searchQuery, filterType, '', 1);
      router.push(
        `/search/?q=${encodeURIComponent(searchQuery)}${
          filterType ? `&type=${filterType}` : ''
        }`
      );
    },
    [filterType, performSearch, router]
  );

  // 处理筛选变化
  const handleFilterChange = (type: string) => {
    setFilterType(type);
    setCurrentPage(1);
    if (query.trim()) {
      performSearch(query, type, '', 1);
      router.push(
        `/search/?q=${encodeURIComponent(query)}${
          type ? `&type=${type}` : ''
        }`
      );
    }
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    performSearch(query, filterType, '', page);
    router.push(
      `/search/?q=${encodeURIComponent(query)}${
        filterType ? `&type=${filterType}` : ''
      }&page=${page}`
    );
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 高亮关键词
  const highlightKeyword = (text: string, keyword: string) => {
    if (!keyword || !text) return text;
    const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 text-inherit px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // 热门搜索快捷搜索
  const handleQuickSearch = (keyword: string) => {
    setQuery(keyword);
    setCurrentPage(1);
    performSearch(keyword, filterType, '', 1);
    router.push(
      `/search/?q=${encodeURIComponent(keyword)}${
        filterType ? `&type=${filterType}` : ''
      }`
    );
  };

  // 获取类型链接
  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case 'news':
        return `/news/${result.id}`;
      case 'policy':
        return `/policies/${result.id}`;
      case 'service':
        return `/services/${result.id}`;
      default:
        return `/view/${result.id}`;
    }
  };

  // 获取类型标签样式
  const getTypeBadgeStyle = (type: string) => {
    const styles: Record<string, string> = {
      news: 'bg-blue-50 text-blue-700 border-blue-200',
      policy: 'bg-green-50 text-green-700 border-green-200',
      service: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return styles[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      news: '新闻中心',
      policy: '政策文件',
      service: '办事服务',
    };
    return labels[type] || type;
  };

  // 分页组件
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++)
          pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg border border-[hsl(var(--card-border))] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[hsl(var(--muted))] transition-colors"
          aria-label="上一页"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((page, index) =>
          typeof page === 'string' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-[hsl(var(--foreground-muted))]">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 rounded-lg min-w-[40px] transition-colors ${
                page === currentPage
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : 'border border-[hsl(var(--card-border))] hover:bg-[hsl(var(--muted))]'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg border border-[hsl(var(--card-border))] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[hsl(var(--muted))] transition-colors"
          aria-label="下一页"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
      {/* 页面标题 */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-8 bg-[hsl(var(--primary))] rounded-full" />
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[hsl(var(--foreground))]">
              搜索结果
            </h1>
            <p className="mt-2 text-[hsl(var(--foreground-muted))]">
              查找新闻中心、政策文件和办事服务
            </p>
          </div>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="mb-6 animate-slide-up">
        <div className="max-w-2xl mx-auto">
          <SearchSuggestDropdown
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            placeholder="输入关键词搜索..."
          />
        </div>
      </div>

      {/* 高级筛选 */}
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--primary))] transition-colors mx-auto"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? '收起筛选' : '高级筛选'}
        </button>

        {showFilters && (
          <div className="mt-4 p-4 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--card-border))] animate-fade-in">
            {/* 类型筛选 */}
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                内容类型
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleFilterChange('')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    !filterType
                      ? 'bg-[hsl(var(--primary))] text-white'
                      : 'bg-[hsl(var(--background))] border border-[hsl(var(--card-border))] hover:border-[hsl(var(--primary))]'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => handleFilterChange('news')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterType === 'news'
                      ? 'bg-blue-600 text-white'
                      : 'bg-[hsl(var(--background))] border border-[hsl(var(--card-border))] hover:border-blue-400'
                  }`}
                >
                  新闻中心
                </button>
                <button
                  onClick={() => handleFilterChange('policy')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterType === 'policy'
                      ? 'bg-green-600 text-white'
                      : 'bg-[hsl(var(--background))] border border-[hsl(var(--card-border))] hover:border-green-400'
                  }`}
                >
                  政策文件
                </button>
                <button
                  onClick={() => handleFilterChange('service')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterType === 'service'
                      ? 'bg-purple-600 text-white'
                      : 'bg-[hsl(var(--background))] border border-[hsl(var(--card-border))] hover:border-purple-400'
                  }`}
                >
                  办事服务
                </button>
              </div>
            </div>

            {/* 清除筛选 */}
            {filterType && (
              <div className="mt-4 pt-4 border-t border-[hsl(var(--card-border))]">
                <button
                  onClick={() => handleFilterChange('')}
                  className="text-sm text-[hsl(var(--primary))] hover:underline"
                >
                  清除筛选
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 搜索结果 */}
      {searched && (
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-12 text-[hsl(var(--foreground-muted))]">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-[hsl(var(--primary))] border-t-transparent mx-auto mb-4"></div>
              搜索中...
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 card">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-[hsl(var(--foreground))] text-lg">
                未找到相关内容
              </p>
              <p className="text-[hsl(var(--foreground-muted))] text-sm mt-2">
                请尝试其他关键词或调整筛选条件
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between text-sm text-[hsl(var(--foreground-muted))]">
                <span>
                  找到{' '}
                  <span className="font-bold text-[hsl(var(--primary))]">
                    {total}
                  </span>{' '}
                  条相关结果
                </span>
                {filterType && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    当前筛选:
                    {filterType && (
                      <span className="px-2 py-0.5 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] rounded">
                        {getTypeLabel(filterType)}
                      </span>
                    )}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {results.map((item) => (
                  <a
                    key={item.id}
                    href={getResultLink(item)}
                    className="block card card-hover p-5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors line-clamp-2">
                          {highlightKeyword(item.title, query)}
                        </h3>
                        <p className="mt-2 text-sm text-[hsl(var(--foreground-muted))] line-clamp-2">
                          {highlightKeyword(
                            item.excerpt.replace(/<[^>]*>/g, '').substring(
                              0,
                              200
                            ),
                            query
                          )}
                          ...
                        </p>
                        <div className="mt-3 flex items-center gap-3 text-sm text-[hsl(var(--foreground-muted))]">
                          <span>
                            {new Date(item.publishedAt).toLocaleDateString(
                              'zh-CN'
                            )}
                          </span>
                          <span>·</span>
                          <span>{item.category}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${getTypeBadgeStyle(
                            item.type
                          )}`}
                        >
                          {getTypeLabel(item.type)}
                        </span>
                        <span className="text-xs text-[hsl(var(--foreground-muted))]">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              {/* 分页 */}
              <Pagination />
            </>
          )}
        </div>
      )}

      {/* 热门搜索 */}
      {!searched && (
        <div className="max-w-4xl mx-auto animate-slide-up">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[hsl(var(--accent))] rounded-full" />
              热门搜索
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                '工会福利',
                '职工培训',
                '劳模评选',
                '法律援助',
                '困难帮扶',
                '医疗互助',
                '五一表彰',
                '入会指南',
              ].map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => handleQuickSearch(keyword)}
                  className="px-5 py-2 bg-[hsl(var(--background))] text-[hsl(var(--foreground-muted))] rounded-full hover:bg-[hsl(var(--primary))] hover:text-white border border-[hsl(var(--card-border))] hover:border-[hsl(var(--primary))] transition-all font-medium"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <FrontendWrapper>
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-12 text-center">
            加载中...
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </FrontendWrapper>
  );
}
