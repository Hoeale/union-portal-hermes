'use client';

import { NewsCategory } from '@/hooks/useNewsManagement';

interface NewsStatsProps {
  total: number;
  totalCarousel: number;
  categories: NewsCategory[];
  onCategoryClick: (categoryName: string) => void;
  onCarouselClick: () => void;
  onStatusFilterChange: (status: 'all' | 'pending' | 'draft' | 'scheduled') => void;
  onPageChange: (page: number) => void;
}

export default function NewsStats({
  total,
  totalCarousel,
  categories,
  onCategoryClick,
  onCarouselClick,
  onStatusFilterChange,
  onPageChange,
}: NewsStatsProps) {
  return (
    <div className="grid grid-cols-5 gap-4">
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="text-3xl font-bold text-[#b71c1c]">{total}</div>
        <div className="text-sm text-gray-600 mt-1">总数</div>
      </div>
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            onStatusFilterChange('all');
            onCategoryClick(cat.name);
            onPageChange(1);
          }}
          title={`点击查看${cat.name}列表`}
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
