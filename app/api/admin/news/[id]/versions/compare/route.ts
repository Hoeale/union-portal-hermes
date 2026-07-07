import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * 简单的字符串差异比较算法
 * 比较两个字符串，返回新增、删除和修改的部分
 */
function compareStrings(oldStr: string, newStr: string): { added: string[]; removed: string[]; modified: boolean } {
  const added: string[] = [];
  const removed: string[] = [];

  // 按段落分割（按换行或HTML标签分割）
  const oldSegments = oldStr.split(/(<[^>]+>|[\n\r]+)/).filter(Boolean);
  const newSegments = newStr.split(/(<[^>]+>|[\n\r]+)/).filter(Boolean);

  // 使用LCS算法找出差异
  const m = oldSegments.length;
  const n = newSegments.length;

  // 创建DP表
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldSegments[i - 1] === newSegments[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯找出差异
  let i = m;
  let j = n;
  const result: { type: 'equal' | 'added' | 'removed'; segment: string }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldSegments[i - 1] === newSegments[j - 1]) {
      result.unshift({ type: 'equal', segment: oldSegments[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', segment: newSegments[j - 1] });
      added.push(newSegments[j - 1]);
      j--;
    } else if (i > 0) {
      result.unshift({ type: 'removed', segment: oldSegments[i - 1] });
      removed.push(oldSegments[i - 1]);
      i--;
    }
  }

  return {
    added,
    removed,
    modified: added.length > 0 || removed.length > 0,
  };
}

// POST - 比较两个版本的差异
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }

  try {
    const contentId = params.id;
    const body = await request.json();
    const { versionId1, versionId2 } = body;

    if (!versionId1 || !versionId2) {
      return NextResponse.json(
        { error: '需要提供两个版本ID' },
        { status: 400 }
      );
    }

    // 获取两个版本
    const [version1, version2] = await Promise.all([
      prisma.contentVersion.findFirst({
        where: {
          id: versionId1,
          contentType: 'news',
          contentId,
        },
      }),
      prisma.contentVersion.findFirst({
        where: {
          id: versionId2,
          contentType: 'news',
          contentId,
        },
      }),
    ]);

    if (!version1 || !version2) {
      return NextResponse.json(
        { error: '一个或两个版本不存在' },
        { status: 404 }
      );
    }

    // 确保version1是旧版本
    const oldVersion = version1.version < version2.version ? version1 : version2;
    const newVersion = version1.version < version2.version ? version2 : version1;

    // 比较标题
    const titleDiff = compareStrings(oldVersion.title, newVersion.title);

    // 比较内容
    const contentDiff = compareStrings(oldVersion.content, newVersion.content);

    // 比较分类
    const categoryDiff = compareStrings(
      oldVersion.category || '',
      newVersion.category || ''
    );

    // 统计差异
    const stats = {
      titleChanges: titleDiff.added.length + titleDiff.removed.length,
      contentChanges: contentDiff.added.length + contentDiff.removed.length,
      categoryChanges: categoryDiff.added.length + categoryDiff.removed.length,
      totalChanges:
        titleDiff.added.length +
        titleDiff.removed.length +
        contentDiff.added.length +
        contentDiff.removed.length +
        categoryDiff.added.length +
        categoryDiff.removed.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        oldVersion: {
          version: oldVersion.version,
          title: oldVersion.title,
          content: oldVersion.content,
          category: oldVersion.category,
          changeLog: oldVersion.changeLog,
          createdAt: oldVersion.createdAt.toISOString(),
        },
        newVersion: {
          version: newVersion.version,
          title: newVersion.title,
          content: newVersion.content,
          category: newVersion.category,
          changeLog: newVersion.changeLog,
          createdAt: newVersion.createdAt.toISOString(),
        },
        diff: {
          title: titleDiff,
          content: contentDiff,
          category: categoryDiff,
        },
        stats,
      },
    });
  } catch (error) {
    logger.error('Compare versions error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
