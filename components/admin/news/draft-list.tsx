'use client';

import { Draft } from '@/hooks/useNewsManagement';

interface DraftListProps {
  drafts: Draft[];
  onPublishDraft: (id: string) => void;
  onPreviewDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
}

export default function DraftList({
  drafts,
  onPublishDraft,
  onPreviewDraft,
  onDeleteDraft,
}: DraftListProps) {
  if (drafts.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        <p>暂无草稿</p>
        <p className="text-sm mt-1">在发布新闻表单中点击"存为草稿"创建草稿</p>
      </div>
    );
  }

  return (
    <div>
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">草稿列表</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">标题</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">分类</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">更新时间</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {drafts.map((draft) => (
              <tr key={draft.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{draft.title}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-[#b71c1c]/10 text-[#b71c1c]">
                    {draft.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(draft.updatedAt).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => onPublishDraft(draft.id)}
                    className="text-orange-600 hover:text-orange-900 mr-4 font-medium"
                  >
                    发布
                  </button>
                  <button
                    onClick={() => onPreviewDraft(draft.id)}
                    className="text-green-600 hover:text-green-900 mr-4 font-medium"
                  >
                    预览
                  </button>
                  <button
                    onClick={() => onDeleteDraft(draft.id)}
                    className="text-red-600 hover:text-red-900 font-medium"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
