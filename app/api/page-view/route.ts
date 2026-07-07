import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 页面访问记录 API - 简化版
 * 只记录IP、设备类型、浏览器、操作系统、访问时间
 * 不记录具体访问页面，减少数据量
 */
export async function POST(request: NextRequest) {
  try {
    // 检测访问设备类型
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';

    // 获取 IP 地址
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // 创建简化的访问记录（不记录具体页面URL）
    await prisma.pageView.create({
      data: {
        url: '/', // 统一记录为根路径，不记录具体页面
        deviceType,
        ip,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording page view:', error);
    return NextResponse.json(
      { error: '记录访问失败' },
      { status: 500 }
    );
  }
}
