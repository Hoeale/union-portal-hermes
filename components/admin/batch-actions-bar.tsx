'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle, faTrash, faTag, faImage,
  faTimesCircle, faExclamationTriangle, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { useCsrfToken } from '@/hooks';

interface BatchActionsBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onActionComplete: () => void;
  apiEndpoint: string;
  actions?: {
    publish?: { label: string; value: string };
    unpublish?: { label: string; value: string };
    activate?: { label: string; value: string };
    deactivate?: { label: string; value: string };
    delete?: { label: string; value: string };
    updateCategory?: { label: string; value: string; options: { label: string; value: string }[] };
    setCarousel?: { label: string; value: string };
    unsetCarousel?: { label: string; value: string };
  };
}

export default function BatchActionsBar({
  selectedIds,
  onClearSelection,
  onActionComplete,
  apiEndpoint,
  actions = {},
}: BatchActionsBarProps) {
  const csrfToken = useCsrfToken();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (selectedIds.length === 0) return null;

  const handleBatchAction = async (action: string, extraData?: Record<string, any>) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          action,
          ids: selectedIds,
          data: extraData,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: `成功 ${data.data.successCount} 条，失败 ${data.data.failCount} 条`,
        });
        onActionComplete();
        onClearSelection();
      } else {
        setResult({ success: false, message: data.error || '操作失败' });
      }
    } catch (error) {
      console.error('Batch action error:', error);
      setResult({ success: false, message: '网络错误，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryUpdate = () => {
    if (!selectedCategory) return;
    handleBatchAction('update_category', { category: selectedCategory });
    setShowCategoryModal(false);
    setSelectedCategory('');
  };

  return (
    <>
      {/* 批量操作栏 */}
      <div className="sticky top-16 z-20 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-800">
              已选择 <span className="text-blue-600 font-bold">{selectedIds.length}</span> 条
            </span>
            <button
              onClick={onClearSelection}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              取消选择
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 发布/启用 */}
            {actions.publish && (
              <button
                onClick={() => handleBatchAction(actions.publish!.value)}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                {actions.publish.label}
              </button>
            )}
            {actions.activate && (
              <button
                onClick={() => handleBatchAction(actions.activate!.value)}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                {actions.activate.label}
              </button>
            )}

            {/* 下架/停用 */}
            {actions.unpublish && (
              <button
                onClick={() => handleBatchAction(actions.unpublish!.value)}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTimesCircle} className="mr-1" />
                {actions.unpublish.label}
              </button>
            )}
            {actions.deactivate && (
              <button
                onClick={() => handleBatchAction(actions.deactivate!.value)}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTimesCircle} className="mr-1" />
                {actions.deactivate.label}
              </button>
            )}

            {/* 设置轮播 */}
            {actions.setCarousel && (
              <button
                onClick={() => handleBatchAction(actions.setCarousel!.value)}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faImage} className="mr-1" />
                {actions.setCarousel.label}
              </button>
            )}

            {/* 取消轮播 */}
            {actions.unsetCarousel && (
              <button
                onClick={() => handleBatchAction(actions.unsetCarousel!.value)}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTimesCircle} className="mr-1" />
                {actions.unsetCarousel.label}
              </button>
            )}

            {/* 修改分类 */}
            {actions.updateCategory && (
              <button
                onClick={() => setShowCategoryModal(true)}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faTag} className="mr-1" />
                {actions.updateCategory.label}
              </button>
            )}

            {/* 删除 */}
            {actions.delete && (
              <button
                onClick={() => {
                  if (confirm(`确定要删除选中的 ${selectedIds.length} 条内容吗？此操作不可撤销。`)) {
                    handleBatchAction(actions.delete!.value);
                  }
                }}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={loading ? faSpinner : faTrash} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
                {actions.delete.label}
              </button>
            )}
          </div>
        </div>

        {/* 结果提示 */}
        {result && (
          <div className={`mt-3 text-sm flex items-center gap-2 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            <FontAwesomeIcon icon={result.success ? faCheckCircle : faExclamationTriangle} />
            {result.message}
            <button onClick={() => setResult(null)} className="ml-2 underline">
              关闭
            </button>
          </div>
        )}
      </div>

      {/* 修改分类弹窗 */}
      {showCategoryModal && actions.updateCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">修改分类</h3>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择分类</option>
              {actions.updateCategory.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                取消
              </button>
              <button
                onClick={handleCategoryUpdate}
                disabled={!selectedCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
