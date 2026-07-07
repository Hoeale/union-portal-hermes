import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logOperation } from '@/lib/operation-logger';
import { deleteCache, CACHE_KEYS } from '@/lib/cache';

// GET - Fetch all services
export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const services = await prisma.service.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// POST - Create new service
export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, description, process, requirements, fileUrl, fileUrls, fileNames, fileName, enableDownload, 
      isActive = true, orderIndex = 0,
      serviceIntro = '', showServiceIntro = true,
      selectionCriteria = '', showSelectionCriteria = true,
      applicationProcess = '', showApplicationProcess = true,
      tips = '[]', showTips = true,
      introText = '', introTitle = '服务介绍', showIntro = true,
      features = '[]', showFeatures = true,
      steps = '[]', stepsTitle = '使用流程', showSteps = true,
      tipsTitle = '温馨提示'
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        title,
        description,
        process: process || '',
        requirements: requirements || '',
        fileUrl: fileUrl || null,
        fileUrls: fileUrls || null,
        fileNames: fileNames || null,
        fileName: fileName || null,
        enableDownload: enableDownload || false,
        isActive,
        orderIndex,
        serviceIntro,
        showServiceIntro,
        selectionCriteria,
        showSelectionCriteria,
        applicationProcess,
        showApplicationProcess,
        tips,
        showTips,
        introText,
        introTitle,
        showIntro,
        features,
        showFeatures,
        steps,
        stepsTitle,
        showSteps,
        tipsTitle,
      },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'services',
      action: 'create',
      targetId: service.id,
      targetType: 'service',
      targetTitle: title,
    });

    // 清除前端缓存
    await deleteCache(CACHE_KEYS.SERVICE_LIST);
    await deleteCache(`${CACHE_KEYS.SERVICE_LIST}`);

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}

// PUT - Update service
export async function PUT(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      id, title, description, process, requirements, fileUrl, fileUrls, fileNames, fileName, enableDownload, 
      isActive, orderIndex,
      serviceIntro, showServiceIntro,
      selectionCriteria, showSelectionCriteria,
      applicationProcess, showApplicationProcess,
      tips, showTips,
      introText, introTitle, showIntro,
      features, showFeatures,
      steps, stepsTitle, showSteps,
      tipsTitle
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Validate JSON fields if provided
    if (features !== undefined || steps !== undefined || tips !== undefined) {
      try {
        if (features !== undefined) JSON.parse(features);
        if (steps !== undefined) JSON.parse(steps);
        if (tips !== undefined) JSON.parse(tips);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid JSON format for features, steps, or tips' },
          { status: 400 }
        );
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(process !== undefined && { process }),
        ...(requirements !== undefined && { requirements }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(fileUrls !== undefined && { fileUrls }),
        ...(fileNames !== undefined && { fileNames }),
        ...(fileName !== undefined && { fileName }),
        ...(enableDownload !== undefined && { enableDownload }),
        ...(isActive !== undefined && { isActive }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(serviceIntro !== undefined && { serviceIntro }),
        ...(showServiceIntro !== undefined && { showServiceIntro }),
        ...(selectionCriteria !== undefined && { selectionCriteria }),
        ...(showSelectionCriteria !== undefined && { showSelectionCriteria }),
        ...(applicationProcess !== undefined && { applicationProcess }),
        ...(showApplicationProcess !== undefined && { showApplicationProcess }),
        ...(tips !== undefined && { tips }),
        ...(showTips !== undefined && { showTips }),
        ...(introText !== undefined && { introText }),
        ...(introTitle !== undefined && { introTitle }),
        ...(showIntro !== undefined && { showIntro }),
        ...(features !== undefined && { features }),
        ...(showFeatures !== undefined && { showFeatures }),
        ...(steps !== undefined && { steps }),
        ...(stepsTitle !== undefined && { stepsTitle }),
        ...(showSteps !== undefined && { showSteps }),
        ...(tipsTitle !== undefined && { tipsTitle }),
      },
    });

    // 记录操作日志
    await logOperation({
      request,
      module: 'services',
      action: 'update',
      targetId: id,
      targetType: 'service',
      targetTitle: title || service.title,
    });

    // 清除前端缓存
    await deleteCache(CACHE_KEYS.SERVICE_LIST);
    await deleteCache(`${CACHE_KEYS.SERVICE_LIST}`);

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

// DELETE - Delete service
export async function DELETE(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

    const oldService = await prisma.service.findUnique({
      where: { id },
    });

    await prisma.service.delete({
      where: { id },
    });

    // 记录操作日志
    if (oldService) {
      await logOperation({
        request,
        module: 'services',
        action: 'delete',
        targetId: id,
        targetType: 'service',
        targetTitle: oldService.title,
      });
    }

    // 清除前端缓存
    await deleteCache(CACHE_KEYS.SERVICE_LIST);
    await deleteCache(`${CACHE_KEYS.SERVICE_LIST}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
