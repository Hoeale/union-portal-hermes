import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import * as XLSX from 'xlsx';
import { logger } from '@/lib/logger';

// 检查认证
async function checkAuth(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: '未授权访问，请先登录' },
      { status: 401 }
    );
  }
  return null;
}

// GET - 导出新闻为Excel
export async function GET(request: NextRequest) {
  const authError = await checkAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 构建查询条件
    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: endDateTime };
    }

    // 获取数据
    const news = await prisma.news.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // 转换为Excel数据
    const excelData = news.map((item) => ({
      title: item.title,
      category: item.category,
      content: item.content.replace(/<[^>]*>/g, ''), // 去除HTML标签
      status: item.status === 'published' ? 'published' : 'pending',
      publishedAt: item.publishedAt.toISOString().split('T')[0],
      createdAt: item.createdAt.toISOString().split('T')[0],
    }));

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 40 }, // title
      { wch: 10 }, // category
      { wch: 60 }, // content
      { wch: 12 }, // status
      { wch: 12 }, // publishedAt
      { wch: 12 }, // createdAt
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '新闻数据');

    // 生成Excel文件
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 生成文件名
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `新闻导出_${timestamp}.xlsx`;

    // 返回文件流
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    logger.error('News export error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}
