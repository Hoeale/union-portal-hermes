'use client';

import { useState, useEffect } from 'react';
import FrontendWrapper from '@/components/frontend-wrapper';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faAnglesLeft, faAnglesRight } from '@fortawesome/free-solid-svg-icons';

interface Policy {
  id: string;
  title: string;
  category: string;
  publishDate: string;
  source: string;
  fileUrl: string | null;
  fileName: string | null;
  enableDownload: boolean;
  content: string;
  isActive: boolean;
}

function PoliciesContent() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchPolicies();
    fetchCategories();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/policies');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPolicies(data);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/policy-categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.map((c: any) => c.name));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredPolicies = filterCategory === 'all'
    ? policies
    : policies.filter(p => p.category === filterCategory);

  // 分页计算
  const totalPages = Math.ceil(filteredPolicies.length / pageSize);
  const paginatedPolicies = filteredPolicies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 生成分页按钮（与新闻中心一致）
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
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
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">政策文件</h1>
              <p className="text-white/90 text-lg">查看最新的政策法规和相关文件</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-12">
        {/* 分类筛选 */}
        {categories.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8 border border-[hsl(var(--card-border))]">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setFilterCategory('all'); setCurrentPage(1); }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filterCategory === 'all'
                    ? 'bg-[#b71c1c] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setFilterCategory(cat); setCurrentPage(1); }}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    filterCategory === cat
                      ? 'bg-[#b71c1c] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 政策列表 */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#b71c1c]"></div>
            <p className="mt-3 text-gray-500">加载中...</p>
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg">暂无政策文件</p>
          </div>
        ) : (
          <>
          <div className="bg-white rounded-xl shadow-sm border border-[hsl(var(--card-border))] overflow-hidden">
            <div className="divide-y divide-gray-200">
              {paginatedPolicies.map((policy) => (
                <Link
                  key={policy.id}
                  href={`/policies/${policy.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 text-xs font-semibold bg-[#b71c1c]/10 text-[#b71c1c] rounded-full">
                          {policy.category}
                        </span>
                        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                          {policy.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[hsl(var(--foreground-muted))]">
                        <span>发布日期：{policy.publishDate}</span>
                        {policy.source && <span>来源：{policy.source}</span>}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 分页控制 */}
          {totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  共 {filteredPolicies.length} 条
                </div>

                <div className="flex items-center gap-1">
                  {/* 首页 */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="首页"
                  >
                    <FontAwesomeIcon icon={faAnglesLeft} />
                  </button>

                  {/* 上一页 */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
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
                          currentPage === pageNum
                            ? 'bg-[#b71c1c] text-white border border-[#b71c1c]'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}

                  {/* 下一页 */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="下一页"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>

                  {/* 末页 */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="末页"
                  >
                    <FontAwesomeIcon icon={faAnglesRight} />
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  第 {currentPage} / {totalPages} 页
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PoliciesPage() {
  return <FrontendWrapper><PoliciesContent /></FrontendWrapper>;
}
