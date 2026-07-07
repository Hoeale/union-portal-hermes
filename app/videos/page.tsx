'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faClock, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';
import FrontendWrapper from '@/components/frontend-wrapper';

interface Video {
  id: string;
  title: string;
  category: string;
  description: string | null;
  source_type: string;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  view_count: number;
  created_at: string;
}

const CATEGORIES = [
  { value: 'all', label: '全部分类' },
  { value: '工会活动', label: '工会活动' },
  { value: '培训教学', label: '培训教学' },
  { value: '宣传视频', label: '宣传视频' },
];

const CATEGORY_COLORS: Record<string, string> = {
  '工会活动': 'bg-blue-100 text-blue-700',
  '培训教学': 'bg-green-100 text-green-700',
  '宣传视频': 'bg-purple-100 text-purple-700',
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function VideosContent() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchVideos();
  }, [selectedCategory]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory === 'all' ? '' : selectedCategory;
      const response = await fetch(`/api/videos?category=${categoryParam}`);
      if (!response.ok) throw new Error('获取数据失败');
      const data = await response.json();
      setVideos(data);
    } catch (err) {
      setError('加载视频失败，请稍后重试');
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-[#b71c1c]" />
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchVideos}
          className="mt-4 px-6 py-2 bg-[#b71c1c] text-white rounded-lg hover:bg-[#9a1616]"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
      {/* Page Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-8 bg-[#b71c1c] rounded-full"></div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[hsl(var(--foreground))]">视频中心</h1>
            <p className="mt-2 text-[hsl(var(--foreground-muted))]">
              观看工会活动、培训教学和宣传视频
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedCategory === cat.value
                  ? 'bg-[#b71c1c] text-white shadow-lg shadow-[#b71c1c]/30'
                  : 'bg-white text-[hsl(var(--foreground-muted))] hover:bg-[#b71c1c]/10 hover:text-[#b71c1c] border border-[hsl(var(--card-border))]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      {videos.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🎬</div>
          <p className="text-[hsl(var(--foreground-muted))]">暂无视频</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <a
              key={video.id}
              href={`/videos/${video.id}`}
              className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[hsl(var(--card-border))]"
            >
              {/* Thumbnail */}
              <div className="relative w-full h-48 bg-gray-900 overflow-hidden">
                {video.thumbnail_url ? (
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faPlay} className="text-4xl text-gray-400" />
                  </div>
                )}
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FontAwesomeIcon icon={faPlay} className="text-[#b71c1c] ml-1" />
                  </div>
                </div>
                {/* Duration Badge */}
                {video.duration && (
                  <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                    <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                    {formatDuration(video.duration)}
                  </div>
                )}
                {/* Category Badge */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-semibold ${CATEGORY_COLORS[video.category]}`}>
                  {video.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-[hsl(var(--foreground))] line-clamp-2 group-hover:text-[#b71c1c] transition-colors">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="mt-2 text-sm text-[hsl(var(--foreground-muted))] line-clamp-2 whitespace-pre-wrap">
                    {video.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-[hsl(var(--foreground-muted))]">
                  <span>{new Date(video.created_at).toLocaleDateString('zh-CN')}</span>
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                    {video.view_count} 次播放
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VideosPage() {
  return <FrontendWrapper><VideosContent /></FrontendWrapper>;
}
