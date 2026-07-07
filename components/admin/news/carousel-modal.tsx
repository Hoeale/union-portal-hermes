'use client';

import { News } from '@/hooks/useNewsManagement';

interface CarouselModalProps {
  carouselNews: News[];
  totalCarousel: number;
  onClose: () => void;
  onAutoSort: () => void;
  onUpdateOrder: (id: string, order: number) => void;
}

export default function CarouselModal({
  carouselNews,
  totalCarousel,
  onClose,
  onAutoSort,
  onUpdateOrder,
}: CarouselModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">轮播图排序</h3>
              <p className="text-xs text-gray-500 mt-0.5">最多展示5张，当前 {totalCarousel} 张</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onAutoSort}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                title="自动排序，从0开始分配"
              >
                自动排序
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {carouselNews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>暂无轮播图</p>
                <p className="text-sm mt-1">只有已发布的新闻才能设置为轮播图</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carouselNews.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-700 rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt=""
                        className="w-16 h-12 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.category}</div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <label className="text-xs text-gray-600">排序:</label>
                      <input
                        type="number"
                        value={item.carousel_order ?? index}
                        onChange={(e) => onUpdateOrder(item.id, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            {carouselNews.length > 5 ? (
              <div className="text-sm text-orange-600">
                ⚠️ 轮播图超过5张，请在编辑新闻时取消多余的轮播设置
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                提示：首页轮播图最多展示5张
              </div>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
