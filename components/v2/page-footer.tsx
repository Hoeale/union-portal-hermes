'use client';

import { useEffect, useState } from 'react';

interface FriendlyLink {
  id: string;
  title: string;
  url: string;
}

interface SiteInfo {
  address?: string;
  phone?: string;
}

export default function PageFooter() {
  const [links, setLinks] = useState<FriendlyLink[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [linksRes, infoRes] = await Promise.all([
          fetch('/api/links'),
          fetch('/api/layout-config')
        ]);
        if (linksRes.ok) {
          const linksData = await linksRes.json();
          setLinks(linksData);
        }
        if (infoRes.ok) {
          const infoData = await infoRes.json();
          setSiteInfo(infoData.site_info || {});
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const address = siteInfo.address || '陕西省西安市高新区锦业路都市之门A座1410室';
  const phone = siteInfo.phone || '';

  return (
    <div className="px-10 pb-6">
      {/* 友情链接 */}
      <div className="bg-[#f0f4f9] rounded-3xl px-8 py-5 mb-8 flex flex-wrap items-center justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="font-bold text-[#1e2b3c]">友情链接</span>
          {loading ? (
            <div className="text-gray-400">加载中...</div>
          ) : (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2c3e50] text-sm no-underline hover:text-[#b71c1c] mr-5"
              >
                {link.title}
              </a>
            ))
          )}
        </div>
      </div>

      {/* 底部联系信息 */}
      <div className="py-5 border-t border-[#d4dce4] flex flex-wrap justify-between text-[#3e566b]">
        <div>通讯地址：{address}</div>
        {phone && <div>联系电话：{phone}</div>}
      </div>
    </div>
  );
}
