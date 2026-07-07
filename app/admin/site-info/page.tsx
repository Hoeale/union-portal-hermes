'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faInfoCircle, faPhone, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useCsrfToken, useMessage, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface SiteInfo {
  address: string;
  phone: string;
}

const DEFAULT_SITE_INFO: SiteInfo = {
  address: '陕西省西安市高新区锦业路都市之门A座1410室',
  phone: '',
};

export default function AdminSiteInfoPage() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(DEFAULT_SITE_INFO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await apiClient.get<any>('/api/admin/site-info');
      if (data.site_info) {
        setSiteInfo(data.site_info);
      }
    } catch (error) {
      logger.error('Failed to fetch site info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await apiClient.put('/api/admin/site-info', { site_info: siteInfo }, { csrfToken });
      showMessage('success', '配置已保存');
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
    <div className="max-w-4xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#a51b1b]">站点信息</h1>
        <p className="text-gray-600 mt-1">配置站点基本信息（通讯地址、联系电话）</p>
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

      {/* Migration Notice */}
      <div className="mb-6 bg-amber-50 rounded-lg border border-amber-200 p-4">
        <p className="text-sm text-amber-800">
          <FontAwesomeIcon icon={faArrowRight} className="mr-2" />
          <strong>注：</strong>页脚配置（机构信息、版权、友情链接等）已迁移至{' '}
          <a href="/admin/footer" className="text-[#b71c1c] underline hover:text-[#8b0000]">
            &apos;页脚管理&apos; 页面
          </a>
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
              通讯地址 <span className="text-red-500">*</span>
            </label>
            <input
              id="address"
              type="text"
              value={siteInfo.address}
              onChange={(e) => setSiteInfo({ ...siteInfo, address: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent transition-all"
              placeholder="请输入通讯地址"
            />
            <p className="mt-2 text-sm text-gray-500">全站底部显示的通讯地址</p>
          </div>

          {/* Phone */}
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

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#b71c1c] text-white rounded-lg hover:bg-[#8b0000] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={saving ? faSpinner : faSave} className={saving ? 'animate-spin' : ''} />
              {saving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
