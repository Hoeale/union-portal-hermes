import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-[#b71c1c] mb-4">404</h1>
          <div className="w-24 h-1 bg-[#b71c1c] mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))] mb-3">
            页面未找到
          </h2>
          <p className="text-[hsl(var(--foreground-muted))] mb-8">
            抱歉，您访问的页面不存在或已被移除。
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#b71c1c] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#9a1616] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          返回首页
        </Link>
      </div>
    </div>
  );
}
