'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 定义所有配置类型
export interface V2HeaderConfig {
  title: string;
  subtitle: string;
  logo: string;
  background_image: string;
}

export interface NavItem {
  id: string;
  name: string;
  href: string;
  visible: boolean;
  order: number;
}

export interface V2ServicePanelConfig {
  title: string;
  qrcode_text: string;
  qrcode_image_1: string;
  qrcode_label_1: string;
  qrcode_image_2: string;
  qrcode_label_2: string;
}

export interface V2ServiceGridConfig {
  title: string;
  items: Array<{ icon: string; label: string; href: string }>;
  buttons: Array<{ text: string; href: string; icon: string }>;
}

export interface FooterConfig {
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

export interface FriendlyLink {
  id: string;
  title: string;
  url: string;
  is_required: boolean;
  order_index: number;
}

// 完整的 LayoutConfig 类型
export interface LayoutConfig {
  v2_header: V2HeaderConfig;
  nav_items: NavItem[];
  v2_service_panel: V2ServicePanelConfig;
  v2_service_grid: V2ServiceGridConfig;
  footer_config: FooterConfig;
  friendly_links: FriendlyLink[];
}

// Context 类型
interface LayoutConfigContextType {
  config: LayoutConfig | null;
  loading: boolean;
  error: Error | null;
}

// 创建 Context
const LayoutConfigContext = createContext<LayoutConfigContextType>({
  config: null,
  loading: true,
  error: null,
});

// Provider 组件
export function LayoutConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<LayoutConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/layout-config');
        if (!res.ok) {
          throw new Error('Failed to fetch layout config');
        }
        const data = await res.json();
        
        if (mounted) {
          setConfig(data);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setLoading(false);
        }
      }
    };

    fetchConfig();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <LayoutConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </LayoutConfigContext.Provider>
  );
}

// Hook 用于消费 Context
export function useLayoutConfig() {
  return useContext(LayoutConfigContext);
}

export default LayoutConfigContext;
