'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import FrontendWrapper from '@/components/frontend-wrapper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNewspaper, faBullhorn, faClipboardList, faAngleRight, faChevronLeft, faChevronRight, faAnglesLeft, faAnglesRight, faFolderOpen } from '@fortawesome/free-solid-svg-icons';

interface News {
  id: string;
  title: string;
  category: string;
  content: string;
  image_url: string | null;
  is_carousel: boolean;
  carousel_order: number | null;
  published_at: string;
  created_at: string;
}

interface PaginationData {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

// 默认图标映射（根据分类名称）
const CATEGORY_ICONS: Record<string, any> = {
  '工会动态': faNewspaper,
  '通知要闻': faBullhorn,
  '公示公告': faClipboardList,
};

function getCategoryIcon(name: string): any {
  return CATEGORY_ICONS[name] || faFolderOpen;
}

// 每页条数选项
const PAGE_SIZE_OPTIONS = [10, 20, 50];

function NewsCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  
  // 从 URL 参数获取分类
  const categoryFromUrl = searchParams.get('category');
  const [news, setNews] = useState<News[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  // 获取分类列表
  useEffect(() => {
    fetch('/api/news-categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          // 优先从 URL 参数获取分类，其次从 localStorage，最后默认第一个
          if (categoryFromUrl && data.find((c: Category) => c.name === categoryFromUrl)) {
            setActiveCategory(categoryFromUrl);
          } else {
            const savedCategory = localStorage.getItem('news_active_category');
            if (savedCategory && data.find((c: Category) => c.name === savedCategory)) {
              setActiveCategory(savedCategory);
            } else {
              setActiveCategory(data[0].name);
            }
          }
        }
        setCategoriesLoaded(true);
      })
      .catch(err => {
        console.error('Failed to fetch categories:', err);
        setCategoriesLoaded(true);
      });
  }, [categoryFromUrl]);

  // 保存选中的分类到 localStorage
  useEffect(() => {
    if (activeCategory) {
      localStorage.setItem('news_active_category', activeCategory);
    }
  }, [activeCategory]);

  const currentCategory = categories.find(c => c.name === activeCategory);

  useEffect(() => {
    if (!activeCategory || !categoriesLoaded) return;
    
    const fetchNews = async () => {
      setLoading(true);
      try {
        // 添加时间戳参数绕过缓存
        const timestamp = Date.now();
        const response = await fetch(
          `/api/news?category=${encodeURIComponent(activeCategory)}&page=${pagination.page}&pageSize=${pagination.pageSize}&_t=${timestamp}`
        );
        if (response.ok) {
          const result = await response.json();
          setNews(result.data || []);
          setPagination(result.pagination || pagination);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [activeCategory, categoriesLoaded, pagination.page, pagination.pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, page: newPage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination({ ...pagination, pageSize: newSize, page: 1 });
  };

  // 生成分页按钮
  const getPageNumbers = () => {
    const { page, totalPages } = pagination;
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="bg-[hsl(var(--background))] min-h-screen">
      {/* 页面标题 */}
      <div className="gradient-primary text-white py-12 lg:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">新闻中心</h1>
              <p className="text-white/90 text-lg">了解最新的工会动态、通知要闻和公示公告</p>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
              <div className="bg-[hsl(var(--primary))] px-5 py-4">
                <h3 className="text-lg font-bold text-white">
                  <FontAwesomeIcon icon={faNewspaper} className="mr-2" />
                  栏目分类
                </h3>
              </div>
              <nav className="p-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.name);
                      setPagination({ ...pagination, page: 1 });
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg mb-2 transition-all text-left ${
                      activeCategory === cat.name
                        ? 'bg-[hsl(var(--primary))] text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FontAwesomeIcon icon={getCategoryIcon(cat.name)} className="text-base" />
                    <span className="font-medium">{cat.name}</span>
                    <FontAwesomeIcon icon={faAngleRight} className="ml-auto text-xs opacity-50" />
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">
                  <span className="inline-block w-1 h-6 bg-[hsl(var(--primary))] rounded-full mr-3" />
                  {currentCategory?.name}
                </h2>
                <span className="text-sm text-[hsl(var(--foreground-muted))]">共 {pagination.total} 条</span>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-gray-100 h-12 rounded animate-pulse" />
                  ))}
                </div>
              ) : news.length === 0 ? (
                <div className="text-center py-16 text-[hsl(var(--foreground-muted))]">
                  <FontAwesomeIcon icon={faClipboardList} className="text-5xl mb-4 opacity-30" />
                  <p>暂无相关内容</p>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-gray-100">
                    {news.map((item) => (
                      <li key={item.id} className="py-4 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                        <Link
                          href={`/view/${new Date(item.published_at).toISOString().slice(0,10).replace(/-/g,'')}/${item.id.replace(/-/g,'').substring(0,5)}`}
                          className="flex items-center justify-between group"
                        >
                          <span className="flex-1 text-[hsl(var(--foreground))] text-base font-medium truncate group-hover:text-[hsl(var(--primary))] transition-colors">
                            <span className="inline-block w-2 h-2 bg-[hsl(var(--primary))] rounded-full mr-3 opacity-60" />
                            {item.title}
                          </span>
                          <span className="text-[hsl(var(--foreground-muted))] text-sm ml-4 whitespace-nowrap">
                            {new Date(item.published_at).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            })}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {/* 分页控制 */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* 每页条数选择 */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>每页显示</span>
                        <select
                          value={pagination.pageSize}
                          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
                        >
                          {PAGE_SIZE_OPTIONS.map(size => (
                            <option key={size} value={size}>{size}条</option>
                          ))}
                        </select>
                      </div>

                      {/* 分页按钮 */}
                      <div className="flex items-center gap-1">
                        {/* 首页 */}
                        <button
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.page === 1}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="首页"
                        >
                          <FontAwesomeIcon icon={faAnglesLeft} />
                        </button>

                        {/* 上一页 */}
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="上一页"
                        >
                          <FontAwesomeIcon icon={faChevronLeft} />
                        </button>

                        {/* 页码 */}
                        {getPageNumbers().map((pageNum, idx) => (
                          typeof pageNum === 'string' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-gray-500">
                              {pageNum}
                            </span>
                          ) : (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum as number)}
                              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                pagination.page === pageNum
                                  ? 'bg-[hsl(var(--primary))] text-white border border-[hsl(var(--primary))]'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        ))}

                        {/* 下一页 */}
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="下一页"
                        >
                          <FontAwesomeIcon icon={faChevronRight} />
                        </button>

                        {/* 末页 */}
                        <button
                          onClick={() => handlePageChange(pagination.totalPages)}
                          disabled={pagination.page === pagination.totalPages}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="末页"
                        >
                          <FontAwesomeIcon icon={faAnglesRight} />
                        </button>
                      </div>

                      {/* 页码信息 */}
                      <div className="text-sm text-gray-600">
                        第 {pagination.page} / {pagination.totalPages} 页
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function NewsCenterPage() {
  return (
    <FrontendWrapper>
      <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">加载中...</div>}>
        <NewsCenterContent />
      </Suspense>
    </FrontendWrapper>
  );
}
