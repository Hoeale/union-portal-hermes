'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">出错了</h2>
        <p className="text-[hsl(var(--foreground-muted))] mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-lg hover:bg-[hsl(var(--primary-dark))] transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
}
