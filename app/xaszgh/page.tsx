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
  Calendar,
  Bell,
  FileText,
  Users,
  Building,
  BookOpen,
  Heart,
  Scale,
  TrendingUp,
  Briefcase,
  MapPin,
  Phone,
  Award,
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
  { name: '区总动态', href: '/news?category=动态', active: false },
  { name: '办事服务', href: '/services', active: false },
];

// 服务卡片数据
const serviceCards = [
  { id: 1, title: '经济文化', subtitle: 'ECONOMY', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700' },
  { id: 2, title: '互助保障', subtitle: 'MUTUAL', bgColor: 'bg-gradient-to-br from-purple-500 to-purple-700' },
  { id: 3, title: '在线服务', subtitle: 'ONLINE', bgColor: 'bg-gradient-to-br from-teal-500 to-teal-700' },
  { id: 4, title: '法律援助', subtitle: 'LEGAL', bgColor: 'bg-gradient-to-br from-orange-500 to-orange-700' },
  { id: 5, title: '职工培训', subtitle: 'TRAINING', bgColor: 'bg-gradient-to-br from-pink-500 to-pink-700' },
  { id: 6, title: '就业服务', subtitle: 'EMPLOYMENT', bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-700' },
];

// 快捷链接
const quickLinks = [
  { title: '网上入会', icon: Users },
  { title: '法律援助', icon: Scale },
  { title: '困难帮扶', icon: Heart },
  { title: '职工书屋', icon: BookOpen },
  { title: '劳模工匠', icon: Award },
];

export default function XaszghHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 数据状态
  const [carouselData, setCarouselData] = useState<CarouselItem[]>([]);
  const [announcements, setAnnouncements] = useState<NewsItem[]>([]);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [workDynamics, setWorkDynamics] = useState<NewsItem[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 设置当前日期
    const now = new Date();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`;
    setCurrentDate(dateStr);

    // 获取数据
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

        // 获取公告
        const noticeRes = await fetch('/api/news?category=公告&limit=4');
        if (noticeRes.ok) {
          const noticeData = await noticeRes.json();
          setAnnouncements(noticeData);
        }

        // 获取资讯要闻和区总动态（分别从不同分类获取）
        const newsRes = await fetch('/api/news?category=通知&limit=5');
        if (newsRes.ok) {
          const newsItems = await newsRes.json();
          setNewsData(newsItems);
        }
        const dynamicsRes = await fetch('/api/news?category=动态&limit=5');
        if (dynamicsRes.ok) {
          const dynamicsItems = await dynamicsRes.json();
          setWorkDynamics(dynamicsItems);
        }

        // 获取政策文件
        const policyRes = await fetch('/api/policies?limit=4');
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
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部信息栏 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs py-1">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <span>{currentDate}</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-yellow-300 cursor-pointer">设为首页</span>
            <span className="hover:text-yellow-300 cursor-pointer">加入收藏</span>
            <span className="hover:text-yellow-300 cursor-pointer">联系我们</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                高
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">西安高新区总工会</h1>
                <p className="text-xs text-gray-500">Xi&apos;an High-Tech Zone Federation of Trade Unions</p>
              </div>
            </div>

            {/* 导航 */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={`text-base font-medium transition-colors ${
                    item.active
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* 搜索框 */}
            <div className="hidden md:flex items-center gap-2">
              <form onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                }
              }} className="flex items-center bg-white/10 rounded-full py-1 px-4 border border-white/20">
                <input
                  type="text"
                  placeholder="请输入关键词"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-none bg-transparent py-2 w-32 md:w-48 text-white text-base outline-none placeholder-white/60"
                />
                <button type="submit" className="text-white px-3 py-2 hover:bg-white/10 rounded-full transition-colors">
                  <Search size={16} className="text-white" />
                </button>
              </form>
            </div>

            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* 移动端导航 */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t">
              <ul className="space-y-2">
                {navItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className={`block py-2 px-4 ${
                        item.active ? 'text-blue-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </header>

      {/* 主轮播图区域 */}
      <section className="relative h-[450px] overflow-hidden">
        {/* 左侧轮播 */}
        <div className="absolute inset-0">
          {loading ? (
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse" />
          ) : carouselData.length > 0 ? (
            carouselData.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                <div className="container mx-auto px-4 h-full flex items-center">
                  <div className="text-white max-w-xl">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                      {slide.title}
                    </h2>
                    <p className="text-xl opacity-90 mb-6">西安高新区总工会</p>
                    <div className="inline-block bg-yellow-400 text-blue-900 px-4 py-2 rounded-lg font-bold">
                      关注二维码进入详情
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
              <p>暂无轮播图</p>
            </div>
          )}
        </div>

        {/* 右侧信息栏 */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/95 backdrop-blur-sm hidden lg:block">
          <div className="p-6 h-full flex flex-col">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-blue-900">服务热线</h3>
              <p className="text-sm text-blue-700">职工咨询服务电话</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">12351</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-32 h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-400 text-xs">微信二维码</span>
              </div>
              <p className="text-xs text-gray-500 text-center">
                1.打开微信APP，找到&quot;扫一扫&quot;功能<br/>
                识别右侧二维码；<br/>
                2.进入&quot;高新区总工会&quot;微信公众号。
              </p>
            </div>
          </div>
        </div>

        {/* 轮播控制 */}
        {carouselData.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-blue-600 transition-colors shadow-lg"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute left-1/2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-blue-600 transition-colors shadow-lg lg:left-[calc(50%-160px)]"
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

      {/* 公告区域 */}
      <section className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
          <div className="flex items-center gap-2 text-blue-600 font-bold shrink-0">
            <Bell size={18} />
            <span>通知公告</span>
          </div>
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="h-5 bg-gray-100 rounded animate-pulse" />
            ) : announcements.length > 0 ? (
              <div className="space-y-1">
                {announcements.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1">
                    <Link href={`/view/${new Date(item.published_at).toISOString().slice(0,10).replace(/-/g,'')}/${item.id.replace(/-/g,'').substring(0,5)}`} className="text-gray-700 hover:text-blue-600 truncate flex-1 mr-4">
                      {item.title}
                    </Link>
                    <span className="text-gray-400 text-sm shrink-0">{formatDate(item.published_at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-500">暂无公告</span>
            )}
          </div>
        </div>
      </section>

      {/* 主要内容区域 */}
      <main className="container mx-auto px-4 pb-8">
        {/* 资讯要闻 + 工作动态 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* 左侧：资讯要闻 */}
          <div className="space-y-4">
            {/* 标签页 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="flex border-b">
                <button className="flex-1 py-3 text-center text-blue-600 font-bold border-b-2 border-blue-600 bg-blue-50">
                  资讯要闻
                </button>
                <button className="flex-1 py-3 text-center text-gray-600 hover:text-blue-600">
                  政策文件
                </button>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {newsData.length > 0 ? newsData.map((item) => (
                      <li key={item.id} className="flex items-center justify-between group">
                        <Link
                          href={`/view/${new Date(item.published_at).toISOString().slice(0,10).replace(/-/g,'')}/${item.id.replace(/-/g,'').substring(0,5)}`}
                          className="text-gray-700 hover:text-blue-600 truncate flex-1 mr-4 flex items-center gap-2"
                        >
                          <span className="text-blue-500">•</span>
                          {item.title}
                        </Link>
                        <span className="text-gray-400 text-sm shrink-0">{formatDate(item.published_at)}</span>
                      </li>
                    )) : (
                      <li className="text-gray-500 text-center py-4">暂无新闻</li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            {/* 宣传图 */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-white/20 rounded-lg flex items-center justify-center">
                  <Building size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">服务职工群众</h3>
                  <p className="text-sm opacity-90">西安高新区总工会服务平台</p>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：工作动态 */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex border-b">
              <button className="flex-1 py-3 text-center text-gray-600 hover:text-blue-600">
                资讯要闻
              </button>
              <button className="flex-1 py-3 text-center text-blue-600 font-bold border-b-2 border-blue-600 bg-blue-50">
                区总动态
              </button>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <ul className="space-y-3">
                  {workDynamics.length > 0 ? workDynamics.map((item) => (
                    <li key={item.id} className="flex items-center justify-between group">
                      <Link
                        href={`/view/${new Date(item.published_at).toISOString().slice(0,10).replace(/-/g,'')}/${item.id.replace(/-/g,'').substring(0,5)}`}
                        className="text-gray-700 hover:text-blue-600 truncate flex-1 mr-4 flex items-center gap-2"
                      >
                        <span className="text-blue-500">•</span>
                        {item.title}
                      </Link>
                      <ChevronRight size={16} className="text-gray-400 shrink-0" />
                    </li>
                  )) : (
                    <li className="text-gray-500 text-center py-4">暂无动态</li>
                  )}
                </ul>
              )}
            </div>

            {/* 快捷入口 */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="grid grid-cols-5 gap-2">
                {quickLinks.map((link, index) => (
                  <Link
                    key={index}
                    href="/services"
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white transition-colors"
                  >
                    <link.icon className="text-blue-600" size={20} />
                    <span className="text-xs text-gray-600">{link.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 服务卡片区域 */}
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {serviceCards.map((card) => (
              <Link
                key={card.id}
                href="/services"
                className={`${card.bgColor} rounded-lg p-6 text-white text-center hover:shadow-lg transition-shadow group`}
              >
                <div className="h-24 flex flex-col items-center justify-center">
                  <h4 className="text-lg font-bold mb-1">{card.title}</h4>
                  <p className="text-xs opacity-80">{card.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 劳模工匠展示 */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
            <h3 className="text-lg font-bold text-gray-800">劳模工匠 风采展示</h3>
            <Link href="/workers" className="text-sm text-gray-500 hover:text-blue-600">
              更多 &gt;
            </Link>
          </div>
          {loading ? (
            <div className="grid md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workers.length > 0 ? workers.map((worker) => (
                <div key={worker.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {worker.imageUrl ? (
                      <Image src={worker.imageUrl} alt={worker.name} width={64} height={64} className="object-cover" />
                    ) : (
                      <Users className="text-gray-400" size={28} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{worker.name}</h4>
                    <p className="text-sm text-blue-600">{worker.title}</p>
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
        </section>

        {/* 统计数据 */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm opacity-90">基层工会组织</p>
            </div>
            <div>
              <p className="text-3xl font-bold">10万+</p>
              <p className="text-sm opacity-90">工会会员</p>
            </div>
            <div>
              <p className="text-3xl font-bold">50+</p>
              <p className="text-sm opacity-90">劳模工匠</p>
            </div>
            <div>
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm opacity-90">职工服务覆盖</p>
            </div>
          </div>
        </section>

        {/* 友情链接 */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">友情链接</h3>
          <div className="flex flex-wrap gap-4">
            {['全国总工会', '陕西省总工会', '西安市总工会', '高新区管委会', '市人社局', '市民政局'].map((link) => (
              <Link key={link} href="#" className="text-gray-600 hover:text-blue-600">
                {link}
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <h4 className="font-bold mb-3">联系我们</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p className="flex items-center gap-2">
                  <MapPin size={14} />
                  地址：西安高新区锦业路1号都市之门
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={14} />
                  电话：029-12351
                </p>
                <p className="flex items-center gap-2">
                  <FileText size={14} />
                  邮编：710075
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-3">快速导航</h4>
              <div className="space-y-2">
                {['工会概况', '新闻动态', '办事服务', '劳模工匠'].map((item) => (
                  <Link key={item} href="#" className="block text-sm text-gray-300 hover:text-white">
                    {item}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-3">关注我们</h4>
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-gray-600 text-xs">
                  微信
                </div>
                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-gray-600 text-xs">
                  微博
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-4 text-center text-sm text-gray-400">
            <p>版权所有：西安高新区总工会</p>
            <p className="mt-1">技术支持：高新区工会网络中心</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
