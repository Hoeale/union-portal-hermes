'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FrontendWrapper from '@/components/frontend-wrapper';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkedAlt, faUserPlus, faExchangeAlt, faCommentDots, faGraduationCap, faFemale, faHandHoldingHeart, faTh, faDownload, faSearch } from '@fortawesome/free-solid-svg-icons';
import FileDownloadButton from '@/components/file-download-button';

interface FlowStep {
  order: number;
  title: string;
  description: string;
}

interface ContactInfo {
  phoneLabel?: string;
  phone?: string;
  emailLabel?: string;
  email?: string;
}

// 服务图标映射
const SERVICE_ICONS: Record<string, any> = {
  '工会地图': faMapMarkedAlt,
  '入会': faUserPlus,
  '入会申请': faUserPlus,
  '转会': faExchangeAlt,
  '工会关系转移': faExchangeAlt,
  '职工诉求': faCommentDots,
  '求学圆梦': faGraduationCap,
  '女职工评优': faFemale,
  '女职工评优申报': faFemale,
  '困难职工': faHandHoldingHeart,
  '困难职工申报': faHandHoldingHeart,
  '更多服务': faTh,
};

// 服务渐变色映射
const SERVICE_GRADIENTS: Record<string, string> = {
  '工会地图': 'from-blue-500 to-blue-600',
  '入会': 'from-green-500 to-green-600',
  '入会申请': 'from-green-500 to-green-600',
  '转会': 'from-indigo-500 to-indigo-600',
  '工会关系转移': 'from-indigo-500 to-indigo-600',
  '职工诉求': 'from-orange-500 to-orange-600',
  '求学圆梦': 'from-purple-500 to-purple-600',
  '女职工评优': 'from-pink-500 to-pink-600',
  '女职工评优申报': 'from-pink-500 to-pink-600',
  '困难职工': 'from-red-500 to-red-600',
  '困难职工申报': 'from-red-500 to-red-600',
};

// 服务路由映射
const SERVICE_ROUTES: Record<string, string> = {
  '工会地图': '/services/srv-001',
  '入会': '/services/03122672-1c04-42ca-8d47-f8cec576031d',
  '入会申请': '/services/03122672-1c04-42ca-8d47-f8cec576031d',
  '转会': '/services/284d5718-fcac-423a-8583-7a3a9c0c92f9',
  '工会关系转移': '/services/284d5718-fcac-423a-8583-7a3a9c0c92f9',
  '职工诉求': '/services/srv-004',
  '求学圆梦': '/services/srv-005',
  '女职工评优': '/services/a33ea130-e3b7-489d-996c-a1234eb9de56',
  '女职工评优申报': '/services/a33ea130-e3b7-489d-996c-a1234eb9de56',
  '困难职工': '/services/4e1019c9-3c99-4923-bc8f-94c94fbe2b88',
  '困难职工申报': '/services/4e1019c9-3c99-4923-bc8f-94c94fbe2b88',
};

interface Service {
  id: string;
  title: string;
  description: string;
  enableDownload: boolean;
  fileUrl: string | null;
  fileName: string | null;
  fileUrls: string | null;
  fileNames: string | null;
}

function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [downloadEnabled, setDownloadEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phoneLabel: '服务热线',
    emailLabel: '邮箱地址',
    phone: '029-12345678',
    email: 'service@union.gov.cn',
  });

  // 获取服务数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取服务列表
        const servicesRes = await fetch('/api/services');
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          setServices(servicesData);
        }

        // 获取全局配置
        const configRes = await fetch('/api/site-config');
        if (configRes.ok) {
          const configData = await configRes.json();
          setDownloadEnabled(configData.service_download_enabled === 'true');

          // 加载服务流程配置
          if (configData.service_flow_steps) {
            try {
              const steps = JSON.parse(configData.service_flow_steps);
              if (steps.length > 0) setFlowSteps(steps);
            } catch {}
          }

          // 加载联系信息配置
          if (configData.service_contact_info) {
            try {
              const contact = JSON.parse(configData.service_contact_info);
              setContactInfo({
                phoneLabel: contact.phoneLabel || '服务热线',
                phone: contact.phone || '029-12345678',
                emailLabel: contact.emailLabel || '邮箱地址',
                email: contact.email || 'service@union.gov.cn',
              });
            } catch {}
          }
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 模块内搜索 - 只搜索服务
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search/?q=${encodeURIComponent(searchQuery)}&type=service`);
    }
  };

  return (
    <FrontendWrapper>
      <div className="bg-[hsl(var(--background))] min-h-screen">
        {/* 页面标题 */}
        <div className="gradient-primary text-white py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">办事服务</h1>
              <p className="text-white/90 text-lg">为您提供全方位的服务支持，竭诚服务职工群众</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-12">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#b71c1c]"></div>
              <p className="mt-3 text-gray-500">加载中...</p>
            </div>
          ) : (
            <>
              {/* 服务卡片网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {services.map((service) => {
                  const icon = SERVICE_ICONS[service.title] || faTh;
                  const gradient = SERVICE_GRADIENTS[service.title] || 'from-gray-500 to-gray-600';
                  const route = SERVICE_ROUTES[service.title] || `/services/${service.id}`;
                  
                  // 解析多附件
                  let attachments: { url: string; fileName: string }[] = [];
                  try {
                    if (service.fileUrls) {
                      const urls = JSON.parse(service.fileUrls);
                      const names = service.fileNames ? JSON.parse(service.fileNames) : [];
                      attachments = urls.map((url: string, i: number) => ({
                        url,
                        fileName: names[i] || url.split('/').pop() || '附件',
                      }));
                    } else if (service.fileUrl) {
                      attachments = [{ url: service.fileUrl, fileName: service.fileName || '附件' }];
                    }
                  } catch {}
                  const showDownload = downloadEnabled && service.enableDownload && attachments.length > 0;

                  return (
                    <div
                      key={service.id}
                      className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-[hsl(var(--card-border))] flex flex-col"
                    >
                      {/* 服务头部 */}
                      <Link href={route} className={`bg-gradient-to-br ${gradient} text-white p-6 text-center`}>
                        <div className="bg-white/20 w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <FontAwesomeIcon icon={icon} className="text-3xl" />
                        </div>
                        <h2 className="text-xl font-bold">{service.title}</h2>
                      </Link>

                      {/* 服务内容 */}
                      <div className="p-5 flex-1 flex flex-col">
                        <p className="text-[hsl(var(--foreground-muted))] text-sm mb-4 whitespace-pre-wrap line-clamp-2">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {services.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <p>暂无服务数据</p>
                </div>
              )}

              {/* 服务流程 */}
              {flowSteps.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-8 flex items-center gap-3">
                  <span className="w-1 h-8 bg-[hsl(var(--primary))] rounded-full" />
                  服务流程
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {flowSteps.map((step, index) => (
                    <div key={step.order} className="text-center relative">
                      <div className="w-14 h-14 mx-auto mb-4 gradient-primary text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                        {step.order}
                      </div>
                      <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">{step.title}</h3>
                      <p className="text-sm text-[hsl(var(--foreground-muted))]">{step.description}</p>
                      {index < flowSteps.length - 1 && (
                        <div className="hidden md:block absolute top-7 left-full w-full h-0.5 bg-gradient-to-r from-[hsl(var(--primary))] to-transparent -z-10" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* 联系方式 */}
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-3">
                  <span className="w-1 h-8 bg-[hsl(var(--primary))] rounded-full" />
                  联系我们
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-[hsl(var(--primary))] text-white rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[hsl(var(--foreground))]">{contactInfo.phoneLabel || '服务热线'}</h3>
                      <p className="text-[hsl(var(--foreground-muted))]">{contactInfo.phone || '029-12345678'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-[hsl(var(--primary))] text-white rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[hsl(var(--foreground))]">{contactInfo.emailLabel || '邮箱地址'}</h3>
                      <p className="text-[hsl(var(--foreground-muted))]">{contactInfo.email || 'service@union.gov.cn'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </FrontendWrapper>
  );
}

export default ServicesPage;
