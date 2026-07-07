'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLayoutConfig } from '@/components/v2/layout-config-context';

interface V2HeaderConfig {
  title: string;
  subtitle: string;
  logo: string;
  background_image: string;
}

const DEFAULT_CONFIG: V2HeaderConfig = {
  title: '西安高新区总工会',
  subtitle: 'XI\'AN HIGH-TECH ZONE FEDERATION OF TRADE UNIONS',
  logo: '/logo.png',
  background_image: '/header-bg.webp',
};

export default function Header() {
  const { config } = useLayoutConfig();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const headerConfig = config?.v2_header || DEFAULT_CONFIG;

  return (
    /* Header Banner with Background Image - Fixed height, not full screen */
    <div className="relative w-full h-[180px] lg:h-[200px] overflow-hidden shrink-0">
      {/* Background layer */}
      <div className="absolute inset-0">
        {/* Gradient background (always visible) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#b71c1c] to-[#8b0000]" />
        
        {/* Background image (if loaded successfully) - contain instead of cover */}
        {!imageError && headerConfig.background_image && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src={headerConfig.background_image}
              alt=""
              width={1920}
              height={200}
              className="object-cover w-full h-full"
              priority
              quality={80}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                console.error('Failed to load header background image:', headerConfig.background_image);
                setImageError(true);
              }}
            />
          </div>
        )}
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-10 h-full flex items-center gap-6">
        {headerConfig.logo && (
          <div className="flex-shrink-0">
            <Image
              src={headerConfig.logo}
              alt="Logo"
              width={80}
              height={80}
              className="object-contain"
              onError={(e) => console.error('Failed to load logo:', headerConfig.logo)}
            />
          </div>
        )}
        <div className="text-white">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-wide">
            {headerConfig.title}
          </h1>
        </div>
      </div>
    </div>
  );
}
