import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {
      database: 'unknown',
    },
  };

  let status = 200;

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    healthcheck.checks.database = 'connected';
  } catch (error) {
    healthcheck.checks.database = 'disconnected';
    healthcheck.status = 'error';
    status = 503;
  }

  return NextResponse.json(healthcheck, { status });
}
