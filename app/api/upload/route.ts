import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sanitizeFileName } from '@/lib/file-security';

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'workers');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename (avoid Chinese characters and spaces for server compatibility)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = file.name.substring(file.name.lastIndexOf('.'));
    const filename = `${timestamp}-${randomString}${ext}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the URL path
    const urlPath = `/uploads/workers/${filename}`;

    // 注册到媒体库
    try {
      await prisma.media.create({
        data: {
          type: 'image',
          title: file.name,
          url: urlPath,
          fileSize: file.size,
          mimeType: file.type,
          category: '劳动者图片',
        },
      });
    } catch (dbError) {
      console.error('Failed to register media:', dbError);
      // 不影响上传成功，只是媒体库不显示
    }

    return NextResponse.json({ success: true, url: urlPath });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
