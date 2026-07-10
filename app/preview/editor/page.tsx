'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSpinner, faEye } from '@fortawesome/free-solid-svg-icons';

interface EditorPreviewData {
  title: string;
  category: '动态' | '通知' | '公告';
  content: string;
  image_url: string;
}

// 分类显示名映射（和前端一致）
const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  '动态': '工会动态',
  '通知': '通知要闻',
  '公告': '公示公告',
  '政策': '政策文件',
};

// 分类样式配置（和前端一致）
const CATEGORY_STYLES: Record<string, string> = {
  '动态': 'bg-blue-50 text-blue-700 border-blue-200',
  '通知': 'bg-purple-50 text-purple-700 border-purple-200',
  '公告': 'bg-orange-50 text-orange-700 border-orange-200',
  '政策': 'bg-green-50 text-green-700 border-green-200',
};

export default function EditorPreviewPage() {
  const router = useRouter();
  const [previewData, setPreviewData] = useState<EditorPreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 sessionStorage 读取编辑器数据
    try {
      const stored = sessionStorage.getItem('news-editor-preview');
      if (stored) {
        const data = JSON.parse(stored);
        setPreviewData(data);
        // 读取后清除，避免刷新时显示旧数据
        sessionStorage.removeItem('news-editor-preview');
      }
    } catch (error) {
      console.error('Failed to read preview data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-gray-400 mb-4" />
          <p className="text-gray-500">正在加载预览...</p>
        </div>
      </div>
    );
  }

  // 检查是否有有效内容（标题或内容至少有一个）
  const hasTitle = previewData?.title?.trim();
  const hasContent = previewData?.content?.trim() && previewData.content !== '<p></p>' && previewData.content !== '';
  
  if (!previewData || (!hasTitle && !hasContent)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">暂无预览数据</p>
          <p className="text-sm text-gray-500 mb-6">请先在编辑器中输入标题和内容</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            返回编辑器
          </button>
        </div>
      </div>
    );
  }

  const category = previewData.category;
  const categoryDisplayName = CATEGORY_DISPLAY_MAP[category] || category;
  const categoryStyle = CATEGORY_STYLES[category] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 编辑器预览提示栏 */}
      <div className="bg-gradient-to-r from-[#b71c1c] to-[#d32f2f] text-white px-6 py-3 sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faEye} className="text-yellow-300" />
            <span className="text-sm font-medium">新闻预览模式</span>
            <span className="text-xs text-white/70">|</span>
            <span className="text-xs text-white/80">此页面展示效果与前端门户网站一致</span>
          </div>
          <button
            onClick={() => {
              // 如果是新窗口打开的，关闭窗口；否则返回上一页
              if (window.opener) {
                window.close();
              } else {
                router.back();
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-white/20 rounded-lg hover:bg-white/30 transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            返回编辑
          </button>
        </div>
      </div>

      {/* 新闻内容 - 和前端 /view/[date]/[id] 页面样式一致 */}
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <article className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            {/* 标题区域 */}
            <div className="p-6 lg:p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${categoryStyle}`}>
                  {categoryDisplayName}
                </span>
                <time className="text-sm text-gray-500 flex items-center gap-1.5">
                  {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
              </div>
              <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 leading-tight">
                {previewData.title}
              </h1>
            </div>

            {/* 正文内容（不单独显示封面图，正文中的图片即为完整内容） */}
            <div className="p-6 lg:p-8">
              <div
                className="rich-text-content max-w-none"
                dangerouslySetInnerHTML={{ __html: previewData.content }}
              />
            </div>
          </article>

          {/* 底部提示 */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm text-center">
              <FontAwesomeIcon icon={faEye} className="mr-2 text-amber-600" />
              这是预览模式，展示效果与前端门户网站新闻页面一致。确认无误后可点击发布。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
