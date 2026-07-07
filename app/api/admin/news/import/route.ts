import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
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

// 验证新闻数据
interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface NewsImportRow {
  title?: string;
  category?: string;
  content?: string;
  status?: string;
}

const VALID_CATEGORIES = ['动态', '通知', '公告'];
const VALID_STATUSES = ['pending', 'published'];

function validateNewsRow(row: NewsImportRow, rowIndex: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // 标题验证
  if (!row.title || !row.title.trim()) {
    errors.push({ row: rowIndex, field: 'title', message: '标题不能为空' });
  } else if (row.title.trim().length > 500) {
    errors.push({ row: rowIndex, field: 'title', message: '标题长度不能超过500个字符' });
  }

  // 分类验证
  if (!row.category || !row.category.trim()) {
    errors.push({ row: rowIndex, field: 'category', message: '分类不能为空' });
  } else if (!VALID_CATEGORIES.includes(row.category.trim())) {
    errors.push({
      row: rowIndex,
      field: 'category',
      message: `无效的分类，支持的值: ${VALID_CATEGORIES.join(', ')}`,
    });
  }

  // 内容验证
  if (!row.content || !row.content.trim()) {
    errors.push({ row: rowIndex, field: 'content', message: '内容不能为空' });
  }

  // 状态验证（可选，默认为 pending）
  if (row.status && row.status.trim() && !VALID_STATUSES.includes(row.status.trim())) {
    errors.push({
      row: rowIndex,
      field: 'status',
      message: `无效的状态，支持的值: ${VALID_STATUSES.join(', ')}`,
    });
  }

  return errors;
}

// POST - 导入新闻
export async function POST(request: NextRequest) {
  const authError = await checkAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '请上传Excel文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: '请上传Excel文件 (.xlsx 或 .xls)' },
        { status: 400 }
      );
    }

    // 读取文件
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // 获取第一个工作表
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { error: 'Excel文件为空' },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rawData.length < 2) {
      return NextResponse.json(
        { error: 'Excel文件没有数据行' },
        { status: 400 }
      );
    }

    // 解析表头
    const headers = rawData[0].map((h: any) => String(h).trim().toLowerCase());

    // 验证必要的列是否存在
    const requiredColumns = ['title', 'category', 'content'];
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `Excel文件缺少必要的列: ${missingColumns.join(', ')}`,
          hint: '必要的列包括: title, category, content (status 为可选)',
        },
        { status: 400 }
      );
    }

    // 获取列索引
    const columnIndex = {
      title: headers.indexOf('title'),
      category: headers.indexOf('category'),
      content: headers.indexOf('content'),
      status: headers.indexOf('status'),
    };

    // 解析并验证数据行
    const allErrors: ValidationError[] = [];
    const validRows: NewsImportRow[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      // 跳过空行
      if (!row || row.every((cell: any) => cell === null || cell === undefined || cell === '')) {
        continue;
      }

      const newsRow: NewsImportRow = {
        title: String(row[columnIndex.title] ?? '').trim(),
        category: String(row[columnIndex.category] ?? '').trim(),
        content: String(row[columnIndex.content] ?? '').trim(),
        status: columnIndex.status >= 0 ? String(row[columnIndex.status] ?? 'pending').trim() : 'pending',
      };

      const rowErrors = validateNewsRow(newsRow, i + 1); // 行号从2开始（第1行是表头）
      if (rowErrors.length > 0) {
        allErrors.push(...rowErrors);
      } else {
        validRows.push(newsRow);
      }
    }

    const totalCount = rawData.length - 1; // 减去表头
    const failCount = allErrors.length;
    const successCount = validRows.length;

    // 批量导入有效数据
    let importStatus: 'success' | 'partial' | 'failed' = 'success';
    let errorLog: string | null = null;

    if (validRows.length > 0) {
      try {
        const importData = validRows.map((row) => ({
          title: row.title!,
          category: row.category!,
          content: row.content!,
          status: (row.status as 'pending' | 'published') || 'pending',
          publishedAt: new Date(),
        }));

        await prisma.news.createMany({
          data: importData,
        });

        // 重新验证页面
        revalidatePath('/');
        revalidatePath('/news');
        revalidatePath('/admin/news');
      } catch (dbError) {
        logger.error('Database import error:', dbError);
        errorLog = dbError instanceof Error ? dbError.message : String(dbError);
        importStatus = 'failed';
      }
    } else {
      importStatus = 'failed';
    }

    if (allErrors.length > 0 && validRows.length > 0) {
      importStatus = 'partial';
    }

    // 生成错误日志
    if (allErrors.length > 0) {
      errorLog = JSON.stringify(allErrors, null, 2);
    }

    // 记录导入日志
    try {
      // 获取当前管理员用户名（从session或cookie）
      const importedBy = 'admin'; // TODO: 从session获取真实用户名

      await prisma.importLog.create({
        data: {
          type: 'news',
          fileName: file.name,
          totalCount,
          successCount: importStatus === 'failed' ? 0 : successCount,
          failCount: importStatus === 'success' ? 0 : failCount,
          status: importStatus,
          errorLog: errorLog,
          importedBy,
        },
      });
    } catch (logError) {
      logger.error('Failed to save import log:', logError);
      // 不影响主流程
    }

    return NextResponse.json({
      success: importStatus !== 'failed',
      total: totalCount,
      successCount: importStatus === 'failed' ? 0 : successCount,
      failCount: importStatus === 'success' ? 0 : failCount,
      status: importStatus,
      errors: allErrors,
    });
  } catch (error) {
    logger.error('News import error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}
