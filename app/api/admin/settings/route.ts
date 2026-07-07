import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import { logOperation } from '@/lib/operation-logger';
import { logger } from '@/lib/logger';

// 获取系统设置
export async function GET(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where = category ? { category } : {};
    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    // 转换为键值对格式
    const settingsMap: Record<string, any> = {};
    settings.forEach((setting) => {
      try {
        settingsMap[setting.key] = JSON.parse(setting.value);
      } catch {
        settingsMap[setting.key] = setting.value;
      }
    });

    return NextResponse.json({
      success: true,
      data: settingsMap,
    });
  } catch (error) {
    logger.error('Error fetching system settings:', error);
    return NextResponse.json({ error: '获取系统设置失败' }, { status: 500 });
  }
}

// 更新系统设置
export async function POST(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value, description, category } = body;

    if (!key) {
      return NextResponse.json({ error: '配置键不能为空' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: typeof value === 'string' ? value : JSON.stringify(value),
        description,
        category,
      },
      create: {
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        description,
        category: category || 'general',
      },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'settings',
      action: 'update',
      targetId: setting.id,
      targetType: 'setting',
      targetTitle: key,
    });

    return NextResponse.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    logger.error('Error updating system setting:', error);
    return NextResponse.json({ error: '更新系统设置失败' }, { status: 500 });
  }
}

// 删除系统设置
export async function DELETE(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: '配置键不能为空' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return NextResponse.json({ error: '配置项不存在' }, { status: 404 });
    }

    await prisma.systemSetting.delete({
      where: { key },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'settings',
      action: 'delete',
      targetId: setting.id,
      targetType: 'setting',
      targetTitle: key,
    });

    return NextResponse.json({
      success: true,
      message: '配置项已删除',
    });
  } catch (error) {
    logger.error('Error deleting system setting:', error);
    return NextResponse.json({ error: '删除系统设置失败' }, { status: 500 });
  }
}
