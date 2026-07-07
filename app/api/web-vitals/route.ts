import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// POST - 接收 Web Vitals 性能指标
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 支持单个或批量指标
    const metrics = Array.isArray(body) ? body : [body];

    // 验证数据
    const validMetrics = metrics.filter((m: any) => {
      return (
        m.name &&
        typeof m.value === 'number' &&
        m.value >= 0 &&
        m.rating &&
        ['good', 'needs-improvement', 'poor'].includes(m.rating)
      );
    });

    if (validMetrics.length === 0) {
      return NextResponse.json(
        { error: 'Invalid metrics data' },
        { status: 400 }
      );
    }

    // 记录到日志（可以后续接入数据库或外部分析服务）
    logger.info('[Web Vitals]', {
      count: validMetrics.length,
      metrics: validMetrics.map((m: any) => ({
        name: m.name,
        value: m.value,
        rating: m.rating,
        url: m.url,
      })),
    });

    // TODO: 可以保存到数据库或发送到外部分析服务
    // 例如: Sentry, Google Analytics, 或自定义数据库

    return NextResponse.json({ 
      success: true, 
      received: validMetrics.length 
    });
  } catch (error) {
    console.error('Error processing web vitals:', error);
    return NextResponse.json(
      { error: 'Failed to process web vitals' },
      { status: 500 }
    );
  }
}

// OPTIONS - 支持 CORS（如果需要）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
