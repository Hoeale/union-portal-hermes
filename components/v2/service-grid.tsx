'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConciergeBell, MapPin, UserPlus, ArrowLeftRight, MessageSquare, GraduationCap, User, Heart, MoreHorizontal } from 'lucide-react';

// 图标映射
const iconMap: Record<string, any> = {
  'map': MapPin,
  'user-plus': UserPlus,
  'exchange-alt': ArrowLeftRight,
  'comment-dots': MessageSquare,
  'graduation-cap': GraduationCap,
  'female': User,
  'heart': Heart,
  'ellipsis-h': MoreHorizontal,
};

// 服务图标映射（根据标题匹配）
const TITLE_ICON_MAP: Record<string, string> = {
  '工会地图': 'map',
  '入会': 'user-plus',
  '入会申请': 'user-plus',
  '转会': 'exchange-alt',
  '转会申请': 'exchange-alt',
  '工会关系转移': 'exchange-alt',
  '职工诉求': 'comment-dots',
  '求学圆梦': 'graduation-cap',
  '女职工评优': 'female',
  '女职工评优申报': 'female',
  '困难职工': 'heart',
  '困难职工申报': 'heart',
  '更多服务': 'ellipsis-h',
  '更多服务敬请期待': 'ellipsis-h',
};

interface Service {
  id: string;
  title: string;
  orderIndex: number;
}

export default function ServiceGrid() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          // 按 orderIndex 排序
          const sorted = data.sort((a: any, b: any) => a.orderIndex - b.orderIndex);
          setServices(sorted);
        }
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // 获取服务图标
  const getIcon = (title: string) => {
    return TITLE_ICON_MAP[title] || 'ellipsis-h';
  };

  // 获取服务路由（使用实际ID）
  const getHref = (service: Service) => {
    return `/services/${service.id}`;
  };

  if (loading) {
    return (
      <div className="my-8">
        <div className="border-l-[8px] border-l-[#b71c1c] pl-5 mb-6">
          <h2 className="text-2xl font-bold text-[#1e2b3c]">
            <ConciergeBell className="inline mr-2 w-7 h-7" />
            办事服务
          </h2>
        </div>
        <div className="grid grid-cols-8 gap-4 text-center">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2" />
              <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      <div className="border-l-[8px] border-l-[#b71c1c] pl-5 mb-6">
        <h2 className="text-2xl font-bold text-[#1e2b3c]">
          <ConciergeBell className="inline mr-2 w-7 h-7" />
          办事服务
        </h2>
      </div>

      {/* 服务图标网格 */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 text-center">
        {services.map((service) => {
          const IconComponent = iconMap[getIcon(service.title)] || ConciergeBell;
          return (
            <Link key={service.id} href={getHref(service)} className="icon-card block">
              <IconComponent className="w-8 h-8 text-[#b22222] mb-2 block mx-auto" />
              <span className="font-semibold text-sm">{service.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
