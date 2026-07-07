'use client';

import HomeSectionPreview from './home-section-preview';

interface HomeSection {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  order: number;
  config?: Record<string, any>;
}

interface LayoutPreviewProps {
  sections: HomeSection[];
}

export default function LayoutPreview({ sections }: LayoutPreviewProps) {
  const visibleSections = sections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
      {/* 预览标题 */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#1e2b3c]">首页实时预览</h3>
        <span className="text-xs text-gray-500">{visibleSections.length} 个区块可见</span>
      </div>

      {/* 缩略首页容器 */}
      <div className="p-3 overflow-y-auto max-h-[600px]">
        <div
          className="bg-white rounded-lg shadow-sm overflow-hidden origin-top"
          style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}
        >
          {visibleSections.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <p className="text-sm">暂无可见区块</p>
              <p className="text-xs mt-1">请开启至少一个区块</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {visibleSections.map(section => (
                <div key={section.id} className="p-3">
                  <HomeSectionPreview sectionId={section.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 提示 */}
      <div className="bg-[#fff3cd] px-4 py-2 text-xs text-[#856404] border-t border-[#ffeeba]">
        提示：拖拽左侧列表可调整区块顺序，预览将实时更新
      </div>
    </div>
  );
}
