'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faInfoCircle, faLink, faBuilding, faCopyright, faPlus, faEdit, faTrash, faArrowUp, faArrowDown, faPhone } from '@fortawesome/free-solid-svg-icons';
import { useCsrfToken, useMessage, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface FriendlyLink {
  id: string;
  title: string;
  url: string;
  is_required: boolean;
  order_index: number;
}

interface FooterConfig {
  organization_name: string;
  organization_name_en: string;
  organization_description: string;
  logo_url: string;
  contact_email: string;
  contact_email_label: string;
  copyright_text: string;
  copyright_show_year: boolean;
  copyright_reserved: string;
  show_footer: boolean;
  show_friendly_links: boolean;
  privacy_policy_url: string;
  terms_url: string;
  sitemap_url: string;
  show_privacy_policy: boolean;
  show_terms: boolean;
  show_sitemap: boolean;
  show_contact_email: boolean;
}

interface SiteInfo {
  address: string;
  phone: string;
}

const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  organization_name: '西安高新区总工会',
  organization_name_en: "Xi'an High-Tech Zones Federation of Trade Unions",
  organization_description: '维护职工合法权益，竭诚服务职工群众，促进劳动关系和谐稳定，推动高新区高质量发展。',
  logo_url: '/logo.png',
  contact_email: 'contact@example.com',
  contact_email_label: '联系我们',
  copyright_text: '西安高新区总工会',
  copyright_show_year: true,
  copyright_reserved: '版权所有',
  show_footer: true,
  show_friendly_links: true,
  privacy_policy_url: '#',
  terms_url: '#',
  sitemap_url: '#',
  show_privacy_policy: false,
  show_terms: false,
  show_sitemap: false,
  show_contact_email: true,
};

const DEFAULT_SITE_INFO: SiteInfo = {
  address: '陕西省西安市高新区锦业路都市之门A座1410室',
  phone: '',
};

export default function AdminFooterPage() {
  const [activeTab, setActiveTab] = useState<'links' | 'config' | 'site'>('links');
  const [links, setLinks] = useState<FriendlyLink[]>([]);
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(DEFAULT_SITE_INFO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();
  
  // 友情链接模态框
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkFormData, setLinkFormData] = useState({
    title: '',
    url: '',
    is_required: false,
    order_index: 0,
  });
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [linksRes, configRes] = await Promise.all([
        fetch('/api/admin/links', {
          credentials: 'include', // 发送 session cookie
        }),
        fetch('/api/admin/site-info', {
          credentials: 'include', // 发送 session cookie
        }),
      ]);
      
      if (linksRes.ok) {
        const linksData = await linksRes.json();
        if (linksData.success) {
          setLinks(linksData.data);
        }
      }
      
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.footer_config) {
          setFooterConfig({ ...DEFAULT_FOOTER_CONFIG, ...configData.footer_config });
        }
        if (configData.site_info) {
          setSiteInfo({ ...DEFAULT_SITE_INFO, ...configData.site_info });
        }
      }
    } catch (error) {
      logger.error('Failed to fetch footer data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 保存页脚配置
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await apiClient.put('/api/admin/site-info', { footer_config: footerConfig, site_info: siteInfo }, { csrfToken });
      showMessage('success', '配置已保存');
    } catch (error) {
      showMessage('error', '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 保存站点信息
  const handleSaveSiteInfo = async () => {
    setSaving(true);
    try {
      await apiClient.put('/api/admin/site-info', { site_info: siteInfo }, { csrfToken });
      showMessage('success', '站点信息已保存');
    } catch (error) {
      showMessage('error', '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 友情链接 - 表单提交
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkSubmitting(true);

    try {
      const data = { id: editingLinkId || undefined, ...linkFormData };
      if (editingLinkId) {
        await apiClient.put('/api/admin/links', data, { csrfToken });
      } else {
        await apiClient.post('/api/admin/links', data, { csrfToken });
      }
      setLinkModalOpen(false);
      setEditingLinkId(null);
      setLinkFormData({ title: '', url: '', is_required: false, order_index: 0 });
      fetchData();
      showMessage('success', editingLinkId ? '链接已更新' : '链接已添加');
    } catch (error) {
      showMessage('error', '保存失败');
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleEditLink = (link: FriendlyLink) => {
    setEditingLinkId(link.id);
    setLinkFormData({
      title: link.title,
      url: link.url,
      is_required: link.is_required,
      order_index: link.order_index,
    });
    setLinkModalOpen(true);
  };

  const handleCancelLink = () => {
    setLinkModalOpen(false);
    setEditingLinkId(null);
    setLinkFormData({ title: '', url: '', is_required: false, order_index: 0 });
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await apiClient.delete(`/api/admin/links?id=${id}`, { csrfToken });
      setDeleteConfirmId(null);
      fetchData();
      showMessage('success', '链接已删除');
    } catch (error) {
      showMessage('error', '删除失败');
    }
  };

  // 调整链接排序
  const moveLink = async (id: string, direction: 'up' | 'down') => {
    const sortedLinks = [...links].sort((a, b) => a.order_index - b.order_index);
    const currentIndex = sortedLinks.findIndex(l => l.id === id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= sortedLinks.length) return;

    const currentLink = sortedLinks[currentIndex];
    const targetLink = sortedLinks[newIndex];

    // 交换 order_index
    const updatedLinks = links.map(link => {
      if (link.id === id) return { ...link, order_index: targetLink.order_index };
      if (link.id === targetLink.id) return { ...link, order_index: currentLink.order_index };
      return link;
    });

    setLinks(updatedLinks);

    // 保存到服务器（传递完整字段）
    try {
      await Promise.all([
        apiClient.put('/api/admin/links', {
          id,
          title: currentLink.title,
          url: currentLink.url,
          is_required: currentLink.is_required,
          order_index: targetLink.order_index
        }, { csrfToken }),
        apiClient.put('/api/admin/links', {
          id: targetLink.id,
          title: targetLink.title,
          url: targetLink.url,
          is_required: targetLink.is_required,
          order_index: currentLink.order_index
        }, { csrfToken }),
      ]);
      showMessage('success', '排序已更新');
    } catch (error) {
      logger.error('Failed to update link order:', error);
      showMessage('error', '排序更新失败');
      fetchData(); // 重新加载恢复原始数据
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-gray-400" />
      </div>
    );
  }

  const sortedLinks = [...links].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#a51b1b]">页脚管理</h1>
        <p className="text-gray-600 mt-1">统一管理全站页脚内容，包括友情链接、机构信息、版权信息等</p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
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
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('links')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'links'
                ? 'border-[#b71c1c] text-[#b71c1c]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faLink} className="mr-2" />
            友情链接
            <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {links.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'config'
                ? 'border-[#b71c1c] text-[#b71c1c]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faBuilding} className="mr-2" />
            页脚配置
          </button>
          <button
            onClick={() => setActiveTab('site')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'site'
                ? 'border-[#b71c1c] text-[#b71c1c]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
            站点信息
          </button>
        </nav>
      </div>

      {/* 友情链接 Tab */}
      {activeTab === 'links' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">友情链接列表</h2>
            <button
              onClick={() => {
                setEditingLinkId(null);
                setLinkFormData({ title: '', url: '', is_required: false, order_index: 0 });
                setLinkModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-[#b71c1c] text-white text-sm font-medium rounded-lg hover:bg-[#8b0000] transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              添加链接
            </button>
          </div>

          {sortedLinks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无友情链接</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">排序</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">链接</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">必填</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedLinks.map((link, index) => (
                    <tr key={link.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                          <button
                            onClick={() => moveLink(link.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <FontAwesomeIcon icon={faArrowUp} className="text-xs" />
                          </button>
                          <button
                            onClick={() => moveLink(link.id, 'down')}
                            disabled={index === sortedLinks.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <FontAwesomeIcon icon={faArrowDown} className="text-xs" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{link.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 truncate max-w-xs">{link.url}</div>
                      </td>
                      <td className="px-6 py-4">
                        {link.is_required ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            必填
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">可选</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditLink(link)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FontAwesomeIcon icon={faEdit} /> 编辑
                        </button>
                        {link.is_required ? (
                          <span className="text-gray-400 cursor-not-allowed">不可删除</span>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(link.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FontAwesomeIcon icon={faTrash} /> 删除
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 页脚配置 Tab */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSaveConfig(); }} className="space-y-6">
            {/* 机构信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                <FontAwesomeIcon icon={faBuilding} className="mr-2" />
                机构信息
              </h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  机构中文名称
                </label>
                <input
                  type="text"
                  value={footerConfig.organization_name}
                  onChange={(e) => setFooterConfig({ ...footerConfig, organization_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  机构英文名称
                </label>
                <input
                  type="text"
                  value={footerConfig.organization_name_en}
                  onChange={(e) => setFooterConfig({ ...footerConfig, organization_name_en: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  机构简介/使命描述
                </label>
                <textarea
                  value={footerConfig.organization_description}
                  onChange={(e) => setFooterConfig({ ...footerConfig, organization_description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Logo 图片路径
                </label>
                <input
                  type="text"
                  value={footerConfig.logo_url}
                  onChange={(e) => setFooterConfig({ ...footerConfig, logo_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  placeholder="/logo.png"
                />
                <p className="mt-2 text-sm text-gray-500">页脚 Logo 图片路径，相对于 public 目录</p>
              </div>
            </div>

            {/* 联系方式 */}
            <div className="space-y-4 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                页脚联系方式
              </h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  联系邮箱
                </label>
                <input
                  type="email"
                  value={footerConfig.contact_email}
                  onChange={(e) => setFooterConfig({ ...footerConfig, contact_email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  邮箱显示文字
                </label>
                <input
                  type="text"
                  value={footerConfig.contact_email_label}
                  onChange={(e) => setFooterConfig({ ...footerConfig, contact_email_label: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  placeholder="联系我们"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="show_friendly_links"
                  checked={footerConfig.show_friendly_links}
                  onChange={(e) => setFooterConfig({ ...footerConfig, show_friendly_links: e.target.checked })}
                  className="w-4 h-4 text-[#b71c1c] border-gray-300 rounded focus:ring-[#b71c1c]"
                />
                <label htmlFor="show_friendly_links" className="text-sm text-gray-700">
                  显示友情链接区域
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="show_contact_email"
                  checked={footerConfig.show_contact_email}
                  onChange={(e) => setFooterConfig({ ...footerConfig, show_contact_email: e.target.checked })}
                  className="w-4 h-4 text-[#b71c1c] border-gray-300 rounded focus:ring-[#b71c1c]"
                />
                <label htmlFor="show_contact_email" className="text-sm text-gray-700">
                  显示联系我们（邮箱）
                </label>
              </div>
            </div>

            {/* 版权信息 */}
            <div className="space-y-4 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                <FontAwesomeIcon icon={faCopyright} className="mr-2" />
                页脚版权信息
              </h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  版权文字
                </label>
                <input
                  type="text"
                  value={footerConfig.copyright_text}
                  onChange={(e) => setFooterConfig({ ...footerConfig, copyright_text: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="copyright_show_year"
                  checked={footerConfig.copyright_show_year}
                  onChange={(e) => setFooterConfig({ ...footerConfig, copyright_show_year: e.target.checked })}
                  className="w-4 h-4 text-[#b71c1c] border-gray-300 rounded focus:ring-[#b71c1c]"
                />
                <label htmlFor="copyright_show_year" className="text-sm text-gray-700">
                  显示年份（© 2026）
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  保留权利文字
                </label>
                <input
                  type="text"
                  value={footerConfig.copyright_reserved}
                  onChange={(e) => setFooterConfig({ ...footerConfig, copyright_reserved: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  placeholder="版权所有"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#b71c1c] text-white rounded-lg hover:bg-[#8b0000] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={saving ? faSpinner : faSave} className={saving ? 'animate-spin' : ''} />
                {saving ? '保存中...' : '保存页脚配置'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 站点信息 Tab */}
      {activeTab === 'site' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSiteInfo(); }} className="space-y-6">
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                通讯地址
              </label>
              <input
                id="address"
                type="text"
                value={siteInfo.address}
                onChange={(e) => setSiteInfo({ ...siteInfo, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent transition-all"
                placeholder="请输入通讯地址（留空则不显示）"
              />
              <p className="mt-2 text-sm text-gray-500">全站底部显示的通讯地址，留空则不显示</p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                <FontAwesomeIcon icon={faPhone} className="mr-2" />
                联系电话
              </label>
              <input
                id="phone"
                type="text"
                value={siteInfo.phone}
                onChange={(e) => setSiteInfo({ ...siteInfo, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent transition-all"
                placeholder="请输入联系电话（选填）"
              />
              <p className="mt-2 text-sm text-gray-500">全站底部显示的联系电话，留空则不显示</p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#b71c1c] text-white rounded-lg hover:bg-[#8b0000] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={saving ? faSpinner : faSave} className={saving ? 'animate-spin' : ''} />
                {saving ? '保存中...' : '保存站点信息'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 添加/编辑链接模态框 */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={handleCancelLink}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleLinkSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingLinkId ? '编辑友情链接' : '添加友情链接'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        标题 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={linkFormData.title}
                        onChange={(e) => setLinkFormData({ ...linkFormData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                        placeholder="请输入链接标题"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        链接地址 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        required
                        value={linkFormData.url}
                        onChange={(e) => setLinkFormData({ ...linkFormData, url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        排序（可选）
                      </label>
                      <input
                        type="number"
                        value={linkFormData.order_index}
                        onChange={(e) => setLinkFormData({ ...linkFormData, order_index: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                        placeholder="数字越小越靠前"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">留空将自动添加到末尾</p>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="link_is_required"
                        checked={linkFormData.is_required}
                        onChange={(e) => setLinkFormData({ ...linkFormData, is_required: e.target.checked })}
                        className="rounded border-gray-300 text-[#b71c1c] focus:ring-[#b71c1c]"
                      />
                      <label htmlFor="link_is_required" className="ml-2 text-sm font-medium text-gray-700">
                        设为必填链接（不可删除）
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={linkSubmitting}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-[#b71c1c] text-base font-medium text-white hover:bg-[#8b0000] focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {linkSubmitting ? (editingLinkId ? '更新中...' : '添加中...') : (editingLinkId ? '更新' : '添加')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelLink}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setDeleteConfirmId(null)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium text-gray-900">确认删除</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">此操作将永久删除该友情链接，无法恢复。确定要继续吗？</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => handleDeleteLink(deleteConfirmId)}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  删除
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
        <p className="text-sm text-blue-800">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
          <strong>提示：</strong>页脚配置保存后全站即时生效。友情链接支持拖拽排序（开发中），目前可通过上下箭头调整顺序。
        </p>
      </div>
    </div>
  );
}
