import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdminPermissions } from '@/lib/permission';

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdminPermissions(request);

  if (!admin) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions,
    },
  });
}
