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

// 验证错误接口
interface ValidationError {
  row: number;
  field: string;
  message: string;
}

// 政策导入行接口
interface PolicyImportRow {
  title?: string;
  category?: string;
  publishDate?: string;
  source?: string;
  content?: string;
  status?: string;
}

const VALID_STATUSES = ['pending', 'published'];

function validatePolicyRow(row: PolicyImportRow, rowIndex: number): ValidationError[] {
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
  }

  // 发布日期验证
  if (!row.publishDate || !row.publishDate.trim()) {
    errors.push({ row: rowIndex, field: 'publishDate', message: '发布日期不能为空' });
  } else {
    // 验证日期格式 (YYYY-MM-DD 或 YYYY/MM/DD)
    const dateRegex = /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/;
    if (!dateRegex.test(row.publishDate.trim())) {
      errors.push({
        row: rowIndex,
        field: 'publishDate',
        message: '日期格式不正确，请使用 YYYY-MM-DD 格式',
      });
    } else {
      // 验证是否为有效日期
      const date = new Date(row.publishDate.trim());
      if (isNaN(date.getTime())) {
        errors.push({
          row: rowIndex,
          field: 'publishDate',
          message: '无效的日期',
        });
      }
    }
  }

  // 来源验证（可选，但如果有值则不能太长）
  if (row.source && row.source.trim() && row.source.trim().length > 200) {
    errors.push({ row: rowIndex, field: 'source', message: '来源长度不能超过200个字符' });
  }

  // 内容验证（可选）
  // 内容可以为空

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

// POST - 导入政策
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
    const requiredColumns = ['title', 'category', 'publishDate'];
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `Excel文件缺少必要的列: ${missingColumns.join(', ')}`,
          hint: '必要的列包括: title, category, publishDate (source, content, status 为可选)',
        },
        { status: 400 }
      );
    }

    // 获取列索引
    const columnIndex = {
      title: headers.indexOf('title'),
      category: headers.indexOf('category'),
      publishDate: headers.indexOf('publishDate'),
      source: headers.indexOf('source'),
      content: headers.indexOf('content'),
      status: headers.indexOf('status'),
    };

    // 解析并验证数据行
    const allErrors: ValidationError[] = [];
    const validRows: PolicyImportRow[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      // 跳过空行
      if (!row || row.every((cell: any) => cell === null || cell === undefined || cell === '')) {
        continue;
      }

      const policyRow: PolicyImportRow = {
        title: String(row[columnIndex.title] ?? '').trim(),
        category: String(row[columnIndex.category] ?? '').trim(),
        publishDate: String(row[columnIndex.publishDate] ?? '').trim(),
        source: columnIndex.source >= 0 ? String(row[columnIndex.source] ?? '').trim() : '',
        content: columnIndex.content >= 0 ? String(row[columnIndex.content] ?? '').trim() : '',
        status: columnIndex.status >= 0 ? String(row[columnIndex.status] ?? 'pending').trim() : 'pending',
      };

      // 处理 Excel 日期（可能是数字序列号）
      if (typeof row[columnIndex.publishDate] === 'number') {
        // Excel 日期序列号转换为 JS Date
        const excelDate = new Date((row[columnIndex.publishDate] - 25569) * 86400 * 1000);
        policyRow.publishDate = excelDate.toISOString().split('T')[0];
      }

      const rowErrors = validatePolicyRow(policyRow, i + 1); // 行号从2开始（第1行是表头）
      if (rowErrors.length > 0) {
        allErrors.push(...rowErrors);
      } else {
        validRows.push(policyRow);
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
          publishDate: row.publishDate!,
          source: row.source || '',
          content: row.content || '',
          status: (row.status as 'pending' | 'published') || 'pending',
          isActive: true,
        }));

        await prisma.policy.createMany({
          data: importData,
        });

        // 重新验证页面
        revalidatePath('/');
        revalidatePath('/policies');
        revalidatePath('/admin/policies');
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
      const importedBy = 'admin'; // TODO: 从session获取真实用户名

      await prisma.importLog.create({
        data: {
          type: 'policy',
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
    logger.error('Policy import error:', error);
    return NextResponse.json(
      { error: '服务器错误，请重试' },
      { status: 500 }
    );
  }
}
