import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import { withCsrfProtection } from '@/lib/csrf';

// 强制动态路由，确保支持所有 HTTP 方法（GET/PUT）
export const dynamic = 'force-dynamic';

// GET - Fetch site configuration
export async function GET() {
  try {
    const configKeys = ['show_video_center', 'policy_download_enabled', 'service_download_enabled', 'service_show_intro', 'service_show_criteria', 'service_show_process', 'service_show_tips', 'service_flow_steps', 'service_contact_info'];
    const configs = await prisma.siteInfo.findMany({
      where: {
        key: {
          in: configKeys,
        },
      },
    });

    // Default config values
    const defaultConfig = {
      show_video_center: 'true', // 默认显示视频中心
      policy_download_enabled: 'false', // 默认关闭政策文件下载
      service_download_enabled: 'true', // 默认开启服务文件下载（由每个服务的 enableDownload 开关控制）
      service_show_intro: 'true', // 默认显示服务介绍
      service_show_criteria: 'true', // 默认显示评选条件
      service_show_process: 'true', // 默认显示申报流程
      service_show_tips: 'true', // 默认显示温馨提示
    };

    // Merge with database values
    const config: Record<string, string> = { ...defaultConfig };
    configs.forEach((item) => {
      config[item.key] = item.content;
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching site config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site config' },
      { status: 500 }
    );
  }
}

// PUT - Update site configuration (admin only)
export async function PUT(request: NextRequest) {
  try {
    // 认证检查
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: '未授权访问，请先登录' }, { status: 401 });
    }

    // CSRF 保护
    const csrfError = await withCsrfProtection(request);
    if (csrfError) return csrfError;

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const allowedKeys = ['show_video_center', 'policy_download_enabled', 'service_download_enabled', 'service_show_intro', 'service_show_criteria', 'service_show_process', 'service_show_tips', 'service_flow_steps', 'service_contact_info'];
    if (!allowedKeys.includes(key)) {
      return NextResponse.json(
        { error: 'Invalid configuration key' },
        { status: 400 }
      );
    }

    const updated = await prisma.siteInfo.upsert({
      where: { key },
      update: { content: String(value) },
      create: { key, content: String(value) },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating site config:', error);
    return NextResponse.json(
      { error: 'Failed to update site config' },
      { status: 500 }
    );
  }
}
