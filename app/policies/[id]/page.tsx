import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import FrontendWrapper from '@/components/frontend-wrapper';
import { ArrowLeft, Calendar, FileText, Download } from 'lucide-react';
import FileDownloadButton from '@/components/file-download-button';

interface Attachment {
  url: string;
  fileName: string;
}

async function getPolicy(id: string) {
  try {
    const policy = await prisma.policy.findUnique({
      where: { id },
    });
    return policy;
  } catch {
    return null;
  }
}

async function getGlobalConfig() {
  try {
    const config = await prisma.siteInfo.findMany({
      where: {
        key: {
          in: ['policy_download_enabled'],
        },
      },
    });
    const result: Record<string, string> = { policy_download_enabled: 'false' };
    config.forEach((item) => {
      result[item.key] = item.content;
    });
    return result;
  } catch {
    return { policy_download_enabled: 'false' };
  }
}

export default async function PolicyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const policy = await getPolicy(params.id);
  const config = await getGlobalConfig();

  if (!policy) {
    notFound();
  }

  // 判断是否显示下载按钮
  // 优先检查单个政策的设置，全局配置作为额外开关
  const showDownload =
    policy.enableDownload &&
    (policy.fileUrl || policy.fileUrls) &&
    (config.policy_download_enabled === 'true' || config.policy_download_enabled === undefined);

  // 解析多附件数据
  const attachments: Attachment[] = [];
  if (policy.fileUrls) {
    try {
      const urls = JSON.parse(policy.fileUrls);
      const names = policy.fileNames ? JSON.parse(policy.fileNames) : [];
      urls.forEach((url: string, i: number) => {
        attachments.push({
          url,
          fileName: names[i] || url.split('/').pop() || '附件',
        });
      });
    } catch {
      // 解析失败，使用单附件
    }
  }
  // 兼容旧数据：如果没有多附件，使用单附件
  if (attachments.length === 0 && policy.fileUrl) {
    attachments.push({
      url: policy.fileUrl,
      fileName: policy.fileName || '附件',
    });
  }

  // 格式化发布日期（只显示年月日）
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <FrontendWrapper>
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/policies"
            className="inline-flex items-center gap-2 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--primary))] transition-colors mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            返回政策文件
          </Link>

          <article className="card overflow-hidden animate-fade-in">
            {/* 标题区域 */}
            <div className="p-6 lg:p-8 border-b border-[hsl(var(--card-border))]">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-3 py-1.5 rounded-full text-sm font-semibold border bg-green-50 text-green-700 border-green-200">
                  {policy.category}
                </span>
                <time className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(policy.publishDate)}
                </time>
                {policy.source && (
                  <span className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    {policy.source}
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-4xl font-bold text-[hsl(var(--foreground))] leading-tight">
                {policy.title}
              </h1>
            </div>

            {/* 政策内容 */}
            <div className="p-6 lg:p-8">
              <div
                className="rich-text-content max-w-none text-[hsl(var(--foreground-muted))] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: policy.content }}
              />
            </div>

            {/* 附件下载区域（放在最下方） */}
            {showDownload && attachments.length > 0 && (
              <div className="p-6 lg:p-8 border-t border-[hsl(var(--card-border))] bg-gray-50">
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  附件下载
                </h3>
                <div className="space-y-3">
                  {attachments.map((att, index) => (
                    <FileDownloadButton
                      key={index}
                      fileUrl={att.url}
                      fileName={att.fileName}
                      label={att.fileName}
                      variant="outline"
                    />
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </FrontendWrapper>
  );
}
