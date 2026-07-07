'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faClock, faArrowRight, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface Video {
  id: string;
  title: string;
  category: string;
  thumbnail_url: string | null;
  duration: number | null;
  created_at: string;
}

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

export default function VideoSection({ limit = 4 }: { limit?: number }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetchVideos();
    // Fetch layout configuration
    fetch('/api/layout-config')
      .then((res) => res.json())
      .then((config) => {
        const videoSection = config.home_sections?.find(
          (section: any) => section.id === 'videos'
        );
        setVisible(videoSection ? videoSection.visible : true);
      })
      .catch((error) => {
        console.error('Failed to fetch layout config:', error);
      });
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch(`/api/videos?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-gray-400" />
        </div>
      </section>
    );
  }

  // Hide if video center is disabled or no videos
  if (!visible || videos.length === 0) {
    return null;
  }

  return (
    <section className="animate-fade-in" style={{ animationDelay: '300ms' }}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-[#b71c1c] rounded-full"></div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">视频中心</h2>
        </div>
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#b71c1c] hover:text-[#9a1616] transition-colors"
        >
          查看更多
          <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
        </Link>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
          <Link
            key={video.id}
            href={`/videos/${video.id}`}
            className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[hsl(var(--card-border))]"
          >
            {/* Thumbnail */}
            <div className="relative w-full h-40 bg-gray-900 overflow-hidden">
              {video.thumbnail_url ? (
                <Image
                  src={video.thumbnail_url}
                  alt={video.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faPlay} className="text-3xl text-gray-400" />
                </div>
              )}
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FontAwesomeIcon icon={faPlay} className="text-[#b71c1c] ml-1" />
                </div>
              </div>
              {/* Duration Badge */}
              {video.duration && (
                <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                  {formatDuration(video.duration)}
                </div>
              )}
              {/* Category Badge */}
              <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-semibold ${CATEGORY_COLORS[video.category]}`}>
                {video.category}
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              <h3 className="font-medium text-[hsl(var(--foreground))] line-clamp-2 text-sm group-hover:text-[#b71c1c] transition-colors">
                {video.title}
              </h3>
              <p className="mt-1 text-xs text-[hsl(var(--foreground-muted))]">
                {new Date(video.created_at).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
