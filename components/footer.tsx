'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Mail } from 'lucide-react';
import { useLayoutConfig } from '@/components/v2/layout-config-context';

interface FriendlyLink {
  id: string;
  title: string;
  url: string;
  is_required: boolean;
  order_index: number;
}

interface FooterConfig {
  organization_name: string;
  organization_name_en: string;
  organization_description: string;
  logo_url: string;
  contact_email: string;
  contact_email_label: string;
  copyright_text: string;
  copyright_year: string;
  show_year: boolean;
  copyright_reserved: string;
  show_footer: boolean;
  show_friendly_links: boolean;
  privacy_policy_url: string;
  terms_url: string;
  sitemap_url: string;
  show_privacy_policy: boolean;
  show_terms: boolean;
  show_sitemap: boolean;
  show_contact_email: boolean;
  icp_text: string;
  icp_url: string;
}

interface SiteInfo {
  address?: string;
  phone?: string;
}

interface FooterProps {
  compact?: boolean;
}

const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  organization_name: '西安高新区总工会',
  organization_name_en: "Xi'an High-Tech Zones Federation of Trade Unions",
  organization_description: '维护职工合法权益，竭诚服务职工群众，促进劳动关系和谐稳定，推动高新区高质量发展。',
  logo_url: '/logo.png',
  contact_email: 'contact@example.com',
  contact_email_label: '联系我们',
  copyright_text: '西安高新区总工会',
  copyright_year: '2026',
  show_year: true,
  copyright_reserved: '版权所有',
  show_footer: true,
  show_friendly_links: true,
  privacy_policy_url: '#',
  terms_url: '#',
  sitemap_url: '#',
  show_privacy_policy: false,
  show_terms: false,
  show_sitemap: false,
  show_contact_email: false, // 默认隐藏
  icp_text: '',
  icp_url: '',
};

export default function Footer({ compact = false }: FooterProps) {
  const { config } = useLayoutConfig();
  const [links, setLinks] = useState<FriendlyLink[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({});
  const [loading, setLoading] = useState(true);

  const footerConfig = config?.footer_config || DEFAULT_FOOTER_CONFIG;

  useEffect(() => {
    // 获取友情链接和站点信息
    Promise.all([
      fetch('/api/links').then(res => res.json()),
      fetch('/api/admin/site-info').then(res => res.json())
    ]).then(([linksData, siteInfoData]) => {
      setLinks(linksData);
      setSiteInfo(siteInfoData.site_info || {});
      setLoading(false);
    }).catch((error) => {
      console.error('Error fetching data:', error);
      setLoading(false);
    });
  }, []);

  if (!footerConfig.show_footer) {
    return null;
  }

  // 构建版权文字
  const copyrightYear = footerConfig.show_year ? (footerConfig.copyright_year || '') : '';
  const copyrightText = `${copyrightYear} ${footerConfig.copyright_text} ${footerConfig.copyright_reserved}`.trim();

  // 紧凑模式（首页使用）：单行版权 + 友情链接单行展示
  if (compact) {
    return (
      <footer className="bg-[hsl(var(--card))] border-t border-[hsl(var(--card-border))]">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          {footerConfig.show_friendly_links && links.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm">
              <span className="font-semibold text-[hsl(var(--foreground-muted))] shrink-0">友情链接：</span>
              {loading ? (
                <span className="text-[hsl(var(--foreground-muted))]">加载中...</span>
              ) : (
                links.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--primary))] transition-colors">
                    {link.title}
                  </a>
                ))
              )}
            </div>
          )}
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-[hsl(var(--foreground-muted))]">
            <div className="flex items-center gap-3">
              <span>&copy; {copyrightText}</span>
              {footerConfig.icp_text && (
                <>
                  <span>|</span>
                  {footerConfig.icp_url ? (
                    <a href={footerConfig.icp_url} target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--primary))] transition-colors">
                      {footerConfig.icp_text}
                    </a>
                  ) : (
                    <span>{footerConfig.icp_text}</span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              {footerConfig.show_privacy_policy && (
                <a href={footerConfig.privacy_policy_url} className="hover:text-[hsl(var(--primary))] transition-colors">隐私政策</a>
              )}
              {footerConfig.show_terms && (
                <a href={footerConfig.terms_url} className="hover:text-[hsl(var(--primary))] transition-colors">使用条款</a>
              )}
              {footerConfig.show_sitemap && (
                <a href={footerConfig.sitemap_url} className="hover:text-[hsl(var(--primary))] transition-colors">网站地图</a>
              )}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // 完整模式（子页面使用）：多列布局，机构信息 + 友情链接 + 版权
  return (
    <footer className="relative overflow-hidden">
      {/* 装饰性背景 */}
      <div className="absolute inset-0 gradient-primary opacity-5" />
      <div className="absolute inset-0 bg-texture opacity-30" />

      <div className="relative border-t border-[hsl(var(--card-border))]">
        <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* 机构信息 */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white">
                  <Image
                    src={footerConfig.logo_url}
                    alt={footerConfig.organization_name}
                    width={56}
                    height={56}
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[hsl(var(--foreground))]">{footerConfig.organization_name}</h3>
                  <p className="text-sm text-[hsl(var(--foreground-muted))]">
                    {footerConfig.organization_name_en}
                  </p>
                </div>
              </div>

              <p className="text-[hsl(var(--foreground-muted))] leading-relaxed mb-6 max-w-md">
                {footerConfig.organization_description}
              </p>

              {footerConfig.show_contact_email === true && (
                <div className="flex flex-wrap gap-4">
                  <a
                    href={`mailto:${footerConfig.contact_email}`}
                    className="flex items-center gap-2 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{footerConfig.contact_email_label}</span>
                  </a>
                </div>
              )}
            </div>

            {/* 友情链接 */}
            {footerConfig.show_friendly_links && (
              <div className="lg:col-span-2">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-[hsl(var(--primary))] rounded-full" />
                  友情链接
                </h4>
                <div className="flex flex-wrap gap-3">
                  {loading ? (
                    <div className="text-[hsl(var(--foreground-muted))] py-2">加载中...</div>
                  ) : (
                    links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-[hsl(var(--background))] rounded-lg text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--primary))] hover:bg-white hover:shadow-md transition-all duration-300 text-sm font-medium"
                      >
                        {link.title}
                        {link.is_required && (
                          <span className="w-1.5 h-1.5 bg-[hsl(var(--accent))] rounded-full ml-2" />
                        )}
                      </a>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 底部信息栏 */}
          <div className="mt-12 pt-8 border-t border-[hsl(var(--card-border))]">
            {/* 站点信息 */}
            {!loading && (siteInfo.address || siteInfo.phone) && (
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-4 text-sm text-[hsl(var(--foreground-muted))]">
                {siteInfo.address && (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>地址：{siteInfo.address}</span>
                  </div>
                )}
                {siteInfo.phone && (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>电话：{siteInfo.phone}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-col items-center justify-center gap-4 text-sm text-[hsl(var(--foreground-muted))]">
              <div className="flex items-center gap-2">
                <span>&copy; {copyrightText}</span>
                {footerConfig.icp_text && (
                  <>
                    <span>|</span>
                    {footerConfig.icp_url ? (
                      <a href={footerConfig.icp_url} target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--primary))] transition-colors">
                        {footerConfig.icp_text}
                      </a>
                    ) : (
                      <span>{footerConfig.icp_text}</span>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-6">
                {footerConfig.show_privacy_policy && (
                  <a href={footerConfig.privacy_policy_url} className="hover:text-[hsl(var(--primary))] transition-colors">
                    隐私政策
                  </a>
                )}
                {footerConfig.show_terms && (
                  <a href={footerConfig.terms_url} className="hover:text-[hsl(var(--primary))] transition-colors">
                    使用条款
                  </a>
                )}
                {footerConfig.show_sitemap && (
                  <a href={footerConfig.sitemap_url} className="hover:text-[hsl(var(--primary))] transition-colors">
                    网站地图
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
