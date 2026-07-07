'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { QrCode, X } from 'lucide-react';
import { useLayoutConfig } from '@/components/v2/layout-config-context';

interface V2ServicePanelConfig {
  title: string;
  qrcode_text: string;
  qrcode_image_1: string;
  qrcode_label_1: string;
  qrcode_image_2: string;
  qrcode_label_2: string;
}

const DEFAULT_CONFIG: V2ServicePanelConfig = {
  title: '欢迎关注',
  qrcode_text: '扫码关注西安高新工会',
  qrcode_image_1: '/uploads/wechat-qrcode.jpg',
  qrcode_label_1: '微信公众号',
  qrcode_image_2: '/uploads/video-qrcode.jpg',
  qrcode_label_2: '视频号',
};

export default function ServicePanel() {
  const { config } = useLayoutConfig();
  const servicePanelConfig = config?.v2_service_panel || DEFAULT_CONFIG;
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  const [lightboxLabel, setLightboxLabel] = useState('');

  const openLightbox = (image: string, label: string) => {
    setLightboxImage(image);
    setLightboxLabel(label);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage('');
    setLightboxLabel('');
  };

  return (
    <div className="flex-[1.2] bg-[#f2f6fc] rounded-2xl p-5">
      <div className="text-lg font-bold mb-5 text-[#1e3a6f]">
        <QrCode className="inline mr-2 w-5 h-5" />
        {servicePanelConfig.title}
      </div>

      {/* 二维码区域 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 微信公众号二维码 */}
        <div 
          className="bg-white rounded-xl p-4 border border-[#e2e9f0] cursor-pointer hover:shadow-lg transition-shadow group"
          onClick={() => openLightbox(servicePanelConfig.qrcode_image_1, servicePanelConfig.qrcode_label_1)}
        >
          <div className="text-center">
            <p className="text-sm font-semibold text-[#1e3a6f] mb-2">{servicePanelConfig.qrcode_label_1}</p>
            <div className="w-full aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden relative">
              {servicePanelConfig.qrcode_image_1 ? (
                <Image
                  src={servicePanelConfig.qrcode_image_1}
                  alt={servicePanelConfig.qrcode_label_1}
                  width={140}
                  height={140}
                  className="object-contain w-full h-full"
                />
              ) : (
                <QrCode className="w-12 h-12 text-gray-300" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">点击查看大图</span>
              </div>
            </div>
          </div>
        </div>

        {/* 视频号二维码 */}
        <div 
          className="bg-white rounded-xl p-4 border border-[#e2e9f0] cursor-pointer hover:shadow-lg transition-shadow group"
          onClick={() => openLightbox(servicePanelConfig.qrcode_image_2, servicePanelConfig.qrcode_label_2)}
        >
          <div className="text-center">
            <p className="text-sm font-semibold text-[#1e3a6f] mb-2">{servicePanelConfig.qrcode_label_2}</p>
            <div className="w-full aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden relative">
              {servicePanelConfig.qrcode_image_2 ? (
                <Image
                  src={servicePanelConfig.qrcode_image_2}
                  alt={servicePanelConfig.qrcode_label_2}
                  width={140}
                  height={140}
                  className="object-contain w-full h-full"
                />
              ) : (
                <QrCode className="w-12 h-12 text-gray-300" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">点击查看大图</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部提示文字 */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">{servicePanelConfig.qrcode_text}</p>
      </div>

      {/* 大图查看光箱 */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          <button 
            className="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightboxImage}
              alt={lightboxLabel}
              width={500}
              height={500}
              className="w-full h-auto rounded-lg"
            />
            <p className="text-center text-white mt-4 text-lg font-medium">{lightboxLabel}</p>
          </div>
        </div>
      )}
    </div>
  );
}
