'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSWR } from '@/lib/swr';

interface CarouselNews {
  id: string;
  title: string;
  category: string | null;
  image_url: string | null;
  published_at: string;
  link_url?: string | null;
  source?: 'news' | 'carousel';
}

interface HeroCarouselProps {
  news?: CarouselNews[];
  limit?: number;           // 轮播图数量，默认 5，最多 10
  sideLimit?: number;       // 右侧新闻列表数量，默认 5，最多 10
  autoRotate?: boolean;     // 是否自动轮播，默认 true
  interval?: number;        // 轮播间隔（毫秒），默认 5000
}

export default function HeroCarousel({ 
  news: propNews, 
  limit = 5, 
  sideLimit = 5, 
  autoRotate = true, 
  interval = 5000 
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // 如果传入了 props 数据（SSR 模式），直接使用
  const shouldFetch = !propNews || propNews.length === 0;
  const fetchLimit = Math.min(sideLimit || 5, 10);
    
  const { data: fetchedNews, isLoading: loading } = useSWR<CarouselNews[]>(
    shouldFetch ? `/api/news?is_carousel=true&limit=${fetchLimit}` : null
  );
  
  // 处理数据：优先使用 props，否则使用 fetch 的数据
  const allNews = propNews && propNews.length > 0 
    ? propNews 
    : (fetchedNews || []);
  
  const carouselLimit = Math.min(limit || 5, 10);
  const news = allNews.slice(0, carouselLimit);
  const sideNews = allNews;

  // Auto-rotate based on autoRotate prop and interval
  useEffect(() => {
    if (news.length <= 1 || isPaused || !autoRotate) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, interval);

    return () => clearInterval(intervalId);
  }, [news.length, isPaused, autoRotate, interval]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % news.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Carousel Skeleton */}
          <div className="lg:col-span-2">
            <div className="relative w-full h-[200px] lg:h-[300px] bg-gray-200 rounded-2xl overflow-hidden animate-pulse" />
          </div>
          {/* Side List Skeleton */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="w-full h-[300px] bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="relative w-full h-[400px] lg:h-[500px] bg-gradient-to-br from-[#b71c1c] to-[#8b0000] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">西安高新区总工会</h2>
            <p className="text-lg">欢迎访问</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Carousel - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div
            className="relative w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Slides */}
            {news.map((item, index) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                {/* Image */}
                {item.image_url && !imageErrors.has(item.id) ? (
                  <div className="relative w-full h-full bg-gradient-to-br from-[#b71c1c] to-[#8b0000]">
                    <Image
                      src={item.image_url}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      priority={index === 0}
                      className="object-cover"
                      onError={() => {
                        // 图片加载失败时隐藏图片，显示红色渐变背景
                        setImageErrors(prev => new Set(prev).add(item.id));
                      }}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#b71c1c] to-[#8b0000]" />
                )}

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 z-20">
                  {/* Category Badge - 公告类不显示 */}
                  {item.category !== '公告' && (
                    <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold bg-[#b71c1c] text-white rounded-full">
                      {item.category}
                    </span>
                  )}

                  {/* Title */}
                  {item.link_url ? (
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-white hover:text-gray-200 transition-colors"
                    >
                      <h2 className="text-xl lg:text-2xl font-bold line-clamp-2 leading-tight mb-2">
                        {item.title}
                      </h2>
                    </a>
                  ) : (
                    <Link
                      href={`/view/${new Date(item.published_at).toISOString().slice(0,10).replace(/-/g,'')}/${item.id.replace(/-/g,'').substring(0,5)}`}
                      className="block text-white hover:text-gray-200 transition-colors"
                    >
                      <h2 className="text-xl lg:text-2xl font-bold line-clamp-2 leading-tight mb-2">
                        {item.title}
                      </h2>
                    </Link>
                  )}

                  {/* Date */}
                  <p className="text-white/80 text-sm">
                    {new Date(item.published_at).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Navigation Arrows */}
            {news.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
                  aria-label="上一张"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
                  aria-label="下一张"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Indicators */}
            {news.length > 1 && (
              <div className="absolute bottom-4 right-4 z-30 flex gap-2">
                {news.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-[#ffd966] w-6'
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`切换到第${index + 1}张`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side News List - Takes 1 column */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="w-full h-[500px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold text-[#1e2b3c]">轮播新闻</h3>
              <Link href="/news" className="text-sm text-[#b71c1c] hover:text-[#8b0000]">
                更多 →
              </Link>
            </div>

            {/* News List - Fixed height for 5 items */}
            <div className="flex-1 overflow-hidden">
              <div className="divide-y divide-gray-50">
                {(sideNews.length > 0 ? sideNews : news).slice(0, 5).map((item, index) => (
                  <div
                    key={item.id}
                    className="px-5 py-5 hover:bg-gray-50 transition-colors h-[88px] flex flex-col justify-center"
                    onClick={() => goToSlide(index)}
                  >
                    <Link
                      href={`/view/${new Date(item.published_at).toISOString().slice(0,10).replace(/-/g,'')}/${item.id.replace(/-/g,'').substring(0,5)}`}
                      className={`block ${
                        index === currentIndex ? 'bg-red-50 -ml-4 pl-4 border-l-4 border-[#b71c1c]' : ''
                      }`}
                    >
                      <h4
                        className={`text-base leading-snug truncate ${
                          index === currentIndex ? 'text-[#b71c1c] font-semibold' : 'text-gray-800'
                        }`}
                        title={item.title}
                      >
                        {item.title}
                      </h4>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
