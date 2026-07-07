'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ChevronRight, Newspaper, ChevronLeft } from 'lucide-react';

interface CarouselItem {
  id: string;
  news_id: string;
  image_url: string;
  title: string;
}

export default function HeadlineSection() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCarousel = async () => {
      try {
        const response = await fetch('/api/carousel');
        if (response.ok) {
          const data = await response.json();
          setItems(data);
        }
      } catch (error) {
        console.error('Error fetching carousel:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCarousel();
  }, []);

  // 自动轮播
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <div className="flex gap-6 mb-8">
      {/* 左侧：轮播图区域 */}
      <div className="flex-1 bg-gradient-to-br from-[#fdf3f3] to-white rounded-2xl p-6 border-l-6 border-[#b71c1c] shadow-sm relative overflow-hidden">
        {loading ? (
          <div className="aspect-video bg-gray-200 rounded-xl animate-pulse flex items-center justify-center">
            <div className="text-gray-400">加载中...</div>
          </div>
        ) : items.length > 0 ? (
          <>
            {/* 轮播图片 */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white text-xl font-bold line-clamp-2">{item.title}</h3>
                  </div>
                </div>
              ))}

              {/* 轮播控制按钮 */}
              {items.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all hover:scale-110"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all hover:scale-110"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* 指示点 */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {items.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentIndex ? 'bg-white w-6' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          /* 默认显示 */
          <div className="bg-gradient-to-br from-[#f5f5f5] to-white rounded-xl p-8">
            <div className="flex gap-3 mb-5">
              <span className="bg-[#c62828] text-white px-5 py-1.5 rounded-full font-bold text-base tracking-wider">
                强国
              </span>
              <span className="bg-[#1e3a6f] text-white px-5 py-1.5 rounded-full font-bold text-base">
                技能
              </span>
            </div>
            <div className="text-2xl font-bold text-[#1e2b3c] mb-3 leading-relaxed">
              深入学习贯彻习近平新时代中国特色社会主义思想
            </div>
            <div className="text-[#3e4a5c] text-base mt-3">
              深学细悟 凝心铸魂 · 推动工会工作高质量发展
            </div>
            <div className="mt-5">
              <span className="bg-[#eef3f9] px-4 py-1.5 rounded-full text-sm">
                <Newspaper className="inline mr-1 w-4 h-4" />
                主题教育进行时
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 右侧：头条关注 */}
      <div className="flex-[0.9] bg-[#fafafa] rounded-2xl p-5 border border-[#e9eef2]">
        <div>
          <h3 className="text-lg font-bold text-[#a51b1b] mb-4 border-b-2 border-dashed border-[#ccc] pb-2">
            <Star className="inline mr-2 w-5 h-5" />
            头条关注
          </h3>
          <div className="space-y-5">
            <div>
              <Link href="#" className="text-lg font-semibold text-[#1f2d3d] no-underline leading-relaxed hover:text-[#b71c1c]">
                中共中央关于认真学习宣传贯彻党的二十大精神
              </Link>
              <div className="text-xs text-[#777] mt-1">中共中央关于认真学习宣传贯彻党的二十...</div>
            </div>
            <div>
              <Link href="#" className="text-lg font-semibold text-[#1f2d3d] no-underline leading-relaxed hover:text-[#b71c1c]">
                党的二十大报告学习辅导百问
              </Link>
            </div>
          </div>
          <div className="text-right mt-3">
            <Link href="/news" className="text-[#b71c1c] font-semibold text-sm no-underline">
              更多头条 <ChevronRight className="inline w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
