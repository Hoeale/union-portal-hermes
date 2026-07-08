'use client';

import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { FaBold, FaItalic, FaUnderline, FaListUl, FaListOl, FaHeading, FaUndo, FaRedo, FaImage, FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify, FaLink, FaCode, FaQuoteLeft, FaEye, FaTable, FaExpand, FaCompress, FaFileWord, FaChartBar, FaSearchPlus, FaSearchMinus, FaTrash, FaCropAlt } from 'react-icons/fa';
import { useState, useEffect, useCallback, useRef } from 'react';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import EditorTemplatePicker from './editor-template-picker';

// 可拖拽缩放的图片 NodeView
function ResizableImageNodeView({ node, updateAttributes, selected, editor, getPos }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    const currentWidth = parseFloat((node.attrs.width as string) || '100') || 100;
    const editorEl = document.querySelector('.ProseMirror') as HTMLElement;
    const editorWidth = editorEl ? editorEl.offsetWidth - 32 : 800;
    startWidthRef.current = (currentWidth / 100) * editorWidth;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const dx = ev.clientX - startXRef.current;
      const newWidthPx = Math.max(50, startWidthRef.current + dx);
      const percent = Math.round((newWidthPx / editorWidth) * 100);
      updateAttributes({ width: `${Math.min(Math.max(percent, 10), 200)}%` });
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, [node.attrs.width, updateAttributes]);

  // 点击图片时通知父组件显示工具栏
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getPos?.();
    if (typeof pos === 'number') {
      // 选中图片节点
      editor?.chain().focus().setNodeSelection(pos).run();
      // 通知父组件显示工具栏
      window.dispatchEvent(new CustomEvent('tiptap-image-click', { 
        detail: { pos, imgElement: imgRef.current } 
      }));
    }
  }, [editor, getPos]);

  const width = node.attrs.width || '100%';
  const align = (node.attrs.align as string) || 'center';
  const justifyContent = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  // 在图片上方/下方插入空段落，让用户可以在图片前后编辑
  const insertParagraphAt = (direction: 'before' | 'after') => {
    if (!editor) return;
    const rawPos = getPos?.();
    if (typeof rawPos !== 'number') return;
    const pos: number = rawPos;
    if (direction === 'before') {
      editor.chain()
        .insertContentAt(pos, { type: 'paragraph' })
        .focus(pos + 1)
        .run();
    } else {
      const insertPos = pos + node.nodeSize;
      editor.chain()
        .insertContentAt(insertPos, { type: 'paragraph' })
        .focus(insertPos + 1)
        .run();
    }
  };

  return (
    <NodeViewWrapper
      className="relative"
      data-drag-handle
      data-align={align}
      style={{ margin: '0.5em 0' }}
    >
      {/* 上方可点击区域 - 用于在图片前插入光标 */}
      <div
        className="absolute -top-2 left-0 right-0 h-4 cursor-text z-20"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          insertParagraphAt('before');
        }}
        title="点击在图片上方插入文本"
      />
      {/* 图片容器 */}
      <div style={{ display: 'flex', justifyContent, width: '100%' }}>
        <div 
          style={{ width: width === '100%' ? '100%' : width, maxWidth: '100%', position: 'relative', display: 'inline-block' }}
          className={selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        >
          <img
            ref={imgRef}
            src={node.attrs.src}
            alt={node.attrs.alt || ''}
            style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
            onClick={handleImageClick}
          />
          {/* 拖拽缩放手柄 */}
          <div
            onMouseDown={handleMouseDown}
            className="absolute right-0 bottom-0 w-4 h-4 bg-blue-500 border-2 border-white rounded-sm cursor-nwse-resize z-10 hover:bg-blue-600 transition-colors shadow-md"
            title="拖拽调整大小"
          />
        </div>
      </div>
      {/* 下方可点击区域 - 用于在图片后插入光标 */}
      <div
        className="absolute -bottom-2 left-0 right-0 h-4 cursor-text z-20"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          insertParagraphAt('after');
        }}
        title="点击在图片下方插入文本"
      />
    </NodeViewWrapper>
  );
}

// 扩展 Image 扩展以支持宽度和对齐属性
const CustomImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute('width') || element.style.width;
          return width || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width, style: `width: ${attributes.width}` };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const height = element.getAttribute('height') || element.style.height;
          return height || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height, style: `height: ${attributes.height}` };
        },
      },
      align: {
        default: 'center',
        parseHTML: (element) => {
          return element.getAttribute('align') || element.getAttribute('data-align') || 'center';
        },
        renderHTML: (attributes) => {
          if (!attributes.align || attributes.align === 'center') return {};
          return { align: attributes.align, 'data-align': attributes.align };
        },
      },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  showPreview?: boolean;
  showTemplates?: boolean;
}

export default function RichTextEditor({ content, onChange, onImageUpload, showPreview = false, showTemplates = false }: RichTextEditorProps) {
  const [imageUploading, setImageUploading] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  // [已隐藏] 外链图片功能 - 避免外链图片失效导致客户认为是平台问题
  // const [showImageUrlDialog, setShowImageUrlDialog] = useState(false);
  // const [imageUrlInput, setImageUrlInput] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState({ words: 0, characters: 0 });
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // Word文档导入相关
  const [showWordImport, setShowWordImport] = useState(false);
  const [wordImporting, setWordImporting] = useState(false);
  const [wordImportProgress, setWordImportProgress] = useState('');

  // 表格相关
  const [showTableGrid, setShowTableGrid] = useState(false);
  const [tableGridHover, setTableGridHover] = useState({ rows: 0, cols: 0 });
  const [isInTable, setIsInTable] = useState(false);

  // 字体颜色选择器
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');

  // 图片编辑相关
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const selectedImageRef = useRef<HTMLImageElement | null>(null);
  const [selectedImagePos, setSelectedImagePos] = useState<number | null>(null);
  const [showImageToolbar, setShowImageToolbar] = useState(false);
  const [imageToolbarPos, setImageToolbarPos] = useState({ top: 0, left: 0 });
  const [imageSizeInput, setImageSizeInput] = useState('');
  const [showImageSizeDialog, setShowImageSizeDialog] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      CustomImage,
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      const text = editor.getText();
      setWordCount({
        words: text.trim() ? text.trim().split(/\s+/).length : 0,
        characters: text.length,
      });
      // 检测光标是否在表格内
      setIsInTable(editor.isActive('table'));
    },
    onSelectionUpdate: ({ editor }) => {
      setIsInTable(editor.isActive('table'));
    },
    editorProps: {
      handleDOMEvents: {
        click: (view, event) => {
          const target = event.target as HTMLElement;
          // 如果点击图片，由 NodeView 内部处理，不执行编辑器默认行为
          if (target.tagName === 'IMG' || target.closest('[data-node-view-wrapper]')) {
            return true;
          }
          // 点击编辑器其他区域时，隐藏图片工具栏
          setShowImageToolbar(false);
          setSelectedImagePos(null);
          return false;
        },
      },
      handlePaste: (view, event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData || !onImageUpload) return false;

        const items = clipboardData.items;

        // 1. 优先处理截图粘贴（raw image data）
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              handlePasteImage(file);
            }
            return true;
          }
        }

        // 2. 处理从网页/Word复制的HTML内容（提取图片并上传）
        const html = clipboardData.getData('text/html');
        if (html) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const imgElements = doc.querySelectorAll('img');

          if (imgElements.length > 0) {
            // 异步处理图片上传，但不阻止文本粘贴
            // 让 TipTap 先插入 HTML，然后替换图片 URL
            processHtmlImages(html, imgElements);
            // 不阻止默认行为，让文字内容先粘贴
            return false;
          }
        }

        return false;
      },
    },
  });

  // 监听 NodeView 中的图片选中事件
  useEffect(() => {
    const handleImageClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { pos, imgElement } = customEvent.detail;
      setSelectedImagePos(pos);
      setShowImageToolbar(true);
      
      // 计算工具栏位置
      setTimeout(() => {
        if (imgElement) {
          const rect = imgElement.getBoundingClientRect();
          const editorElement = document.querySelector('.ProseMirror');
          const editorRect = editorElement?.getBoundingClientRect();
          
          if (editorRect) {
            setImageToolbarPos({
              top: rect.top - editorRect.top - 50,
              left: rect.left - editorRect.left + rect.width / 2 - 150,
            });
          }
        }
      }, 50);
    };

    window.addEventListener('tiptap-image-click', handleImageClick);
    return () => window.removeEventListener('tiptap-image-click', handleImageClick);
  }, []);

  // 点击图片外部时隐藏工具栏
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isImageClick = target.closest('[data-node-view-wrapper]');
      const isToolbarClick = target.closest('[data-image-toolbar]');
      
      if (!isImageClick && !isToolbarClick) {
        setShowImageToolbar(false);
        setSelectedImagePos(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageUpload = async () => {
    if (!onImageUpload) return;
    setShowImageMenu(false);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setImageUploading(true);
        try {
          const url = await onImageUpload(file);
          editor?.chain().focus().setImage({ src: url }).run();
        } catch (error) {
          console.error('Image upload failed:', error);
          alert('图片上传失败');
        } finally {
          setImageUploading(false);
        }
      }
    };
    input.click();
  };

  // 处理粘贴图片
  const handlePasteImage = async (file: File) => {
    if (!onImageUpload || !editor) return;
    
    setImageUploading(true);
    try {
      const url = await onImageUpload(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    } catch (error) {
      console.error('Paste image upload failed:', error);
      alert('图片上传失败');
    } finally {
      setImageUploading(false);
    }
  };

  // 处理从网页粘贴的 HTML 中的图片
  const processHtmlImages = async (originalHtml: string, imgElements: NodeListOf<HTMLImageElement>) => {
    if (!editor || !onImageUpload) return;

    // 等待 TipTap 插入 HTML 内容
    await new Promise(resolve => setTimeout(resolve, 200));

    const editorHtml = editor.getHTML();
    const parser = new DOMParser();
    const doc = parser.parseFromString(editorHtml, 'text/html');
    const editorImgs = doc.querySelectorAll('img');

    let hasChanges = false;

    for (const img of Array.from(editorImgs)) {
      const src = img.getAttribute('src');
      if (!src) continue;

      // 跳过已经是上传后路径的图片（以 /uploads/ 开头）
      if (src.startsWith('/uploads/')) continue;
      // 跳过 data: URL（base64 内联图片，太大不处理）
      if (src.startsWith('data:')) continue;

      try {
        // 尝试加载图片并上传到服务器
        const response = await fetch(src, { mode: 'cors' });
        if (!response.ok) continue;

        const blob = await response.blob();
        const fileName = src.split('/').pop() || 'pasted-image.png';
        const file = new File([blob], fileName, { type: blob.type || 'image/png' });

        // 上传到服务器
        const uploadedUrl = await onImageUpload(file);
        if (uploadedUrl) {
          img.setAttribute('src', uploadedUrl);
          hasChanges = true;
        }
      } catch (err) {
        console.warn('Failed to upload pasted image:', src, err);
        // 上传失败保留原始 URL
      }
    }

    // 如果有任何图片 URL 被替换，更新编辑器内容
    if (hasChanges) {
      const newHtml = doc.body.innerHTML;
      editor.chain().focus().setContent(newHtml).run();
    }
  };

  // [已隐藏] 外链图片功能 - 避免外链图片失效导致客户认为是平台问题
  // const handleInsertImageUrl = () => {
  //   setShowImageMenu(false);
  //   setShowImageUrlDialog(true);
  //   setImageUrlInput('');
  // };

  // const confirmInsertImageUrl = () => {
  //   const url = imageUrlInput.trim();
  //   if (!url) {
  //     alert('请输入图片地址');
  //     return;
  //   }
  //   // 简单的URL格式校验
  //   try {
  //     new URL(url);
  //   } catch {
  //     alert('请输入有效的图片地址');
  //     return;
  //   }
  //   editor?.chain().focus().setImage({ src: url }).run();
  //   setShowImageUrlDialog(false);
  //   setImageUrlInput('');
  // };

  const handlePreview = () => {
    setPreviewContent(editor?.getHTML() || '');
    setShowPreviewModal(true);
  };

  // 从Word文档XML中提取字体颜色信息
  const extractWordColors = async (arrayBuffer: ArrayBuffer): Promise<Map<string, string>> => {
    const colorMap = new Map<string, string>();
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const documentXml = await zip.file('word/document.xml')?.async('string');
      if (!documentXml) return colorMap;

      // 解析XML，提取每个run的文本和颜色
      const parser = new DOMParser();
      const doc = parser.parseFromString(documentXml, 'text/xml');
      const runs = doc.getElementsByTagName('w:r');

      for (let i = 0; i < runs.length; i++) {
        const run = runs[i];
        const colorElem = run.getElementsByTagName('w:color')[0];
        const textElem = run.getElementsByTagName('w:t')[0];
        
        if (colorElem && textElem) {
          const colorVal = colorElem.getAttribute('w:val');
          const text = textElem.textContent || '';
          if (colorVal && text.trim()) {
            // Word颜色格式为RRGGBB，转换为#RRGGBB
            const hexColor = '#' + colorVal.toUpperCase();
            colorMap.set(text.trim(), hexColor);
          }
        }
      }
    } catch (error) {
      console.warn('提取Word颜色信息失败:', error);
    }
    return colorMap;
  };

  // 将颜色信息应用到HTML
  const applyColorsToHtml = (html: string, colorMap: Map<string, string>): string => {
    let result = html;
    colorMap.forEach((color, text) => {
      // 转义特殊字符用于正则
      const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 匹配文本并包裹在带有颜色的span中
      const regex = new RegExp(`(?<!<[^>]*)(${escapedText})(?![^<]*>)`, 'g');
      result = result.replace(regex, `<span style="color: ${color}">$1</span>`);
    });
    return result;
  };

  // Word文档导入处理
  const handleWordImport = async (file: File) => {
    if (!editor) return;
    
    setWordImporting(true);
    setWordImportProgress('正在解析Word文档...');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // 检查文件大小
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 20) {
        alert('文件过大（超过20MB），可能导致导入失败');
      }
      
      // 自定义样式映射，保留更多格式
      const styleMap = [
        // 保留字体颜色
        'u[style] => u',
        'b[style] => b',
        'i[style] => i',
        'p[style-name="Heading 1"] => h1:fresh',
        'p[style-name="Heading 2"] => h2:fresh',
        'p[style-name="Heading 3"] => h3:fresh',
        'p[style-name="Heading 4"] => h4:fresh',
        'p[style-name="Normal"] => p:fresh',
        'p => p',
        'table => table',
        'tr => tr',
        'td => td',
        'th => th',
        'ul => ul',
        'ol => ol',
        'li => li',
      ];
      
      // 转换Word为HTML，保留图片和格式
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: styleMap,
          convertImage: mammoth.images.imgElement(async (image: any) => {
            try {
              const buffer = await image.read('base64');
              const mimeType = image.contentType || 'image/png';
              const dataUrl = `data:${mimeType};base64,${buffer}`;
              return { src: dataUrl };
            } catch (imgError) {
              console.warn('图片转换失败:', imgError);
              return { src: '' };
            }
          }),
        }
      );
      
      setWordImportProgress('正在提取字体颜色...');
      
      // 提取Word文档中的字体颜色信息
      const colorMap = await extractWordColors(arrayBuffer);
      
      setWordImportProgress('正在插入内容...');
      
      let html = result.value;
      
      // 应用字体颜色到HTML
      if (colorMap.size > 0) {
        html = applyColorsToHtml(html, colorMap);
        console.log(`已应用 ${colorMap.size} 个颜色标记`);
      }
      
      // 检查是否为空
      if (!html || html.trim() === '' || html === '<p></p>') {
        alert('Word文档内容为空或格式不支持，请尝试复制粘贴内容');
        setWordImporting(false);
        setWordImportProgress('');
        return;
      }
      
      // 清理HTML中的空段落
      const cleanedHtml = html
        .replace(/<p>\s*<\/p>/g, '')
        .replace(/<p>\s*<br\s*\/?>\s*<\/p>/g, '')
        .replace(/<p>\s*<span[^>]*>\s*<\/span>\s*<\/p>/g, '');
      
      // 使用 insertContent 插入，它比 setContent 更安全
      try {
        editor.chain().focus().insertContent(cleanedHtml).run();
      } catch (insertError) {
        console.error('HTML插入失败，尝试纯文本方式:', insertError);
        // 如果HTML插入失败，尝试提取纯文本
        const textContent = cleanedHtml.replace(/<[^>]+>/g, '');
        editor.chain().focus().insertContent(textContent).run();
      }
      
      // 显示警告信息（如果有）
      if (result.messages.length > 0) {
        const warnings = result.messages.filter((m: any) => m.type === 'warning');
        if (warnings.length > 0) {
          console.warn('Word导入警告:', warnings);
        }
      }
      
      setWordImportProgress('');
      setWordImporting(false);
    } catch (error) {
      console.error('Word导入失败:', error);
      alert('Word文档导入失败，请检查：\n1. 文件格式是否为 .docx\n2. 文件是否损坏\n3. 文件大小是否过大');
      setWordImportProgress('');
      setWordImporting(false);
    }
  };

  const triggerWordImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await handleWordImport(file);
      }
    };
    input.click();
  };

  // 点击外部关闭表格选择器
  useEffect(() => {
    if (!showTableGrid) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-table-grid]')) {
        setShowTableGrid(false);
        setTableGridHover({ rows: 0, cols: 0 });
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTableGrid]);

  // 点击外部关闭图片菜单
  useEffect(() => {
    if (!showImageMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-image-menu]')) {
        setShowImageMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showImageMenu]);

  // 点击外部关闭颜色选择器
  useEffect(() => {
    if (!showColorPicker) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-color-picker]')) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showColorPicker]);

  // 图片缩放操作
  const handleImageResize = (percent: number) => {
    if (!selectedImage || !editor) return;
    const newWidth = `${percent}%`;
    const src = selectedImage.src;
    editor.chain().focus()
      .command(({ tr, dispatch }) => {
        const { doc } = tr;
        doc.descendants((node, pos) => {
          if (node.type.name === 'image' && node.attrs.src === src) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, width: newWidth });
            return false;
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      })
      .run();
    setShowImageToolbar(false);
    setSelectedImage(null);
  };

  // 自定义图片尺寸
  const handleCustomImageSize = () => {
    if (!selectedImage || !editor || !imageSizeInput) return;
    const newWidth = imageSizeInput.includes('%') || imageSizeInput.includes('px')
      ? imageSizeInput : `${imageSizeInput}%`;
    const src = selectedImage.src;
    editor.chain().focus()
      .command(({ tr, dispatch }) => {
        const { doc } = tr;
        doc.descendants((node, pos) => {
          if (node.type.name === 'image' && node.attrs.src === src) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, width: newWidth });
            return false;
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      })
      .run();
    setShowImageSizeDialog(false);
    setImageSizeInput('');
    setShowImageToolbar(false);
    setSelectedImage(null);
  };

  // 删除选中的图片
  const handleDeleteImage = () => {
    if (!selectedImage || !editor) return;
    const src = selectedImage.src;
    editor.chain().focus()
      .command(({ tr, dispatch }) => {
        const { doc } = tr;
        doc.descendants((node, pos) => {
          if (node.type.name === 'image' && node.attrs.src === src) {
            tr.delete(pos, pos + node.nodeSize);
            return false;
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      })
      .run();
    setShowImageToolbar(false);
    setSelectedImage(null);
    setShowImageSizeDialog(false);
  };

  const handleInsertTable = (rows: number, cols: number) => {
    setShowTableGrid(false);
    setTableGridHover({ rows: 0, cols: 0 });
    if (!editor) return;
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  };

  // 表格操作辅助函数
  const tableAction = useCallback((action: () => boolean | undefined) => {
    try { action(); } catch { /* ignore */ }
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleTemplateSelect = (templateContent: string) => {
    editor?.chain().focus().insertContent(templateContent).run();
    setShowTemplatePicker(false);
  };

  const MenuBar = () => {
    if (!editor) return null;

    return (
      <div className="border border-gray-300 border-b-0 rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Text Style - Bold, Italic, Underline */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 disabled:opacity-30 ${
            editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : ''
          }`}
          title="粗体 (Ctrl+B)"
        >
          <FaBold />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 disabled:opacity-30 ${
            editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : ''
          }`}
          title="斜体 (Ctrl+I)"
        >
          <FaItalic />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gray-200 disabled:opacity-30 ${
            editor.isActive('underline') ? 'bg-blue-100 text-blue-600' : ''
          }`}
          title="下划线 (Ctrl+U)"
        >
          <FaUnderline />
        </button>

        {/* Text Color */}
        <div className="relative" data-color-picker>
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`p-2 rounded hover:bg-gray-200 flex flex-col items-center ${
              showColorPicker ? 'bg-blue-100' : ''
            }`}
            title="文字颜色"
          >
            <span className="text-sm font-bold leading-none" style={{ color: currentColor }}>A</span>
            <div className="w-4 h-0.5 mt-0.5 rounded" style={{ backgroundColor: currentColor }}></div>
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-30 min-w-[200px]">
              <p className="text-xs text-gray-500 mb-2 font-medium">常用颜色</p>
              <div className="grid grid-cols-8 gap-1.5 mb-3">
                {[
                  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#ffffff',
                  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff',
                  '#9900ff', '#ff00ff', '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3',
                  '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc', '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599',
                  '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd', '#cc4125', '#e06666',
                ].map((color) => (
                  <button
                    key={color}
                    onMouseDown={(e) => { e.preventDefault(); }}
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setCurrentColor(color);
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded border transition-transform hover:scale-125 ${
                      color === '#ffffff' ? 'border-gray-300' : 'border-gray-200'
                    } ${currentColor === color ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="border-t border-gray-200 pt-2 flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">自定义:</label>
                <input
                  type="color"
                  value={currentColor}
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    setCurrentColor(newColor);
                    editor.chain().focus().setColor(newColor).run();
                  }}
                  className="w-8 h-6 rounded cursor-pointer border border-gray-300"
                />
                <button
                  onMouseDown={(e) => { e.preventDefault(); }}
                  onClick={() => {
                    editor.chain().focus().unsetColor().run();
                    setCurrentColor('#000000');
                    setShowColorPicker(false);
                  }}
                  className="ml-auto text-xs text-gray-500 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-100"
                >
                  清除颜色
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Headings */}
        <div className="border-l border-gray-300 pl-1 ml-1 flex items-center">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="标题1"
          >
            <FaHeading className="text-lg" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="标题2"
          >
            <FaHeading className="text-base" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="标题3"
          >
            <FaHeading className="text-sm" />
          </button>
        </div>

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : ''
          }`}
          title="无序列表"
        >
          <FaListUl />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : ''
          }`}
          title="有序列表"
        >
          <FaListOl />
        </button>

        {/* Alignment */}
        <div className="border-l border-gray-300 pl-1 ml-1 flex items-center">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="左对齐"
          >
            <FaAlignLeft />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="居中对齐"
          >
            <FaAlignCenter />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="右对齐"
          >
            <FaAlignRight />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="两端对齐"
          >
            <FaAlignJustify />
          </button>
        </div>

        {/* Insert - Image, Link, Quote, Code, Table */}
        <div className="border-l border-gray-300 pl-1 ml-1 flex items-center">
          {onImageUpload && (
            <div className="relative" data-image-menu>
              <button
                onClick={() => setShowImageMenu(!showImageMenu)}
                disabled={imageUploading}
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
                title="插入图片"
              >
                <FaImage />
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showImageMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-[140px]">
                  <button
                    onMouseDown={(e) => { e.preventDefault(); handleImageUpload(); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaImage className="text-gray-500" />
                    <span>本地上传</span>
                  </button>
                  {/* [已隐藏] 外链图片功能 - 避免外链图片失效导致客户认为是平台问题
                  <button
                    onMouseDown={(e) => { e.preventDefault(); handleInsertImageUrl(); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaLink className="text-gray-500" />
                    <span>外链图片</span>
                  </button>
                  */}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('blockquote') ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="引用"
          >
            <FaQuoteLeft />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('codeBlock') ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="代码块"
          >
            <FaCode />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowTableGrid(!showTableGrid)}
              className={`p-2 rounded hover:bg-gray-200 ${
                isInTable ? 'bg-blue-100 text-blue-600' : ''
              } flex items-center gap-1`}
              title="插入表格"
            >
              <FaTable />
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showTableGrid && (
              <div data-table-grid className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-30">
                <p className="text-xs text-gray-500 mb-2 text-center">选择表格大小</p>
                <div className="flex flex-col gap-0.5">
                  {Array.from({ length: 6 }, (_, r) => (
                    <div key={r} className="flex gap-0.5">
                      {Array.from({ length: 6 }, (_, c) => {
                        const row = r + 1;
                        const col = c + 1;
                        const isHighlighted = row <= tableGridHover.rows && col <= tableGridHover.cols;
                        return (
                          <div
                            key={`${r}-${c}`}
                            className={`w-7 h-7 border rounded-sm cursor-pointer transition-colors ${
                              isHighlighted
                                ? 'bg-blue-400 border-blue-500'
                                : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                            }`}
                            onMouseEnter={() => setTableGridHover({ rows: row, cols: col })}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleInsertTable(row, col);
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {tableGridHover.rows > 0 && tableGridHover.cols > 0
                    ? `${tableGridHover.rows} 行 × ${tableGridHover.cols} 列`
                    : '移动鼠标选择大小'}
                </p>
              </div>
            )}
          </div>
          {showTemplates && (
            <button
              onClick={() => setShowTemplatePicker(true)}
              className="p-2 rounded hover:bg-gray-200"
              title="内容模板"
            >
              <FaFileWord />
            </button>
          )}
          {/* Word导入功能已禁用 */}
        </div>

        {/* Preview (if enabled) */}
        {showPreview && (
          <button
            onClick={handlePreview}
            className="p-2 rounded hover:bg-gray-200 ml-auto"
            title="预览"
          >
            <FaEye />
          </button>
        )}

        {/* Undo/Redo */}
        <div className="border-l border-gray-300 pl-1 ml-1">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-30"
            title="撤销 (Ctrl+Z)"
          >
            <FaUndo />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-30"
            title="重做 (Ctrl+Y)"
          >
            <FaRedo />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white ${isFullscreen ? 'fixed inset-0 z-50 m-4' : ''}`}>
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        {/* 字数统计 */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FaChartBar className="text-gray-400" />
          <span>字数: {wordCount.words} | 字符: {wordCount.characters}</span>
        </div>

        {/* 全屏切换 */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-500"
          title={isFullscreen ? '退出全屏' : '全屏编辑'}
        >
          {isFullscreen ? <FaCompress /> : <FaExpand />}
        </button>
      </div>

      <div className="relative">
        <MenuBar />

        {/* 表格上下文工具栏 */}
        {isInTable && editor && (
        <div className="bg-blue-50 border-b border-blue-200 px-2 py-1.5 flex flex-wrap items-center gap-1">
          <span className="text-xs text-blue-600 font-medium mr-2">表格操作</span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => tableAction(() => editor.chain().focus().addColumnBefore().run())}
              className="px-2 py-1 text-xs rounded hover:bg-blue-100 text-gray-700"
              title="在左侧插入列"
            >
              ← 插入列
            </button>
            <button
              onClick={() => tableAction(() => editor.chain().focus().addColumnAfter().run())}
              className="px-2 py-1 text-xs rounded hover:bg-blue-100 text-gray-700"
              title="在右侧插入列"
            >
              插入列 →
            </button>
          </div>
          <div className="w-px h-4 bg-blue-200 mx-1" />
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => tableAction(() => editor.chain().focus().addRowBefore().run())}
              className="px-2 py-1 text-xs rounded hover:bg-blue-100 text-gray-700"
              title="在上方插入行"
            >
              ↑ 插入行
            </button>
            <button
              onClick={() => tableAction(() => editor.chain().focus().addRowAfter().run())}
              className="px-2 py-1 text-xs rounded hover:bg-blue-100 text-gray-700"
              title="在下方插入行"
            >
              插入行 ↓
            </button>
          </div>
          <div className="w-px h-4 bg-blue-200 mx-1" />
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => tableAction(() => editor.chain().focus().deleteColumn().run())}
              className="px-2 py-1 text-xs rounded hover:bg-blue-100 text-red-600"
              title="删除当前列"
            >
              删除列
            </button>
            <button
              onClick={() => tableAction(() => editor.chain().focus().deleteRow().run())}
              className="px-2 py-1 text-xs rounded hover:bg-blue-100 text-red-600"
              title="删除当前行"
            >
              删除行
            </button>
            <button
              onClick={() => tableAction(() => editor.chain().focus().deleteTable().run())}
              className="px-2 py-1 text-xs rounded hover:bg-blue-100 text-red-600"
              title="删除整个表格"
            >
              删除表格
            </button>
          </div>
          <div className="w-px h-4 bg-blue-200 mx-1" />
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => tableAction(() => editor.chain().focus().mergeCells().run())}
              className="px-2 py-1 text-xs rounded hover:bg-blue-100 text-gray-700"
              title="合并选中的单元格"
            >
              合并单元格
            </button>
            <button
              onClick={() => tableAction(() => editor.chain().focus().splitCell().run())}
              className="px-2 py-1 text-xs rounded hover:bg-blue-100 text-gray-700"
              title="拆分当前单元格"
            >
              拆分单元格
            </button>
          </div>
          <div className="w-px h-4 bg-blue-200 mx-1" />
          <button
            onClick={() => tableAction(() => editor.chain().focus().toggleHeaderRow().run())}
            className="px-2 py-1 text-xs rounded hover:bg-blue-100 text-gray-700"
            title="切换首行是否为表头"
          >
            切换表头
          </button>
        </div>
      )}

        {/* 图片编辑工具栏 */}
        {showImageToolbar && selectedImagePos !== null && (
          <div
            className="absolute z-40 bg-white border border-gray-300 rounded-lg shadow-lg px-2 py-1.5 flex items-center gap-1"
            style={{ top: `${imageToolbarPos.top}px`, left: `${Math.max(0, imageToolbarPos.left)}px` }}
            onMouseDown={(e) => {
              e.stopPropagation(); // 阻止事件冒泡到编辑器
            }}
            onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡到编辑器
            }}
            data-image-toolbar
          >
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (!editor || selectedImagePos === null) return;
                const node = editor.state.doc.nodeAt(selectedImagePos);
                if (node && node.type.name === 'image') {
                  const newWidth = `25%`;
                  editor.chain().focus()
                    .command(({ tr, dispatch }) => {
                      tr.setNodeMarkup(selectedImagePos, undefined, { ...node.attrs, width: newWidth });
                      if (dispatch) dispatch(tr);
                      return true;
                    })
                    .run();
                }
              }}
              className="px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-700"
              title="设置为25%宽度"
            >
              25%
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (!editor || selectedImagePos === null) return;
                const node = editor.state.doc.nodeAt(selectedImagePos);
                if (node && node.type.name === 'image') {
                  const newWidth = `50%`;
                  editor.chain().focus()
                    .command(({ tr, dispatch }) => {
                      tr.setNodeMarkup(selectedImagePos, undefined, { ...node.attrs, width: newWidth });
                      if (dispatch) dispatch(tr);
                      return true;
                    })
                    .run();
                }
              }}
              className="px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-700"
              title="设置为50%宽度"
            >
              50%
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (!editor || selectedImagePos === null) return;
                const node = editor.state.doc.nodeAt(selectedImagePos);
                if (node && node.type.name === 'image') {
                  const newWidth = `75%`;
                  editor.chain().focus()
                    .command(({ tr, dispatch }) => {
                      tr.setNodeMarkup(selectedImagePos, undefined, { ...node.attrs, width: newWidth });
                      if (dispatch) dispatch(tr);
                      return true;
                    })
                    .run();
                }
              }}
              className="px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-700"
              title="设置为75%宽度"
            >
              75%
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (!editor || selectedImagePos === null) return;
                const node = editor.state.doc.nodeAt(selectedImagePos);
                if (node && node.type.name === 'image') {
                  const newWidth = `100%`;
                  editor.chain().focus()
                    .command(({ tr, dispatch }) => {
                      tr.setNodeMarkup(selectedImagePos, undefined, { ...node.attrs, width: newWidth });
                      if (dispatch) dispatch(tr);
                      return true;
                    })
                    .run();
                }
              }}
              className="px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-700"
              title="设置为100%宽度"
            >
              100%
            </button>
            <div className="w-px h-5 bg-gray-300 mx-0.5" />
            <button
              onClick={() => {
                if (!editor || selectedImagePos === null) return;
                const node = editor.state.doc.nodeAt(selectedImagePos);
                if (node && node.type.name === 'image') {
                  editor.chain().focus()
                    .command(({ tr, dispatch }) => {
                      tr.setNodeMarkup(selectedImagePos, undefined, { ...node.attrs, align: 'left' });
                      if (dispatch) dispatch(tr);
                      return true;
                    })
                    .run();
                }
              }}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
              title="图片左对齐"
            >
              <FaAlignLeft className="text-sm" />
            </button>
            <button
              onClick={() => {
                if (!editor || selectedImagePos === null) return;
                const node = editor.state.doc.nodeAt(selectedImagePos);
                if (node && node.type.name === 'image') {
                  editor.chain().focus()
                    .command(({ tr, dispatch }) => {
                      tr.setNodeMarkup(selectedImagePos, undefined, { ...node.attrs, align: 'center' });
                      if (dispatch) dispatch(tr);
                      return true;
                    })
                    .run();
                }
              }}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
              title="图片居中对齐"
            >
              <FaAlignCenter className="text-sm" />
            </button>
            <button
              onClick={() => {
                if (!editor || selectedImagePos === null) return;
                const node = editor.state.doc.nodeAt(selectedImagePos);
                if (node && node.type.name === 'image') {
                  editor.chain().focus()
                    .command(({ tr, dispatch }) => {
                      tr.setNodeMarkup(selectedImagePos, undefined, { ...node.attrs, align: 'right' });
                      if (dispatch) dispatch(tr);
                      return true;
                    })
                    .run();
                }
              }}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
              title="图片右对齐"
            >
              <FaAlignRight className="text-sm" />
            </button>
            <div className="w-px h-5 bg-gray-300 mx-0.5" />
            <button
              onClick={() => {
                if (!editor || selectedImagePos === null) return;
                const node = editor.state.doc.nodeAt(selectedImagePos);
                if (node && node.type.name === 'image') {
                  const currentWidth = parseInt(node.attrs.width || '100') || 100;
                  const newWidth = `${Math.min(currentWidth + 10, 200)}%`;
                  editor.chain().focus()
                    .command(({ tr, dispatch }) => {
                      tr.setNodeMarkup(selectedImagePos, undefined, { ...node.attrs, width: newWidth });
                      if (dispatch) dispatch(tr);
                      return true;
                    })
                    .run();
                }
              }}
              className="p-1.5 rounded hover:bg-gray-100 text-blue-600"
              title="放大10%"
            >
              <FaSearchPlus className="text-sm" />
            </button>
            <button
              onClick={() => {
                if (!editor || selectedImagePos === null) return;
                const node = editor.state.doc.nodeAt(selectedImagePos);
                if (node && node.type.name === 'image') {
                  const currentWidth = parseInt(node.attrs.width || '100') || 100;
                  const newWidth = `${Math.max(currentWidth - 10, 10)}%`;
                  editor.chain().focus()
                    .command(({ tr, dispatch }) => {
                      tr.setNodeMarkup(selectedImagePos, undefined, { ...node.attrs, width: newWidth });
                      if (dispatch) dispatch(tr);
                      return true;
                    })
                    .run();
                }
              }}
              className="p-1.5 rounded hover:bg-gray-100 text-blue-600"
              title="缩小10%"
            >
              <FaSearchMinus className="text-sm" />
            </button>
            <div className="w-px h-5 bg-gray-300 mx-0.5" />
            <button
              onClick={() => {
                if (!editor || selectedImagePos === null) return;
                const node = editor.state.doc.nodeAt(selectedImagePos);
                if (node && node.type.name === 'image') {
                  editor.chain().focus()
                    .deleteRange({ from: selectedImagePos, to: selectedImagePos + node.nodeSize })
                    .run();
                  setShowImageToolbar(false);
                  setSelectedImagePos(null);
                }
              }}
              className="p-1.5 rounded hover:bg-red-100 text-red-500"
              title="删除图片"
            >
              <FaTrash className="text-sm" />
            </button>
          </div>
        )}
      </div>

      <EditorContent editor={editor} className="rich-text-editor-content" />

      {/* 模板选择器 */}
      {showTemplatePicker && showTemplates && (
        <EditorTemplatePicker
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      {/* Preview Modal */}
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
                className="prose max-w-none"
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

      {/* [已隐藏] 外链图片输入对话框 - 避免外链图片失效导致客户认为是平台问题
      {showImageUrlDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaImage className="text-blue-500" />
                插入外链图片
              </h3>
              <button
                onClick={() => setShowImageUrlDialog(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图片地址 (URL)
              </label>
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmInsertImageUrl();
                  }
                }}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                支持任意可访问的图片链接，如：图床、OSS、新闻网站图片等
              </p>
              {imageUrlInput && (
                <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">预览：</p>
                  <img
                    src={imageUrlInput}
                    alt="预览"
                    className="max-w-full max-h-40 object-contain mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowImageUrlDialog(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmInsertImageUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                插入图片
              </button>
            </div>
          </div>
        </div>
      )}
      */}

      {/* 自定义图片尺寸对话框 */}
      {showImageSizeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaCropAlt className="text-blue-500" />
                设置图片尺寸
              </h3>
              <button
                onClick={() => { setShowImageSizeDialog(false); setImageSizeInput(''); }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                宽度（如：50%、200px、300）
              </label>
              <input
                type="text"
                value={imageSizeInput}
                onChange={(e) => setImageSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomImageSize();
                  }
                }}
                placeholder="例如：50% 或 200px"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {['25%', '50%', '75%', '100%', '150%', '200px', '300px', '500px'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setImageSizeInput(size)}
                    className={`px-2 py-1 text-xs rounded border ${
                      imageSizeInput === size ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowImageSizeDialog(false); setImageSizeInput(''); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCustomImageSize}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                应用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Word导入进度提示 */}
      {wordImporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">正在导入Word文档</p>
                <p className="text-xs text-gray-500 mt-1">{wordImportProgress}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .rich-text-editor-content .ProseMirror {
          outline: none;
          min-height: 300px;
          max-height: 600px;
          overflow-y: auto;
          padding: 16px;
          font-size: 14px;
          line-height: 1.6;
        }
        .rich-text-editor-content .ProseMirror p {
          margin: 0.5em 0;
        }
        .rich-text-editor-content .ProseMirror h1 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0 0.5em 0;
        }
        .rich-text-editor-content .ProseMirror h2 {
          font-size: 1.3em;
          font-weight: bold;
          margin: 0.75em 0 0.5em 0;
        }
        .rich-text-editor-content .ProseMirror h3 {
          font-size: 1.15em;
          font-weight: bold;
          margin: 0.75em 0 0.5em 0;
        }
        .rich-text-editor-content .ProseMirror ul,
        .rich-text-editor-content .ProseMirror ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        .rich-text-editor-content .ProseMirror li {
          margin: 0.25em 0;
        }
        .rich-text-editor-content .ProseMirror strong {
          font-weight: bold;
        }
        .rich-text-editor-content .ProseMirror em {
          font-style: italic;
        }
        .rich-text-editor-content .ProseMirror u {
          text-decoration: underline;
        }
        .rich-text-editor-content .ProseMirror a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .rich-text-editor-content .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1em;
          margin: 0.5em 0;
          color: #6b7280;
          font-style: italic;
        }
        .rich-text-editor-content .ProseMirror pre {
          background: #f3f4f6;
          padding: 1em;
          border-radius: 4px;
          font-family: monospace;
          overflow-x: auto;
        }
        .rich-text-editor-content .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 1em 0;
          cursor: pointer;
          transition: outline 0.15s ease;
        }
        .rich-text-editor-content .ProseMirror img:hover {
          outline: 2px dashed #93c5fd;
          outline-offset: 2px;
        }
        .rich-text-editor-content .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        .rich-text-editor-content .ProseMirror th,
        .rich-text-editor-content .ProseMirror td {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          min-width: 80px;
          position: relative;
        }
        .rich-text-editor-content .ProseMirror th {
          background-color: #dbeafe;
          font-weight: bold;
          color: #1e40af;
        }
        .rich-text-editor-content .ProseMirror td:hover {
          background-color: #f9fafb;
        }
        .rich-text-editor-content .ProseMirror .selectedCell {
          background-color: #bfdbfe !important;
        }
        .rich-text-editor-content .ProseMirror th.selectedCell {
          background-color: #93c5fd !important;
        }
        /* 表格拖拽手柄 */
        .rich-text-editor-content .ProseMirror .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: #3b82f6;
          pointer-events: none;
        }
        .rich-text-editor-content .ProseMirror.resize-cursor {
          cursor: col-resize;
        }
      `}</style>
    </div>
  );
}
