'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faInfoCircle, faHeader, faQrcode, faBars, faEye, faEyeSlash, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useCsrfToken, useMessage } from '@/hooks';
import { apiClient } from '@/lib/api-client';
import ImageUpload from '@/components/admin/image-upload';

interface NavItem {
  id: string;
  name: string;
  href: string;
  visible: boolean;
  order: number;
}

interface V2Config {
  v2_header: {
    title: string;
    subtitle: string;
    logo: string;
    background_image: string;
  };
  v2_service_panel: {
    title: string;
    qrcode_image_1: string;
    qrcode_label_1: string;
    qrcode_image_2: string;
    qrcode_label_2: string;
    qrcode_text: string;
  };
  layout_config: {
    nav_items: NavItem[];
  };
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'home', name: '首页', href: '/', visible: true, order: 0 },
  { id: 'about', name: '工会概况', href: '/about', visible: true, order: 1 },
  { id: 'news', name: '新闻中心', href: '/news', visible: true, order: 2 },
  { id: 'videos', name: '视频中心', href: '/videos', visible: false, order: 3 },
  { id: 'services', name: '办事服务', href: '/services', visible: true, order: 4 },
  { id: 'policies', name: '政策文件', href: '/policies', visible: true, order: 5 },
  { id: 'workers', name: '最美劳动者', href: '/workers', visible: true, order: 6 },
];

const DEFAULT_CONFIG: V2Config = {
  v2_header: {
    title: '西安高新区总工会',
    subtitle: 'XI\'AN HIGH-TECH ZONE FEDERATION OF TRADE UNIONS',
    logo: '/logo.png',
    background_image: '/header-bg.png',
  },
  v2_service_panel: {
    title: '欢迎关注',
    qrcode_image_1: '/uploads/wechat-qrcode.jpg',
    qrcode_label_1: '微信公众号',
    qrcode_image_2: '/uploads/video-qrcode.jpg',
    qrcode_label_2: '视频号',
    qrcode_text: '扫码关注西安高新工会',
  },
  layout_config: {
    nav_items: DEFAULT_NAV_ITEMS,
  },
};

export default function AdminV2ContentPage() {
  const [config, setConfig] = useState<V2Config>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'header' | 'service-panel' | 'nav'>('header');
  const [titleError, setTitleError] = useState('');
  const [panelTitleError, setPanelTitleError] = useState('');
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/site-info', {
        credentials: 'include', // 发送 session cookie
      });
      if (response.ok) {
        const data = await response.json();
        setConfig({
          v2_header: data.v2_header || DEFAULT_CONFIG.v2_header,
          v2_service_panel: data.v2_service_panel || DEFAULT_CONFIG.v2_service_panel,
          layout_config: data.layout_config || DEFAULT_CONFIG.layout_config,
        });
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.v2_header.title.trim()) {
      setActiveTab('header');
      setTitleError('请填写网站标题');
      showMessage('error', '请填写网站标题');
      return;
    }

    if (!config.v2_service_panel.title.trim()) {
      setActiveTab('service-panel');
      setPanelTitleError('请填写面板标题');
      showMessage('error', '请填写面板标题');
      return;
    }

    if (!csrfToken) {
      showMessage('error', '安全令牌未获取，请刷新页面重试');
      return;
    }
    setSaving(true);
    try {
      const configs = [
        { v2_header: config.v2_header },
        { v2_service_panel: config.v2_service_panel },
        { layout_config: config.layout_config },
      ];

      for (const cfg of configs) {
        await apiClient.put('/api/admin/site-info', cfg, { csrfToken });
      }

      showMessage('success', '首页配置已保存');
    } catch (error) {
      showMessage('error', '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#a51b1b]">首页内容管理</h1>
          <p className="text-gray-600 mt-1">配置首页的Header和服务面板</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#b71c1c] text-white rounded-lg hover:bg-[#8b0000] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={saving ? faSpinner : faSave} className={saving ? 'animate-spin' : ''} />
          {saving ? '保存中...' : '保存全部'}
        </button>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <FontAwesomeIcon icon={faInfoCircle} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-100">
          {[
            { id: 'header', label: 'Header配置', icon: faHeader },
            { id: 'service-panel', label: '服务面板', icon: faQrcode },
            { id: 'nav', label: '导航管理', icon: faBars },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#b71c1c] text-[#b71c1c]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Header Config */}
          {activeTab === 'header' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Logo 图片
                </label>
                <ImageUpload
                  value={config.v2_header.logo}
                  onChange={(url) => setConfig({ ...config, v2_header: { ...config.v2_header, logo: url } })}
                  hint="支持 JPG、PNG 格式，建议尺寸 80x80px"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  网站标题 <span className="text-red-500">*</span>
                </label>
                {titleError && (
                  <p className="mb-2 text-sm text-red-600">{titleError}</p>
                )}
                <input
                  type="text"
                  value={config.v2_header.title}
                  onChange={(e) => {
                    setConfig({ ...config, v2_header: { ...config.v2_header, title: e.target.value } });
                    if (e.target.value.trim()) {
                      setTitleError('');
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent ${
                    titleError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="西安高新区总工会"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  英文副标题
                </label>
                <input
                  type="text"
                  value={config.v2_header.subtitle}
                  onChange={(e) => setConfig({ ...config, v2_header: { ...config.v2_header, subtitle: e.target.value } })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  placeholder="XI'AN HIGH-TECH ZONE FEDERATION OF TRADE UNIONS"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  背景图片路径
                </label>
                <input
                  type="text"
                  value={config.v2_header.background_image}
                  onChange={(e) => setConfig({ ...config, v2_header: { ...config.v2_header, background_image: e.target.value } })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  placeholder="/header-bg.png"
                />
                <p className="mt-2 text-sm text-gray-500">Header背景图片路径，支持相对路径和绝对路径</p>
              </div>
            </div>
          )}

          {/* Service Panel Config */}
          {activeTab === 'service-panel' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  面板标题 <span className="text-red-500">*</span>
                </label>
                {panelTitleError && (
                  <p className="mb-2 text-sm text-red-600">{panelTitleError}</p>
                )}
                <input
                  type="text"
                  value={config.v2_service_panel.title}
                  onChange={(e) => {
                    setConfig({ ...config, v2_service_panel: { ...config.v2_service_panel, title: e.target.value } });
                    if (e.target.value.trim()) {
                      setPanelTitleError('');
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent ${
                    panelTitleError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="欢迎关注"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    二维码 1 标签
                  </label>
                  <input
                    type="text"
                    value={config.v2_service_panel.qrcode_label_1}
                    onChange={(e) => setConfig({ ...config, v2_service_panel: { ...config.v2_service_panel, qrcode_label_1: e.target.value } })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                    placeholder="微信公众号"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    二维码 1 图片
                  </label>
                  <ImageUpload
                    value={config.v2_service_panel.qrcode_image_1}
                    onChange={(url) => setConfig({ ...config, v2_service_panel: { ...config.v2_service_panel, qrcode_image_1: url } })}
                    hint="支持 JPG、PNG 格式，建议尺寸 200x200px"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    二维码 2 标签
                  </label>
                  <input
                    type="text"
                    value={config.v2_service_panel.qrcode_label_2}
                    onChange={(e) => setConfig({ ...config, v2_service_panel: { ...config.v2_service_panel, qrcode_label_2: e.target.value } })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                    placeholder="视频号"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    二维码 2 图片
                  </label>
                  <ImageUpload
                    value={config.v2_service_panel.qrcode_image_2}
                    onChange={(url) => setConfig({ ...config, v2_service_panel: { ...config.v2_service_panel, qrcode_image_2: url } })}
                    hint="支持 JPG、PNG 格式，建议尺寸 200x200px"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  底部提示文字
                </label>
                <input
                  type="text"
                  value={config.v2_service_panel.qrcode_text}
                  onChange={(e) => setConfig({ ...config, v2_service_panel: { ...config.v2_service_panel, qrcode_text: e.target.value } })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  placeholder="扫码关注西安高新工会"
                />
              </div>
            </div>
          )}

          {/* Navigation Config */}
          {activeTab === 'nav' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-600">管理门户网站导航栏的显示模块及排序</p>
                </div>
              </div>

              <div className="space-y-2">
                {config.layout_config.nav_items
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                        item.visible
                          ? 'bg-white border-gray-200'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* 排序按钮 */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              const items = [...config.layout_config.nav_items].sort((a, b) => a.order - b.order);
                              if (index > 0) {
                                const prevOrder = items[index - 1].order;
                                items[index - 1].order = items[index].order;
                                items[index].order = prevOrder;
                                setConfig({
                                  ...config,
                                  layout_config: { nav_items: items },
                                });
                              }
                            }}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-[#b71c1c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="上移"
                          >
                            <FontAwesomeIcon icon={faChevronUp} className="text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const items = [...config.layout_config.nav_items].sort((a, b) => a.order - b.order);
                              if (index < items.length - 1) {
                                const nextOrder = items[index + 1].order;
                                items[index + 1].order = items[index].order;
                                items[index].order = nextOrder;
                                setConfig({
                                  ...config,
                                  layout_config: { nav_items: items },
                                });
                              }
                            }}
                            disabled={index === config.layout_config.nav_items.length - 1}
                            className="p-1 text-gray-400 hover:text-[#b71c1c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="下移"
                          >
                            <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                          </button>
                        </div>

                        {/* 模块信息 */}
                        <div>
                          <span className="font-medium text-gray-800">{item.name}</span>
                          <span className="ml-2 text-xs text-gray-400">{item.href}</span>
                        </div>
                      </div>

                      {/* 显示/隐藏开关 */}
                      <button
                        type="button"
                        onClick={() => {
                          const items = config.layout_config.nav_items.map((navItem) =>
                            navItem.id === item.id ? { ...navItem, visible: !navItem.visible } : navItem
                          );
                          setConfig({
                            ...config,
                            layout_config: { nav_items: items },
                          });
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          item.visible
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <FontAwesomeIcon icon={item.visible ? faEye : faEyeSlash} className="text-xs" />
                        {item.visible ? '显示中' : '已隐藏'}
                      </button>
                    </div>
                  ))}
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                  “首页”模块为必选项，建议至少保留 3 个导航模块。保存后刷新前台页面即可生效。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
        <p className="text-sm text-blue-800">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
          保存后刷新前台首页即可看到变化。可在“导航管理”标签页中控制导航栏各模块的显示与排序。
        </p>
      </div>
    </div>
  );
}
