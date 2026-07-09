'use client';

import { NewsCategory, NewsStatusFilter } from '@/hooks/useNewsManagement';

interface NewsStatsProps {
  total: number;
  totalAllNews: number;
  totalCarousel: number;
  categories: NewsCategory[];
  statusFilter: NewsStatusFilter;
  onCarouselClick: () => void;
}

export default function NewsStats({
  total,
  totalAllNews,
  totalCarousel,
  categories,
  statusFilter,
  onCarouselClick,
}: NewsStatsProps) {
  const displayTotal = () => {
    switch (statusFilter) {
      case 'pending':
      case 'published':
        return total;
      case 'all':
      default:
        return totalAllNews;
    }
  };

  const statusLabel = () => {
    switch (statusFilter) {
      case 'pending':
        return '待发布';
      case 'published':
        return '已发布';
      default:
        return '总数';
    }
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="text-3xl font-bold text-[#b71c1c]">{displayTotal()}</div>
        <div className="text-sm text-gray-600 mt-1">{statusLabel()}</div>
      </div>
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="bg-white rounded-xl shadow-sm p-4 border border-gray-200"
        >
          <div className="text-3xl font-bold" style={{ color: cat.color || '#666' }}>
            {cat.newsCount || 0}
          </div>
          <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
            {cat.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
            {cat.name}
          </div>
        </div>
      ))}
      <div
        className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onCarouselClick}
        title="点击管理轮播图排序"
      >
        <div className="text-3xl font-bold text-purple-600">
          {totalCarousel || 0}
        </div>
        <div className="text-sm text-gray-600 mt-1">轮播图（最多5张）</div>
      </div>
    </div>
  );
}
