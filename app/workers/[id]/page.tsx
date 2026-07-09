import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface WorkerDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: WorkerDetailPageProps) {
  const worker = await prisma.worker.findUnique({
    where: { id: params.id },
    select: { name: true, title: true },
  });

  if (!worker) {
    return {
      title: '劳动者未找到',
    };
  }

  return {
    title: `${worker.name} - 最美劳动者`,
    description: `${worker.name}，${worker.title}`,
  };
}

export default async function WorkerDetailPage({ params }: WorkerDetailPageProps) {
  const worker = await prisma.worker.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      title: true,
      department: true,
      story: true,
      imageUrl: true,
      isActive: true,
    },
  });

  if (!worker || !worker.isActive) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/workers"
        className="inline-flex items-center text-[#b71c1c] hover:text-[#8b0000] mb-6 transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        返回劳动者列表
      </Link>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* 头部信息 */}
        <div className="bg-gradient-to-br from-[#b71c1c] to-[#8b0000] text-white p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {worker.imageUrl && (
              <div className="w-32 h-32 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
                <img
                  src={worker.imageUrl}
                  alt={worker.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{worker.name}</h1>
              <p className="text-xl text-white/90 mb-2">{worker.title}</p>
              <p className="text-white/80">{worker.department}</p>
            </div>
          </div>
        </div>

        {/* 先进事迹 */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">先进事迹</h2>
          <div
            className="rich-text-content prose max-w-none"
            dangerouslySetInnerHTML={{ __html: worker.story || '' }}
          />
        </div>
      </div>
    </div>
  );
}
