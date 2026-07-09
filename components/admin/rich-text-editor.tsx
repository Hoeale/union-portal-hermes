'use client';

import dynamic from 'next/dynamic';

// wangEditor 依赖 DOM，必须关闭 SSR，仅在客户端加载
const WangEditor = dynamic(() => import('./wang-editor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 rounded-lg bg-white p-4 text-gray-400 text-sm">
      编辑器加载中…
    </div>
  ),
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  showPreview?: boolean;
  showTemplates?: boolean;
}

export default function RichTextEditor(props: RichTextEditorProps) {
  return <WangEditor {...props} />;
}
