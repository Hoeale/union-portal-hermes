'use client';

import { NewsCategory } from '@/hooks/useNewsManagement';

interface CategoryModalProps {
  categories: NewsCategory[];
  newCategoryName: string;
  newCategoryColor: string;
  onClose: () => void;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onCreate: () => void;
  onDelete: (id: string, name: string) => void;
}

export default function CategoryModal({
  categories,
  newCategoryName,
  newCategoryColor,
  onClose,
  onNameChange,
  onColorChange,
  onCreate,
  onDelete,
}: CategoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">分类管理</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          {/* 添加新分类 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">添加新分类</h4>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="分类名称"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                title="分类颜色"
              />
              <button
                onClick={onCreate}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
              >
                添加
              </button>
            </div>
          </div>

          {/* 分类列表 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">现有分类</h4>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">暂无分类</p>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: cat.color || '#666' }}
                      />
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                      <span className="text-xs text-gray-500">({cat.newsCount || 0} 条新闻)</span>
                    </div>
                    <button
                      onClick={() => onDelete(cat.id, cat.name)}
                      className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-4">
              提示：删除分类时，该分类下的新闻将移至"未分类"
            </p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
