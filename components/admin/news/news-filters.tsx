'use client';

import { NewsCategory } from '@/hooks/useNewsManagement';

interface NewsFiltersProps {
  searchTerm: string;
  categoryFilter: string;
  categories: NewsCategory[];
  onSearchTermChange: (term: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onClear: () => void;
  onFilterChange: (category: string) => void;
  onCategoryModalOpen: () => void;
}

export default function NewsFilters({
  searchTerm,
  categoryFilter,
  categories,
  onSearchTermChange,
  onSearch,
  onClear,
  onFilterChange,
  onCategoryModalOpen,
}: NewsFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={onSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="搜索新闻标题..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent text-sm"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-[#b71c1c] text-white text-sm font-semibold rounded-lg hover:bg-[#8b0000] transition-colors"
          >
            搜索
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={onClear}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              清除
            </button>
          )}
        </form>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              categoryFilter === 'all'
                ? 'bg-[#b71c1c] text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onFilterChange(cat.name)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                categoryFilter === cat.name
                  ? 'bg-[#b71c1c] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
              {cat.name}
            </button>
          ))}
          <button
            onClick={onCategoryModalOpen}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
            title="管理分类"
          >
            ⚙️ 分类管理
          </button>
        </div>
      </div>
    </div>
  );
}
