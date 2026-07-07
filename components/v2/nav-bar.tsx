'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Search } from 'lucide-react';
import { useLayoutConfig } from '@/components/v2/layout-config-context';

interface NavItem {
  id: string;
  name: string;
  href: string;
  visible: boolean;
  order: number;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'home', name: '首页', href: '/', visible: true, order: 0 },
  { id: 'about', name: '工会概况', href: '/about', visible: true, order: 1 },
  { id: 'news', name: '新闻中心', href: '/news', visible: true, order: 2 },
  { id: 'services', name: '办事服务', href: '/services', visible: true, order: 3 },
  { id: 'policies', name: '政策文件', href: '/policies', visible: true, order: 4 },
  { id: 'workers', name: '最美劳动者', href: '/workers', visible: true, order: 5 },
];

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { config } = useLayoutConfig();

  const navItems = config?.nav_items
    ? config.nav_items.filter((item: NavItem) => item.visible).sort((a: NavItem, b: NavItem) => a.order - b.order)
    : DEFAULT_NAV_ITEMS;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search/?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="bg-[#b71c1c] px-4 md:px-10 flex items-center flex-wrap shadow-md">
      {/* 桌面导航 - 在 md (768px) 以上显示 */}
      <ul className="hidden md:flex flex-wrap list-none m-0 p-0">
        {navItems.map((item) => (
          <li key={`desktop-${item.id}`}>
            <Link
              href={item.href}
              className={`inline-block px-4 md:px-6 py-4 text-white font-semibold text-base no-underline border-b-4 border-transparent transition-all ${
                pathname === item.href ? 'bg-white/10 border-[#ffd966]' : 'hover:bg-white/10'
              }`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      {/* 搜索栏 - 在 md (768px) 以上显示 */}
      <form onSubmit={handleSearch} className="ml-auto hidden md:flex items-center bg-white/10 rounded-full py-1 px-4 border border-white/20 mr-4">
        <input
          type="text"
          placeholder="请输入关键词"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-none bg-transparent py-2 w-32 md:w-48 text-white text-base outline-none placeholder-white/60"
        />
        <button
          type="submit"
          className="text-white px-3 py-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>

      {/* 右侧移动端菜单按钮 - 在 md (768px) 以下显示 */}
      <div className="ml-auto flex items-center md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white text-2xl p-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="w-full md:hidden bg-[#b71c1c] border-t border-white/20">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-6 py-3 text-white font-semibold border-b border-white/10 ${
                pathname === item.href ? 'bg-white/10' : ''
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
