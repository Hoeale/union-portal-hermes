'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarouselItem {
  id: string;
  news_id: string;
  display_order: number;
  image_url: string;
  title: string;
  link_url?: string | null;
}

interface CarouselProps {
  className?: string;
}

export default function Carousel({ className }: CarouselProps) {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch carousel items
  useEffect(() => {
    const fetchCarouselItems = async () => {
      try {
        const response = await fetch('/api/carousel');
        if (!response.ok) throw new Error('Failed to fetch carousel items');
        const data = await response.json();
        setItems(data || []);
      } catch (error) {
        console.error('Error fetching carousel items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarouselItems();
  }, []);

  // Auto-rotate every 5 seconds (paused on hover)
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [items.length, isPaused]);

  // Navigation handlers
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Handle click to navigate
  const handleItemClick = (item: CarouselItem) => {
    if (item.link_url) {
      // If there's a custom link, use it
      window.open(item.link_url, '_blank');
    } else if (item.news_id && item.news_id !== '00000000-0000-0000-0000-000000000000') {
      // If it's associated with a news item, go to news detail
      window.location.href = `/news/${item.news_id}`;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn('relative w-full h-[500px] lg:h-[600px] skeleton', className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
            <div className="text-[hsl(var(--foreground-muted))] font-medium">加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback display when no items
  if (items.length === 0) {
    return (
      <div className={cn('relative w-full h-[500px] lg:h-[600px] gradient-primary overflow-hidden', className)}>
        <div className="absolute inset-0 bg-texture" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/20" />
        <div className="relative h-full flex flex-col items-center justify-center text-white text-center px-4 animate-fade-in">
          <div className="text-8xl mb-6 opacity-90">🏛️</div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-wide">西安高新区总工会</h2>
          <p className="text-lg lg:text-xl opacity-90 max-w-2xl">
            服务职工 · 凝聚力量 · 促进发展
          </p>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div
      className={cn('relative w-full h-[500px] lg:h-[600px] overflow-hidden group', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel Images */}
      <div className="relative w-full h-full bg-gray-900">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'absolute inset-0 transition-all duration-700 ease-out cursor-pointer',
              index === currentIndex
                ? 'opacity-100 scale-100 z-10'
                : 'opacity-0 scale-105 z-0'
            )}
            onClick={() => handleItemClick(item)}
          >
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            />
            {/* Multi-layer gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

            {/* Title overlay with animation */}
            <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
              <div className={cn(
                'max-w-4xl transition-all duration-700 delay-100',
                index === currentIndex ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              )}>
                <div className="inline-flex items-center px-4 py-1.5 bg-[hsl(var(--primary))] text-white text-sm font-medium rounded-full mb-4 shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                  精彩推荐
                </div>
                <h3 className="text-white text-2xl lg:text-4xl font-bold leading-tight drop-shadow-2xl">
                  {item.title}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      {items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-0"
            aria-label="上一张"
          >
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100 translate-x-full group-hover:translate-x-0"
            aria-label="下一张"
          >
            <ChevronRight size={28} strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Enhanced Dots Indicator */}
      {items.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'bg-[hsl(var(--accent-light))] w-10 shadow-lg shadow-[hsl(var(--accent-light))]/50'
                  : 'bg-white/50 hover:bg-white/70 w-6'
              )}
              aria-label={`跳转到第 ${index + 1} 张`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {items.length > 1 && !isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div
            className="h-full bg-[hsl(var(--accent-light))] transition-all duration-100 ease-linear"
            style={{
              animation: 'progress 5s linear infinite',
              width: '100%',
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
