import type { Metadata } from "next";
import "./globals.css";
import { prisma } from "@/lib/prisma";

// 强制动态渲染，避免 metadata 被缓存
export const dynamic = 'force-dynamic';

// 动态获取网站标题
async function getSiteTitle(): Promise<string> {
  try {
    const headerConfig = await prisma.siteInfo.findUnique({
      where: { key: 'v2_header' }
    });
    
    if (headerConfig?.content) {
      const config = JSON.parse(headerConfig.content);
      return config.title || '西安高新区总工会';
    }
  } catch (error) {
    console.error('Failed to fetch site title:', error);
  }
  
  return '西安高新区总工会';
}

// 使用 generateMetadata 动态生成 metadata
export async function generateMetadata(): Promise<Metadata> {
  const title = await getSiteTitle();
  
  return {
    title: title,
    description: "西安高新区总工会官方网站",
    icons: {
      icon: '/logo.png',
    },
    manifest: '/manifest.json',
    themeColor: '#b71c1c',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: '高新工会',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#b71c1c" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="min-h-screen bg-[hsl(var(--background))] font-sans">
        {children}
      </body>
    </html>
  );
}
