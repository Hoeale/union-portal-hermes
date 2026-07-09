'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import HeaderBanner from '@/components/header-banner';
import { useLayoutConfig } from '@/components/v2/layout-config-context';

export default function Navigation() {
  const pathname = usePathname();
  const { config } = useLayoutConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navItems, setNavItems] = useState<Array<{ name: string; href: string }>>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 判断当前路径是否属于某个导航项（支持子路径匹配）
  const isNavActive = (href: string, name: string, currentPath: string) => {
    if (currentPath === href) return true;
    if (href === '/') return false;
    // 子路径匹配：/news/123 匹配 /news
    if (currentPath.startsWith(href + '/')) return true;
    // 特殊处理：/view/[date]/[id] 属于新闻中心
    if (name === '新闻中心' && currentPath.startsWith('/view/')) return true;
    return false;
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch layout configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/layout-config');
        if (response.ok) {
          const config = await response.json();
          // Filter visible nav items and sort by order
          const visibleItems = config.nav_items
            .filter((item: any) => item.visible)
            .sort((a: any, b: any) => a.order - b.order)
            .map((item: any) => ({ name: item.name, href: item.href }));
          setNavItems(visibleItems);
        }
      } catch (error) {
        console.error('Failed to fetch layout config:', error);
        // Fallback to default
        setNavItems([
          { name: '首页', href: '/' },
          { name: '工会概况', href: '/about' },
          { name: '新闻中心', href: '/news' },
          { name: '视频中心', href: '/videos' },
          { name: '办事服务', href: '/services' },
          { name: '政策文件', href: '/policies' },
          { name: '最美劳动者', href: '/workers' },
        ]);
      }
    };
    fetchConfig();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      {/* Header Banner with Background Image */}
      <HeaderBanner />

      {/* Navigation Bar */}
      <nav
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg shadow-gray-200/50'
            : 'bg-white/80 backdrop-blur-sm shadow-md'
        )}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Title */}
            <Link href="/" className="flex items-center space-x-4 group">
                            <div className="relative">
                              <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 overflow-hidden bg-white">
                                <Image
                                  src="/logo.png"
                                  alt="西安高新区总工会"
                                  width={56}
                                  height={56}
                                  className="object-contain p-1"
                                />
                              </div>
                            </div>
                            <div className="hidden sm:block">
                              <h1 className="text-xl lg:text-2xl font-bold text-[hsl(var(--foreground))]">
                                西安高新区总工会
                              </h1>
                            </div>
                          </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center">
              {navItems.map((item) => {
                const isActive = isNavActive(item.href, item.name, pathname);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "relative px-5 py-2 font-medium transition-colors duration-300 group",
                      isActive
                        ? "text-[hsl(var(--primary))]"
                        : "text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]"
                    )}
                  >
                    {item.name}
                    <span className={cn(
                      "absolute bottom-0 left-0 h-0.5 bg-[hsl(var(--primary))] transition-all duration-300",
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    )} />
                  </Link>
                );
              })}
            </div>

            {/* Right Side: Search */}
            <div className="hidden md:flex items-center">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center bg-[#b71c1c] rounded-full py-1 px-4 border border-white/20">
                  <input
                    type="text"
                    placeholder="请输入关键词"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="border-none bg-transparent py-2 w-32 md:w-48 text-white text-base outline-none placeholder-white/60"
                  />
                  <button
                    type="submit"
                    className="text-white px-3 py-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="text-white px-2 py-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2.5 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--background))] rounded-lg transition-all duration-300"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--background))] rounded-lg transition-all duration-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-[hsl(var(--card-border))] bg-white/95 backdrop-blur-md animate-slide-up">
              <div className="container mx-auto px-4 py-6 space-y-2">
                {navItems.map((item, index) => {
                  const isActive = isNavActive(item.href, item.name, pathname);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 font-medium rounded-lg transition-all duration-300 group",
                        isActive
                          ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                          : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--background))] hover:text-[hsl(var(--primary))]"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {item.name}
                      <ChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -rotate-90" />
                    </Link>
                  );
                })}
                <div className="flex items-center pt-4 border-t border-[hsl(var(--card-border))]">
                  {searchOpen ? (
                    <form onSubmit={handleSearch} className="flex items-center w-full bg-[#b71c1c] rounded-full py-1 px-4">
                      <input
                        type="text"
                        placeholder="请输入关键词"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="flex-1 border-none bg-transparent py-2 text-white text-base outline-none placeholder-white/60"
                      />
                      <button type="submit" className="text-white px-3 py-2">
                        <Search className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="text-white px-2 py-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setSearchOpen(true)}
                      className="flex items-center gap-2 px-4 py-3 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--background))] rounded-lg transition-all duration-300 font-medium"
                    >
                      <Search className="w-5 h-5" />
                      搜索
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
