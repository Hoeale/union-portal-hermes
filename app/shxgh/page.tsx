'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Shield,
  Users,
  FileText,
  Phone,
  HelpCircle,
  MessageSquare,
  BarChart3,
  Award,
  BookOpen,
  Home,
  Building2,
  Gavel,
  Newspaper,
  Briefcase,
  HeartHandshake,
  Heart,
  Scale,
  TrendingUp,
  MapPin,
} from 'lucide-react';

// 类型定义
interface NewsItem {
  id: string;
  title: string;
  category: string;
  published_at: string;
}

interface CarouselItem {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
}

interface Policy {
  id: string;
  title: string;
  publishDate: string;
  category: string;
}

interface Worker {
  id: string;
  name: string;
  title: string;
  department: string;
  imageUrl?: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
}

// 导航数据
const navItems = [
  { name: '首页', href: '/', active: true },
  { name: '工会概况', href: '/about', active: false },
  { name: '新闻动态', href: '/news', active: false },
  { name: '政策法规', href: '/policies', active: false },
  { name: '办事服务', href: '/services', active: false },
  { name: '劳模工匠', href: '/workers', active: false },
  { name: '互动交流', href: '#', active: false },
];

// 服务入口数据（从API获取，这里是fallback）
const defaultServices = [
  { icon: Shield, title: '维权服务', desc: '法律援助' },
  { icon: Users, title: '网上入会', desc: '便捷入会' },
  { icon: Gavel, title: '法律援助', desc: '免费咨询' },
  { icon: MessageSquare, title: '互动交流', desc: '意见反馈' },
  { icon: BarChart3, title: '问卷调查', desc: '参与调查' },
  { icon: Award, title: '劳模工匠', desc: '风采展示' },
  { icon: BookOpen, title: '职工书屋', desc: '在线阅读' },
  { icon: HeartHandshake, title: '关爱服务', desc: '温暖关怀' },
];

export default function ShxghHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 数据状态
  const [carouselData, setCarouselData] = useState<CarouselItem[]>([]);
  const [mediaNews, setMediaNews] = useState<NewsItem[]>([]);
  const [unionNews, setUnionNews] = useState<NewsItem[]>([]);
  const [notices, setNotices] = useState<NewsItem[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取轮播图
        const carouselRes = await fetch('/api/carousel');
        if (carouselRes.ok) {
          const carouselItems = await carouselRes.json();
          setCarouselData(carouselItems.length > 0 ? carouselItems : [
            { id: '1', title: '西安高新区总工会会员代表大会', image_url: '/images/sl-1.jpg' },
            { id: '2', title: '学习贯彻党的二十大精神', image_url: '/images/sl-2.jpg' },
            { id: '3', title: '高新区劳模工匠风采展示', image_url: '/images/sl-3.jpg' },
          ]);
        }

        // 获取新闻动态（媒体聚焦和工会动态分别获取）
        const mediaRes = await fetch('/api/news?category=媒体&limit=6');
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          setMediaNews(mediaData.slice(0, 6));
        }
        const unionRes = await fetch('/api/news?category=动态&limit=6');
        if (unionRes.ok) {
          const unionData = await unionRes.json();
          setUnionNews(unionData.slice(0, 6));
        }

        // 获取公告
        const noticeRes = await fetch('/api/news?category=公告&limit=4');
        if (noticeRes.ok) {
          const noticeData = await noticeRes.json();
          setNotices(noticeData);
        }

        // 获取政策文件
        const policyRes = await fetch('/api/policies?limit=5');
        if (policyRes.ok) {
          const policyData = await policyRes.json();
          setPolicies(policyData);
        }

        // 获取劳模工匠
        const workerRes = await fetch('/api/workers?limit=4');
        if (workerRes.ok) {
          const workerData = await workerRes.json();
          setWorkers(workerData);
        }

        // 获取服务
        const serviceRes = await fetch('/api/services');
        if (serviceRes.ok) {
          const serviceData = await serviceRes.json();
          setServices(serviceData.slice(0, 8));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 轮播图自动播放
  useEffect(() => {
    if (carouselData.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselData.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % (carouselData.length || 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + (carouselData.length || 1)) % (carouselData.length || 1));

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          {/* 顶部信息栏 */}
          <div className="flex items-center justify-between py-4">
            {/* Logo 区域 */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                高
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-700">西安高新区总工会</h1>
                <p className="text-sm text-red-600">Xi&apos;an High-Tech Zone Federation of Trade Unions</p>
              </div>
            </div>

            {/* 标语和搜索 */}
            <div className="hidden md:flex items-center gap-8">
              <p className="text-red-600 font-medium text-lg">忠诚党的事业，竭诚服务职工</p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="请输入关键词"
                  className="w-64 px-4 py-2 border-2 border-red-200 rounded-full focus:outline-none focus:border-red-500 text-sm"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
                  <Search size={18} />
                </button>
              </div>
            </div>

            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden p-2 text-red-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* 导航栏 */}
          <nav className={`md:block ${mobileMenuOpen ? 'block' : 'hidden'}`}>
            <ul className="flex flex-col md:flex-row md:items-center border-t border-red-100">
              {navItems.map((item, index) => (
                <li key={index} className="flex-1">
                  <Link
                    href={item.href}
                    className={`block text-center py-3 px-4 text-sm font-medium transition-colors ${
                      item.active
                        ? 'bg-red-600 text-white'
                        : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {/* 轮播图区域 */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        {loading ? (
          <div className="h-full bg-red-100 animate-pulse" />
        ) : carouselData.length > 0 ? (
          carouselData.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="h-full bg-gradient-to-r from-red-700 to-red-900 flex items-center">
                <div className="container mx-auto px-4">
                  <div className="flex items-center justify-between">
                    <div className="text-white max-w-2xl">
                      <h2 className="text-3xl md:text-5xl font-bold mb-4">{slide.title}</h2>
                      <p className="text-xl md:text-2xl opacity-90">西安高新区总工会</p>
                    </div>
                    <div className="hidden md:block w-80 h-60 bg-white/20 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full bg-gradient-to-r from-red-700 to-red-900 flex items-center justify-center text-white">
            <p>暂无轮播图</p>
          </div>
        )}

        {/* 轮播控制 */}
        {carouselData.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-red-600 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-red-600 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* 指示器 */}
        {carouselData.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {carouselData.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* 主要内容区域 */}
      <main className="container mx-auto px-4 py-8">
        {/* 媒体聚焦 + 工会要闻 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* 媒体聚焦 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 border-b-2 border-red-600 pb-2">
              <h3 className="text-lg font-bold text-gray-800">新闻动态</h3>
              <Link href="/news" className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1">
                更多 <ChevronRight size={16} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {mediaNews.map((item) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <Link href={`/view/${new Date(item.published_at).toISOString().slice(0,10).replace(/-/g,'')}/${item.id.replace(/-/g,'').substring(0,5)}`} className="text-gray-700 hover:text-red-600 truncate flex-1 mr-4">
                      {item.title}
                    </Link>
                    <span className="text-gray-400 text-sm">{formatDate(item.published_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 工会要闻 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 border-b-2 border-red-600 pb-2">
              <h3 className="text-lg font-bold text-gray-800">区总动态</h3>
              <Link href="/news" className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1">
                更多 <ChevronRight size={16} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {unionNews.map((item) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <Link href={`/view/${new Date(item.published_at).toISOString().slice(0,10).replace(/-/g,'')}/${item.id.replace(/-/g,'').substring(0,5)}`} className="text-gray-700 hover:text-red-600 truncate flex-1 mr-4 flex items-center gap-2">
                      <span className="text-red-500 text-xs">[新]</span>
                      {item.title}
                    </Link>
                    <span className="text-gray-400 text-sm">{formatDate(item.published_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 服务入口 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {(services.length > 0 ? services.map(s => ({
              icon: defaultServices.find(d => d.title.includes(s.title.slice(0, 2)))?.icon || Shield,
              title: s.title,
              desc: s.description.slice(0, 8)
            })) : defaultServices).map((service, index) => (
              <Link
                key={index}
                href="/services"
                className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-red-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <service.icon className="text-red-600" size={24} />
                </div>
                <span className="text-sm font-medium text-gray-700">{service.title}</span>
                <span className="text-xs text-gray-500">{service.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 公告公示 + 政策文件 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* 公告公示 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="bg-red-600 text-white px-4 py-2 rounded-t-lg">
              <h3 className="font-bold">通知公告</h3>
            </div>
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <ul className="p-4 space-y-3">
                {notices.length > 0 ? notices.map((item) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <Link href={`/view/${new Date(item.published_at).toISOString().slice(0,10).replace(/-/g,'')}/${item.id.replace(/-/g,'').substring(0,5)}`} className="text-gray-700 hover:text-red-600 truncate flex-1 mr-4 flex items-center gap-2">
                      <FileText size={14} className="text-red-500" />
                      {item.title}
                    </Link>
                    <span className="text-gray-400 text-sm">{formatDate(item.published_at)}</span>
                  </li>
                )) : (
                  <li className="text-gray-500 text-center py-4">暂无公告</li>
                )}
              </ul>
            )}
          </div>

          {/* 政策文件 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="bg-red-600 text-white px-4 py-2 rounded-t-lg">
              <h3 className="font-bold">政策文件</h3>
            </div>
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <ul className="p-4 space-y-3">
                {policies.length > 0 ? policies.map((item) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <Link href={`/policies`} className="text-gray-700 hover:text-red-600 truncate flex-1 mr-4 flex items-center gap-2">
                      <FileText size={14} className="text-red-500" />
                      {item.title}
                    </Link>
                    <span className="text-gray-400 text-sm">{item.publishDate}</span>
                  </li>
                )) : (
                  <li className="text-gray-500 text-center py-4">暂无政策文件</li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* 劳模工匠 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4 border-b-2 border-red-600 pb-2">
            <h3 className="text-lg font-bold text-gray-800">劳模工匠 创新工作室</h3>
            <Link href="/workers" className="text-sm text-gray-500 hover:text-red-600">
              更多 &gt;
            </Link>
          </div>
          {loading ? (
            <div className="grid md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workers.length > 0 ? workers.map((worker) => (
                <div key={worker.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {worker.imageUrl ? (
                      <Image src={worker.imageUrl} alt={worker.name} width={64} height={64} className="object-cover" />
                    ) : (
                      <Users className="text-gray-400" size={28} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{worker.name}</h4>
                    <p className="text-sm text-red-600">{worker.title}</p>
                    <p className="text-xs text-gray-500">{worker.department}</p>
                  </div>
                </div>
              )) : (
                <div className="col-span-4 text-center py-8 text-gray-500">
                  暂无劳模工匠数据，请在后台添加
                </div>
              )}
            </div>
          )}
        </div>

        {/* 友情链接 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="font-bold text-gray-800 mb-4">友情链接</h3>
          <div className="flex flex-wrap gap-4">
            {['全国总工会', '陕西省总工会', '西安市总工会', '高新区管委会', '省人力资源和社会保障厅'].map((link) => (
              <Link key={link} href="#" className="text-gray-600 hover:text-red-600">
                {link}
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-red-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <h4 className="font-bold mb-3">联系我们</h4>
              <p className="text-sm text-red-100">地址：西安高新区锦业路1号都市之门</p>
              <p className="text-sm text-red-100">邮编：710075</p>
              <p className="text-sm text-red-100">电话：029-12351</p>
            </div>
            <div>
              <h4 className="font-bold mb-3">相关链接</h4>
              <div className="space-y-2">
                <Link href="/about" className="block text-sm text-red-100 hover:text-white">工会概况</Link>
                <Link href="/news" className="block text-sm text-red-100 hover:text-white">新闻动态</Link>
                <Link href="/services" className="block text-sm text-red-100 hover:text-white">办事服务</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-3">关注我们</h4>
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center text-gray-600 text-xs">
                  微信
                </div>
                <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center text-gray-600 text-xs">
                  微博
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-red-700 pt-4 text-center text-sm text-red-200">
            <p>版权所有：西安高新区总工会</p>
            <p className="mt-1">技术支持：高新区工会网络中心</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
