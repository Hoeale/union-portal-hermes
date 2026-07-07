'use client';

import { useState, useEffect } from 'react';
import { useCsrfToken } from '@/hooks';

interface DiffResult {
  added: string[];
  removed: string[];
  modified: boolean;
}

interface DiffData {
  title: DiffResult;
  content: DiffResult;
  category: DiffResult;
}

interface CompareStats {
  titleChanges: number;
  contentChanges: number;
  categoryChanges: number;
  totalChanges: number;
}

interface VersionData {
  version: number;
  title: string;
  content: string;
  category: string | null;
  changeLog: string | null;
  createdAt: string;
}

interface CompareResult {
  oldVersion: VersionData;
  newVersion: VersionData;
  diff: DiffData;
  stats: CompareStats;
}

interface VersionCompareProps {
  contentId: string;
  versionId1: string;
  versionId2: string;
  onClose: () => void;
}

export default function VersionCompare({ contentId, versionId1, versionId2, onClose }: VersionCompareProps) {
  const csrfToken = useCsrfToken();
  const [loading, setLoading] = useState(true);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [activeTab, setActiveTab] = useState<'title' | 'content' | 'category'>('content');

  useEffect(() => {
    fetchCompare();
  }, [versionId1, versionId2]);

  const fetchCompare = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/news/${contentId}/versions/compare`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ versionId1, versionId2 }),
      });

      const result = await response.json();
      if (result.success) {
        setCompareResult(result.data);
      } else {
        alert(result.error || '对比失败');
      }
    } catch (error) {
      console.error('Failed to compare versions:', error);
      alert('对比失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 渲染带差异高亮的内容
  const renderDiffContent = (oldStr: string, newStr: string, diff: DiffResult) => {
    if (!diff.modified) {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">无变更</p>
            <div dangerouslySetInnerHTML={{ __html: newStr }} />
          </div>
        </div>
      );
    }

    // 简单的高亮显示：将内容按段落分割，显示差异
    const oldSegments = oldStr.split(/(<[^>]+>|[\n\r]+)/).filter(Boolean);
    const newSegments = newStr.split(/(<[^>]+>|[\n\r]+)/).filter(Boolean);

    // 使用LCS算法标记差异
    const m = oldSegments.length;
    const n = newSegments.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (oldSegments[i - 1] === newSegments[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // 回溯标记
    const oldMarked: { segment: string; type: 'equal' | 'removed' }[] = [];
    const newMarked: { segment: string; type: 'equal' | 'added' }[] = [];

    let i = m;
    let j = n;
    const result: { type: string; oldSegment?: string; newSegment?: string }[] = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldSegments[i - 1] === newSegments[j - 1]) {
        result.unshift({ type: 'equal', oldSegment: oldSegments[i - 1], newSegment: newSegments[j - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.unshift({ type: 'added', newSegment: newSegments[j - 1] });
        j--;
      } else if (i > 0) {
        result.unshift({ type: 'removed', oldSegment: oldSegments[i - 1] });
        i--;
      }
    }

    // 分别渲染旧版本和新版本
    return (
      <div className="space-y-4">
        {/* 旧版本 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">旧版本内容</p>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            {result
              .filter((r) => r.type !== 'added')
              .map((r, idx) => (
                <span
                  key={idx}
                  className={
                    r.type === 'removed'
                      ? 'bg-red-200 text-red-800 line-through px-1 rounded'
                      : ''
                  }
                  dangerouslySetInnerHTML={{
                    __html: r.oldSegment || '',
                  }}
                />
              ))}
          </div>
        </div>

        {/* 新版本 */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">新版本内容</p>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            {result
              .filter((r) => r.type !== 'removed')
              .map((r, idx) => (
                <span
                  key={idx}
                  className={
                    r.type === 'added'
                      ? 'bg-green-200 text-green-800 px-1 rounded font-medium'
                      : ''
                  }
                  dangerouslySetInnerHTML={{
                    __html: r.newSegment || '',
                  }}
                />
              ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden">
            <div className="p-12 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#b71c1c]"></div>
              <p className="mt-3">正在对比版本差异...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!compareResult) {
    return null;
  }

  const { oldVersion, newVersion, diff, stats } = compareResult;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* 背景遮罩 */}
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />

        {/* 弹窗内容 */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">版本对比</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                v{oldVersion.version} → v{newVersion.version}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 差异统计 */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-600">
                变更统计:
              </span>
              {stats.titleChanges > 0 && (
                <span className="text-orange-600">
                  标题变更 {stats.titleChanges} 处
                </span>
              )}
              {stats.contentChanges > 0 && (
                <span className="text-blue-600">
                  内容变更 {stats.contentChanges} 处
                </span>
              )}
              {stats.categoryChanges > 0 && (
                <span className="text-purple-600">
                  分类变更 {stats.categoryChanges} 处
                </span>
              )}
              {stats.totalChanges === 0 && (
                <span className="text-green-600">无变更</span>
              )}
            </div>
          </div>

          {/* 版本信息卡片 */}
          <div className="grid grid-cols-2 gap-4 px-6 py-4 border-b border-gray-200">
            {/* 旧版本 */}
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-red-200 text-red-800 text-xs font-bold rounded">
                  v{oldVersion.version}
                </span>
                <span className="text-xs text-gray-500">{formatDate(oldVersion.createdAt)}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 truncate">{oldVersion.title}</p>
              {oldVersion.changeLog && (
                <p className="text-xs text-gray-500 mt-1 truncate">{oldVersion.changeLog}</p>
              )}
            </div>

            {/* 新版本 */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-bold rounded">
                  v{newVersion.version}
                </span>
                <span className="text-xs text-gray-500">{formatDate(newVersion.createdAt)}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 truncate">{newVersion.title}</p>
              {newVersion.changeLog && (
                <p className="text-xs text-gray-500 mt-1 truncate">{newVersion.changeLog}</p>
              )}
            </div>
          </div>

          {/* 对比标签页 */}
          <div className="border-b border-gray-200">
            <nav className="flex px-6">
              {[
                { id: 'title' as const, label: '标题', count: diff.title.modified ? 1 : 0 },
                { id: 'content' as const, label: '内容', count: diff.content.added.length + diff.content.removed.length },
                { id: 'category' as const, label: '分类', count: diff.category.modified ? 1 : 0 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#b71c1c] text-[#b71c1c]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* 对比内容 */}
          <div className="p-6 overflow-y-auto max-h-[45vh]">
            {activeTab === 'title' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">旧版本标题</p>
                    <div className="p-3 bg-red-50 rounded border border-red-200 text-red-800">
                      {oldVersion.title}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">新版本标题</p>
                    <div className="p-3 bg-green-50 rounded border border-green-200 text-green-800">
                      {newVersion.title}
                    </div>
                  </div>
                </div>
                {diff.title.modified && (
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800">标题已变更</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'content' && renderDiffContent(oldVersion.content, newVersion.content, diff.content)}

            {activeTab === 'category' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">旧版本分类</p>
                    <div className="p-3 bg-red-50 rounded border border-red-200">
                      {oldVersion.category ? (
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-200 text-red-800">
                          {oldVersion.category}
                        </span>
                      ) : (
                        <span className="text-gray-400">无</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">新版本分类</p>
                    <div className="p-3 bg-green-50 rounded border border-green-200">
                      {newVersion.category ? (
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-200 text-green-800">
                          {newVersion.category}
                        </span>
                      ) : (
                        <span className="text-gray-400">无</span>
                      )}
                    </div>
                  </div>
                </div>
                {diff.category.modified && (
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800">分类已变更</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 底部图例 */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>图例:</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-200 rounded inline-block"></span>
                新增内容
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-200 rounded inline-block"></span>
                删除内容
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
