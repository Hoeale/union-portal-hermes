'use client';

import { useState, useEffect } from 'react';
import VersionCompare from './version-compare';
import { useCsrfToken } from '@/hooks';

interface Version {
  id: string;
  version: number;
  title: string;
  category: string | null;
  changeLog: string | null;
  createdBy: string;
  createdAt: string;
}

interface VersionDetail {
  id: string;
  version: number;
  title: string;
  content: string;
  category: string | null;
  changeLog: string | null;
  createdBy: string;
  createdAt: string;
  snapshot: any;
}

interface VersionHistoryProps {
  contentId: string;
  onClose: () => void;
  onVersionSelect?: (version: VersionDetail) => void;
}

export default function VersionHistory({ contentId, onClose, onVersionSelect }: VersionHistoryProps) {
  const csrfToken = useCsrfToken();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailVersion, setDetailVersion] = useState<VersionDetail | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changeLog, setChangeLog] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // 获取版本列表
  const fetchVersions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/news/${contentId}/versions`);
      const result = await response.json();
      if (result.success) {
        setVersions(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [contentId]);

  // 保存新版本
  const handleSaveVersion = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/news/${contentId}/versions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          changeLog: changeLog || `手动保存版本`,
          createdBy: 'admin',
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowSaveModal(false);
        setChangeLog('');
        fetchVersions();
      } else {
        alert(result.error || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save version:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 查看版本详情
  const handleViewDetail = async (versionId: string) => {
    try {
      const response = await fetch(`/api/admin/news/${contentId}/versions/${versionId}`);
      const result = await response.json();
      if (result.success) {
        setDetailVersion(result.data);
        setShowDetail(true);
        if (onVersionSelect) {
          onVersionSelect(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch version detail:', error);
    }
  };

  // 删除版本
  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('确定要删除这个版本吗？')) return;

    try {
      const response = await fetch(`/api/admin/news/${contentId}/versions/${versionId}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });

      const result = await response.json();
      if (result.success) {
        fetchVersions();
      } else {
        alert(result.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
      alert('删除失败');
    }
  };

  // 回滚到指定版本
  const handleRollback = async (versionId: string, versionNum: number) => {
    if (!confirm(`确定要回滚到版本 ${versionNum} 吗？当前内容将被替换。`)) return;

    try {
      const response = await fetch(`/api/admin/news/${contentId}/versions/${versionId}/rollback`, {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message || '回滚成功');
        fetchVersions();
        onClose();
      } else {
        alert(result.error || '回滚失败');
      }
    } catch (error) {
      console.error('Failed to rollback:', error);
      alert('回滚失败');
    }
  };

  // 选择版本进行对比
  const handleSelectForCompare = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter((id) => id !== versionId));
    } else {
      if (selectedVersions.length >= 2) {
        setSelectedVersions([selectedVersions[1], versionId]);
      } else {
        setSelectedVersions([...selectedVersions, versionId]);
      }
    }
  };

  // 开始对比
  const handleStartCompare = () => {
    if (selectedVersions.length !== 2) {
      alert('请选择两个版本进行对比');
      return;
    }
    setShowCompare(true);
  };

  // 格式化日期
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

  if (showCompare && selectedVersions.length === 2) {
    return (
      <VersionCompare
        contentId={contentId}
        versionId1={selectedVersions[0]}
        versionId2={selectedVersions[1]}
        onClose={() => {
          setShowCompare(false);
          setSelectedVersions([]);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* 背景遮罩 */}
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />

        {/* 弹窗内容 */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">版本历史</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {versions.length} 个版本 | 最多保留50个版本
              </p>
            </div>
            <div className="flex items-center gap-3">
              {selectedVersions.length === 2 && (
                <button
                  onClick={handleStartCompare}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  对比选中版本
                </button>
              )}
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-4 py-2 bg-[#b71c1c] text-white text-sm font-semibold rounded-lg hover:bg-[#8b0000] transition-colors"
              >
                保存当前版本
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

          {/* 版本列表 */}
          <div className="p-6 overflow-y-auto max-h-[65vh]">
            {loading ? (
              <div className="p-12 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#b71c1c]"></div>
                <p className="mt-3">加载版本历史...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <svg
                  className="mx-auto h-16 w-16 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-3 text-lg font-medium">暂无版本记录</p>
                <p className="text-sm mt-1">发布或手动保存时会创建版本</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                      selectedVersions.includes(version.id)
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* 版本号 */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#b71c1c] text-white rounded-full font-bold text-sm">
                      v{version.version}
                    </div>

                    {/* 版本信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {version.title}
                        </span>
                        {version.category && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-[#b71c1c]/10 text-[#b71c1c]">
                            {version.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>{formatDate(version.createdAt)}</span>
                        <span>操作人: {version.createdBy}</span>
                        {version.changeLog && (
                          <span className="truncate" title={version.changeLog}>
                            说明: {version.changeLog}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* 对比选择框 */}
                      <button
                        onClick={() => handleSelectForCompare(version.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedVersions.includes(version.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                        title="选择对比"
                      >
                        {selectedVersions.includes(version.id) && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      <button
                        onClick={() => handleViewDetail(version.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        查看
                      </button>
                      <button
                        onClick={() => handleRollback(version.id, version.version)}
                        className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                      >
                        回滚
                      </button>
                      <button
                        onClick={() => handleDeleteVersion(version.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部提示 */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              提示: 点击复选框选择两个版本进行对比 | 回滚会创建新版本而不会覆盖历史
            </p>
          </div>
        </div>

        {/* 版本详情弹窗 */}
        {showDetail && detailVersion && (
          <div className="fixed inset-0 z-60 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
                onClick={() => setShowDetail(false)}
              />
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      版本详情 - v{detailVersion.version}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(detailVersion.createdAt)} | 操作人: {detailVersion.createdBy}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetail(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[65vh]">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">标题</label>
                      <p className="mt-1 text-gray-900">{detailVersion.title}</p>
                    </div>
                    {detailVersion.category && (
                      <div>
                        <label className="text-sm font-semibold text-gray-700">分类</label>
                        <p className="mt-1">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-[#b71c1c]/10 text-[#b71c1c]">
                            {detailVersion.category}
                          </span>
                        </p>
                      </div>
                    )}
                    {detailVersion.changeLog && (
                      <div>
                        <label className="text-sm font-semibold text-gray-700">修改说明</label>
                        <p className="mt-1 text-gray-600">{detailVersion.changeLog}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-semibold text-gray-700">内容</label>
                      <div
                        className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: detailVersion.content }}
                      />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button
                    onClick={() => setShowDetail(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    关闭
                  </button>
                  <button
                    onClick={() => {
                      handleRollback(detailVersion.id, detailVersion.version);
                      setShowDetail(false);
                    }}
                    className="px-6 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    回滚到此版本
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 保存版本弹窗 */}
        {showSaveModal && (
          <div className="fixed inset-0 z-60 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
                onClick={() => setShowSaveModal(false)}
              />
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">保存版本</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    将当前内容保存为一个新的版本
                  </p>
                </div>
                <div className="p-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      修改说明 (可选)
                    </label>
                    <textarea
                      value={changeLog}
                      onChange={(e) => setChangeLog(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent text-sm"
                      rows={3}
                      placeholder="请简要说明本次修改的内容..."
                    />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowSaveModal(false);
                      setChangeLog('');
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveVersion}
                    disabled={saving}
                    className="px-6 py-2 bg-[#b71c1c] text-white text-sm font-semibold rounded-lg hover:bg-[#8b0000] transition-colors disabled:opacity-50"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
