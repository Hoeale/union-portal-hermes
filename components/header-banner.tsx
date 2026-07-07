'use client';

import Image from 'next/image';

export default function HeaderBanner() {
  return (
    <div className="relative w-full h-[180px] lg:h-[220px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/header-bg.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 h-full flex items-center">
        <div className="text-white">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-wide">
            西安高新区总工会
          </h1>
        </div>
      </div>
    </div>
  );
}
