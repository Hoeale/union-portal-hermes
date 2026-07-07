import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch union profile content
export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const introContent = await prisma.siteInfo.findUnique({
      where: { key: 'union_introduction' },
    });

    return NextResponse.json(
      introContent?.content || '',
    );
  } catch (error) {
    console.error('Error fetching union profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch union profile' },
      { status: 500 }
    );
  }
}

// PUT - Update union profile content
export async function PUT(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.siteInfo.upsert({
      where: { key: 'union_introduction' },
      update: { content },
      create: { key: 'union_introduction', content },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating union profile:', error);
    return NextResponse.json(
      { error: 'Failed to update union profile' },
      { status: 500 }
    );
  }
}
