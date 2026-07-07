import FrontendWrapper from '@/components/frontend-wrapper';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import FileDownloadButton from '@/components/file-download-button';

interface Feature {
  title: string;
  description: string;
  color: string;
}

interface Step {
  order: number;
  title: string;
  description: string;
}

// 解析 JSON 字段
function parseJSON<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// 颜色映射
const COLOR_MAP: Record<string, { bg: string; border: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200' },
  green: { bg: 'bg-green-50', border: 'border-green-200' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200' },
  red: { bg: 'bg-red-50', border: 'border-red-200' },
};

async function getService(slug: string) {
  try {
    // 先尝试通过 ID 查询
    let service = await prisma.service.findFirst({
      where: {
        id: slug,
        isActive: true,
      },
    });

    // 如果通过 ID 找不到，尝试通过 routePath 查询（用于支持旧路由）
    if (!service) {
      service = await prisma.service.findFirst({
        where: {
          routePath: `/services/${slug}`,
          isActive: true,
        },
      });
    }

    return service;
  } catch {
    return null;
  }
}

async function getGlobalConfig() {
  try {
    const config = await prisma.siteInfo.findMany({
      where: {
        key: {
          in: ['service_download_enabled', 'service_show_intro', 'service_show_criteria', 'service_show_process', 'service_show_tips'],
        },
      },
    });
    const result: Record<string, string> = {
      service_download_enabled: 'true',
      service_show_intro: 'true',
      service_show_criteria: 'true',
      service_show_process: 'true',
      service_show_tips: 'true',
    };
    config.forEach((item) => {
      result[item.key] = item.content;
    });
    return result;
  } catch {
    return { service_download_enabled: 'true', service_show_intro: 'true', service_show_criteria: 'true', service_show_process: 'true', service_show_tips: 'true' };
  }
}

export default async function DynamicServicePage({
  params,
}: {
  params: { slug: string };
}) {
  const data = await getService(params.slug);
  const globalConfig = await getGlobalConfig();

  if (!data) {
    return (
      <FrontendWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">服务未找到</h1>
            <Link href="/services" className="text-[hsl(var(--primary))] hover:underline">
              返回办事服务
            </Link>
          </div>
        </div>
      </FrontendWrapper>
    );
  }

  const service = data;
  const downloadEnabled = globalConfig.service_download_enabled === 'true';
  const globalShowIntro = globalConfig.service_show_intro !== 'false';
  const globalShowProcess = globalConfig.service_show_process !== 'false';
  const globalShowTips = globalConfig.service_show_tips !== 'false';

  // 解析多附件
  let attachments: { url: string; fileName: string }[] = [];
  try {
    if (service?.fileUrls) {
      const urls = JSON.parse(service.fileUrls);
      const names = service.fileNames ? JSON.parse(service.fileNames) : [];
      attachments = urls.map((url: string, i: number) => ({
        url,
        fileName: names[i] || url.split('/').pop() || '附件',
      }));
    } else if (service?.fileUrl) {
      attachments = [{ url: service.fileUrl, fileName: service.fileName || '附件' }];
    }
  } catch {}
  const showDownload = downloadEnabled && service?.enableDownload && attachments.length > 0;

  // 解析结构化数据
  const features: Feature[] = parseJSON(service?.features, []);
  const steps: Step[] = parseJSON(service?.steps, []);
  const tips: string[] = parseJSON(service?.tips, []);

  return (
    <FrontendWrapper>
      <div className="bg-[hsl(var(--background))] min-h-screen">
        {/* 页面标题 */}
        <div className={`bg-gradient-to-br ${service.gradient || 'from-gray-500 to-gray-600'} text-white py-12 lg:py-16`}>
          <div className="container mx-auto px-4 lg:px-8">
            {/* 返回按钮 */}
            <div className="mb-4">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                返回办事服务
              </Link>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold">{service.title}</h1>
            <p className="text-white/90 text-lg mt-2">{service.description}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-12">
          {/* 服务介绍 */}
          {globalShowIntro && service?.showIntro && (
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4 flex items-center gap-3">
                <span className="w-1 h-8 bg-[hsl(var(--primary))] rounded-full" />
                {service.introTitle || '服务介绍'}
              </h2>
              
              {/* 简介文本 */}
              {service.introText && (
                <p className="text-[hsl(var(--foreground-muted))] leading-relaxed mb-6 whitespace-pre-wrap">
                  {service.introText}
                </p>
              )}
              
              {/* 服务特点网格 */}
              {service?.showFeatures && features.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {features.map((feature, index) => {
                    const colors = COLOR_MAP[feature.color] || COLOR_MAP.blue;
                    return (
                      <div key={index} className={`${colors.bg} rounded-lg p-5 border ${colors.border}`}>
                        <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">{feature.title}</h3>
                        <p className="text-sm text-[hsl(var(--foreground-muted))]">{feature.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* 向后兼容：如果没有新数据，显示旧字段 */}
              {!service.introText && features.length === 0 && service.serviceIntro && (
                <p className="text-[hsl(var(--foreground-muted))] leading-relaxed whitespace-pre-wrap">
                  {service.serviceIntro}
                </p>
              )}
              {!service.introText && features.length === 0 && !service.serviceIntro && service?.description && (
                <p className="text-[hsl(var(--foreground-muted))] leading-relaxed whitespace-pre-wrap">
                  {service.description}
                </p>
              )}
            </div>
          )}

          {/* 流程步骤 */}
          {globalShowProcess && service?.showSteps && steps.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-3">
                <span className="w-1 h-8 bg-[hsl(var(--primary))] rounded-full" />
                {service.stepsTitle || '使用流程'}
              </h2>
              <div className={`grid gap-6 ${
                steps.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                steps.length === 2 ? 'grid-cols-2 max-w-2xl mx-auto' :
                steps.length === 3 ? 'grid-cols-3 max-w-3xl mx-auto' :
                'grid-cols-1 md:grid-cols-4'
              }`}>
                {steps.map((step) => (
                  <div key={step.order} className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 gradient-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {step.order}
                    </div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">{step.title}</h3>
                    <p className="text-sm text-[hsl(var(--foreground-muted))]">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 向后兼容：如果没有新数据，显示旧字段 */}
          {globalShowProcess && !steps.length && service?.showApplicationProcess && service?.process && (
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-3">
                <span className="w-1 h-8 bg-[hsl(var(--primary))] rounded-full" />
                办事流程
              </h2>
              <p className="text-[hsl(var(--foreground-muted))] whitespace-pre-wrap">{service.process}</p>
            </div>
          )}

          {/* 温馨提示 */}
          {globalShowTips && (service?.showTips) && tips.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="font-bold text-lg text-yellow-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {service.tipsTitle || '温馨提示'}
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                {tips.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 向后兼容：如果没有新数据，显示旧字段 */}
          {globalShowTips && !tips.length && service?.showTips && service?.tips && !service.steps && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="font-bold text-lg text-yellow-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {service.tipsTitle || '温馨提示'}
              </h3>
              <p className="text-sm text-yellow-700 whitespace-pre-wrap">{service.tips}</p>
            </div>
          )}

          {/* 附件下载 */}
          {showDownload && (
            <div className="bg-white rounded-xl shadow-sm p-8 mt-8">
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                附件下载
              </h2>
              <div className="space-y-3">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-[hsl(var(--primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium text-[hsl(var(--foreground))]">{attachment.fileName}</span>
                    </div>
                    <FileDownloadButton fileUrl={attachment.url} fileName={attachment.fileName} label="下载" />
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      </div>
    </FrontendWrapper>
  );
}
