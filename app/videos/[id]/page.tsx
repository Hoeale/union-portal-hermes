'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faPlay, faClock, faEye, faSpinner,
  faCalendar, faTag
} from '@fortawesome/free-solid-svg-icons';
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

interface RelatedVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: number | null;
  category: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 解析外部视频URL为embed URL
function getEmbedUrl(videoUrl: string): string | null {
  // Bilibili
  const bilibiliMatch = videoUrl.match(/bilibili\.com\/video\/(BV\w+)/);
  if (bilibiliMatch) {
    return `//player.bilibili.com/player.html?bvid=${bilibiliMatch[1]}&high_quality=1`;
  }

  // 腾讯视频
  const qqMatch = videoUrl.match(/v\.qq\.com\/x\/cover\/\w+\/(\w+)\.html/);
  if (qqMatch) {
    return `//v.qq.com/txp/iframe/player.html?vid=${qqMatch[1]}`;
  }

  // YouTube
  const youtubeMatch = videoUrl.match(/youtube\.com\/watch\?v=([\w-]+)/);
  if (youtubeMatch) {
    return `//www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Youku
  const youkuMatch = videoUrl.match(/youku\.com\/v_show\/id_([\w=]+)\.html/);
  if (youkuMatch) {
    return `//player.youku.com/embed/${youkuMatch[1]}`;
  }

  return null;
}

function VideoPlayerContent({ video }: { video: Video }) {
  if (video.source_type === 'local') {
    return (
      <video
        controls
        className="w-full h-full"
        poster={video.thumbnail_url || undefined}
        preload="metadata"
      >
        <source src={video.video_url} type="video/mp4" />
        您的浏览器不支持视频播放
      </video>
    );
  }

  // External video
  const embedUrl = getEmbedUrl(video.video_url);
  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Fallback: try direct iframe
  return (
    <iframe
      src={video.video_url}
      className="w-full h-full"
      frameBorder="0"
      allowFullScreen
    />
  );
}

function VideoDetailContent() {
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get video ID from URL
    const pathParts = window.location.pathname.split('/');
    const videoId = pathParts[pathParts.length - 2]; // /videos/[id]/

    if (!videoId) {
      setError('视频ID无效');
      setLoading(false);
      return;
    }

    fetchVideoData(videoId);
  }, []);

  const fetchVideoData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/videos/${id}`);
      if (!response.ok) throw new Error('获取视频失败');
      const data = await response.json();
      setVideo(data);

      // Fetch related videos
      const relatedResponse = await fetch(`/api/videos?category=${data.category}&limit=6`);
      if (relatedResponse.ok) {
        const related = await relatedResponse.json();
        setRelatedVideos(related.filter((v: any) => v.id !== id).slice(0, 4));
      }
    } catch (err) {
      setError('加载视频失败，请稍后重试');
      console.error('Error fetching video:', err);
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

  if (error || !video) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error || '视频不存在'}</p>
        <Link href="/videos" className="mt-4 inline-block px-6 py-2 bg-[#b71c1c] text-white rounded-lg hover:bg-[#9a1616]">
          返回视频列表
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* Back Link */}
      <Link href="/videos" className="inline-flex items-center gap-2 text-[hsl(var(--foreground-muted))] hover:text-[#b71c1c] transition-colors mb-6">
        <FontAwesomeIcon icon={faArrowLeft} />
        返回视频列表
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Video */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="bg-black rounded-xl overflow-hidden aspect-video">
            <VideoPlayerContent video={video} />
          </div>

          {/* Video Info */}
          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-[hsl(var(--card-border))]">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                video.category === '工会活动' ? 'bg-blue-100 text-blue-700' :
                video.category === '培训教学' ? 'bg-green-100 text-green-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {video.category}
              </span>
              <span className="flex items-center gap-1 text-sm text-[hsl(var(--foreground-muted))]">
                <FontAwesomeIcon icon={faCalendar} className="w-4 h-4" />
                {new Date(video.created_at).toLocaleDateString('zh-CN')}
              </span>
              <span className="flex items-center gap-1 text-sm text-[hsl(var(--foreground-muted))]">
                <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                {video.view_count} 次播放
              </span>
              {video.duration && (
                <span className="flex items-center gap-1 text-sm text-[hsl(var(--foreground-muted))]">
                  <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
                  {formatDuration(video.duration)}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">
              {video.title}
            </h1>

            {video.description && (
              <div className="prose max-w-none text-[hsl(var(--foreground-muted))] whitespace-pre-wrap">
                {video.description}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Related Videos */}
        <div>
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faTag} />
            相关视频
          </h3>

          {relatedVideos.length === 0 ? (
            <p className="text-[hsl(var(--foreground-muted))] text-sm">暂无相关视频</p>
          ) : (
            <div className="space-y-4">
              {relatedVideos.map((related) => (
                <Link
                  key={related.id}
                  href={`/videos/${related.id}`}
                  className="group flex gap-3 p-3 bg-white rounded-lg hover:bg-[hsl(var(--background))] transition-colors border border-[hsl(var(--card-border))]"
                >
                  {/* Thumbnail */}
                  <div className="relative w-28 h-16 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                    {related.thumbnail_url ? (
                      <Image
                        src={related.thumbnail_url}
                        alt={related.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faPlay} className="text-gray-400" />
                      </div>
                    )}
                    {related.duration && (
                      <div className="absolute bottom-1 right-1 bg-black/80 text-white px-1 py-0.5 rounded text-[10px]">
                        {formatDuration(related.duration)}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[hsl(var(--foreground))] line-clamp-2 group-hover:text-[#b71c1c] transition-colors">
                      {related.title}
                    </h4>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                      related.category === '工会活动' ? 'bg-blue-100 text-blue-700' :
                      related.category === '培训教学' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {related.category}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VideoDetailPage() {
  return <FrontendWrapper><VideoDetailContent /></FrontendWrapper>;
}
