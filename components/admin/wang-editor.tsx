'use client';

import { useState, useEffect, useRef } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import { FaEye, FaExpand, FaCompress, FaFileWord, FaChartBar } from 'react-icons/fa';
import EditorTemplatePicker from './editor-template-picker';

interface WangEditorProps {
  content: string;
  onChange: (content: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  showPreview?: boolean;
  showTemplates?: boolean;
}

export default function WangEditor({
  content,
  onChange,
  onImageUpload,
  showPreview = false,
  showTemplates = false,
}: WangEditorProps) {
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const editorRef = useRef<IDomEditor | null>(null);
  const lastHtmlRef = useRef<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState({ words: 0, characters: 0 });
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  // 工具栏配置：排除视频（原编辑器无视频功能）
  const toolbarConfig: Partial<IToolbarConfig> = {
    excludeKeys: ['group-video', 'fullScreen'],
  };

  // 编辑器配置
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...',
    MENU_CONF: {
      uploadImage: {
        // 自定义上传：复用调用方提供的 onImageUpload
        async customUpload(file: File, insertFn: (url: string, alt?: string, href?: string) => void) {
          if (!onImageUpload) {
            alert('未配置图片上传');
            return;
          }
          try {
            const url = await onImageUpload(file);
            if (url) {
              insertFn(url, file.name, url);
            }
          } catch (err) {
            console.error('图片上传失败:', err);
            alert('图片上传失败');
          }
        },
      },
    },
  };

  // 编辑器创建
  const handleCreated = (ed: IDomEditor) => {
    editorRef.current = ed;
    setEditor(ed);
    ed.setHtml(content || '');
    lastHtmlRef.current = ed.getHtml();
    updateWordCount(ed);
  };

  // 编辑器内容变化
  const handleChange = (ed: IDomEditor) => {
    const html = ed.getHtml();
    lastHtmlRef.current = html;
    onChange(html);
    updateWordCount(ed);
  };

  const updateWordCount = (ed: IDomEditor) => {
    const text = ed.getText();
    setWordCount({
      words: text.trim() ? text.trim().split(/\s+/).length : 0,
      characters: text.length,
    });
  };

  // 外部 content 变化时同步到编辑器（如切换编辑不同文章）
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    if (content !== lastHtmlRef.current) {
      ed.setHtml(content || '');
      lastHtmlRef.current = content || '';
      updateWordCount(ed);
    }
  }, [content]);

  // 卸载时销毁编辑器
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  const handlePreview = () => {
    setPreviewContent(editor?.getHtml() || '');
    setShowPreviewModal(true);
  };

  const handleTemplateSelect = (templateContent: string) => {
    if (editorRef.current) {
      editorRef.current.dangerouslyInsertHtml(templateContent);
    }
    setShowTemplatePicker(false);
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white ${isFullscreen ? 'fixed inset-0 z-50 m-4' : ''}`}>
      {/* 顶部信息栏 */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FaChartBar className="text-gray-400" />
          <span>字数: {wordCount.words} | 字符: {wordCount.characters}</span>
        </div>
        <div className="flex items-center gap-1">
          {showTemplates && (
            <button
              onClick={() => setShowTemplatePicker(true)}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-500"
              title="内容模板"
            >
              <FaFileWord />
            </button>
          )}
          {showPreview && (
            <button
              onClick={handlePreview}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-500"
              title="预览"
            >
              <FaEye />
            </button>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-500"
            title={isFullscreen ? '退出全屏' : '全屏编辑'}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      {/* wangEditor 工具栏 */}
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #e5e7eb' }}
      />

      {/* wangEditor 编辑区 */}
      <Editor
        defaultConfig={editorConfig}
        onCreated={handleCreated}
        onChange={handleChange}
        mode="default"
        style={{ height: isFullscreen ? 'calc(100vh - 140px)' : '500px', overflowY: 'auto' }}
      />

      {/* 模板选择器 */}
      {showTemplatePicker && showTemplates && (
        <EditorTemplatePicker
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      {/* 预览弹窗 */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">预览</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div
                className="rich-text-content max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
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
