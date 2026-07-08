'use client';

import { useState, useEffect } from 'react';
import FrontendWrapper from '@/components/frontend-wrapper';

interface Worker {
  id: string;
  name: string;
  title: string;
  department: string;
  story: string;
  imageUrl: string | null;
  orderIndex: number;
}

// 将 HTML 转换为纯文本摘要
function stripHtml(html: string): string {
  if (!html) return '';
  // 先移除 HTML 标签
  let text = html.replace(/<[^>]*>/g, '');
  // 解码 HTML 实体
  text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  // 移除多余的换行和制表符，但保留连续空格
  text = text.replace(/[\t\n\r\f\v]+/g, ' ').trim();
  return text;
}

function WorkersContent() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workers');
      if (!response.ok) {
        throw new Error('获取数据失败');
      }
      const data = await response.json();
      setWorkers(data);
    } catch (err) {
      setError('加载数据失败，请稍后重试');
      console.error('Error fetching workers:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchWorkers}
            className="mt-4 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // 显示劳动者数据（不再使用硬编码 fallback）
  const displayWorkers = workers;

  // 分页计算
  const totalPages = Math.ceil(displayWorkers.length / pageSize);
  const paginatedWorkers = displayWorkers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">最美劳动者</h1>
        <p className="mt-2 text-gray-600">致敬那些默默奉献、建功立业的劳动者</p>
      </div>

      {/* 劳动者卡片网格 */}
      {displayWorkers.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <p className="text-gray-500 text-lg">暂无劳动者数据</p>
          <p className="text-gray-400 text-sm mt-2">请联系管理员添加劳动者信息</p>
        </div>
      ) : (
      <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedWorkers.map((worker) => (
          <div
            key={worker.id}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* 卡片头部 */}
            <div className="bg-gradient-to-br from-[#b71c1c] to-[#8b0000] text-white p-6 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center overflow-hidden relative">
                {worker.imageUrl ? (
                  <img
                    src={worker.imageUrl}
                    alt={worker.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <h2 className="text-xl font-bold">{worker.name}</h2>
              <p className="text-white/90 mt-1">{worker.title}</p>
              <div className="mt-2 text-sm text-white/80">
                {worker.department}
              </div>
            </div>

            {/* 卡片内容 */}
            <div className="p-6">
              <p className="text-gray-700 text-sm mb-4 line-clamp-3 whitespace-pre-wrap">
                {stripHtml(worker.story)}
              </p>

              {/* 查看详情按钮 */}
              <button
                onClick={() => setSelectedWorker(worker)}
                className="w-full bg-[#b71c1c] text-white py-2 px-4 rounded-md hover:bg-[#8b0000] transition-colors text-sm"
              >
                了解更多
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-[#b71c1c] text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
        </div>
      )}
      </>
      )}

      {/* 评选标准 */}
      <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">评选标准</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">爱岗敬业</h3>
            <p className="text-sm text-gray-600">热爱本职工作，勤勉尽责</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">勇于创新</h3>
            <p className="text-sm text-gray-600">积极改进，追求卓越</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">团结协作</h3>
            <p className="text-sm text-gray-600">团队合作，共同进步</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">业绩突出</h3>
            <p className="text-sm text-gray-600">工作成绩显著，贡献突出</p>
          </div>
        </div>
      </div>

      {/* 详情弹窗 */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in">
            {/* 弹窗头部 */}
            <div className="bg-gradient-to-br from-[#b71c1c] to-[#8b0000] text-white p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 flex-shrink-0 relative">
                    {selectedWorker.imageUrl ? (
                      <img
                        src={selectedWorker.imageUrl}
                        alt={selectedWorker.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-full h-full p-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedWorker.name}</h2>
                    <p className="text-white/90 mt-1">{selectedWorker.title}</p>
                    <p className="text-sm text-white/80 mt-1">{selectedWorker.department}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWorker(null)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 弹窗内容 - 富文本 */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <h3 className="text-lg font-bold text-gray-900 mb-4">先进事迹</h3>
              <div
                className="rich-text-content max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedWorker.story }}
              />
            </div>

            {/* 弹窗底部 */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedWorker(null)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function WorkersPage() {
  return <FrontendWrapper><WorkersContent /></FrontendWrapper>;
}
