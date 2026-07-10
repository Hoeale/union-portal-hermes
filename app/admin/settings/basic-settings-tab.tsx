'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faEye, faEyeSlash, faCheckCircle, faExclamationCircle, faShieldAlt, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import { useCsrfToken, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

export default function BasicSettingsTab() {
  const csrfToken = useCsrfToken();
  const [currentUsername, setCurrentUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [reviewEnabled, setReviewEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    apiClient.get<any>('/api/admin/profile')
      .then((result) => { if (result.success) setCurrentUsername(result.data.username || ''); })
      .catch((err) => logger.error('Failed to fetch admin profile:', err));
  }, []);

  useEffect(() => {
    apiClient.get<any>('/api/admin/settings')
      .then((result) => { if (result.success) setReviewEnabled(result.data.review_enabled || false); })
      .catch((err) => logger.error('Failed to fetch settings:', err));
  }, []);

  const toggleReview = async () => {
    setSettingsLoading(true);
    setSettingsMessage(null);
    try {
      await apiClient.post('/api/admin/settings', { key: 'review_enabled', value: !reviewEnabled ? 'true' : 'false', description: '是否启用内容审核功能', category: 'review' }, { csrfToken });
      setReviewEnabled(!reviewEnabled);
      setSettingsMessage({ type: 'success', text: !reviewEnabled ? '审核功能已开启' : '审核功能已关闭' });
    } catch {
      setSettingsMessage({ type: 'error', text: '设置失败，请重试' });
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!oldPassword || !newPassword || !confirmPassword) { setMessage({ type: 'error', text: '请填写所有字段' }); return; }
    if (newPassword.length < 6) { setMessage({ type: 'error', text: '新密码长度不能少于6位' }); return; }
    if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: '两次输入的新密码不一致' }); return; }
    if (oldPassword === newPassword) { setMessage({ type: 'error', text: '新密码不能与旧密码相同' }); return; }
    setLoading(true);
    try {
      await apiClient.post('/api/admin/change-password', { currentPassword: oldPassword, newPassword }, { csrfToken });
      setMessage({ type: 'success', text: '密码修改成功，3秒后跳转登录页' });
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => { window.location.href = '/admin/login'; }, 3000);
    } catch {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 密码修改卡片 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faKey} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[#1e2b3c]">修改密码</h2>
              <p className="text-sm text-gray-500">当前账户：<span className="font-medium text-[#1e2b3c]">{currentUsername || '加载中...'}</span></p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {message && (
            <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={message.type === 'success' ? faCheckCircle : faExclamationCircle} className="text-sm" />
                <span className="text-sm">{message.text}</span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">旧密码</label>
            <div className="relative">
              <input type={showOldPassword ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="请输入当前密码" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowOldPassword(!showOldPassword)}>
                <FontAwesomeIcon icon={showOldPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">新密码</label>
            <div className="relative">
              <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="请输入新密码（至少6位）" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowNewPassword(!showNewPassword)}>
                <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">确认新密码</label>
            <div className="relative">
              <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="请再次输入新密码" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={loading} className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {loading ? '修改中...' : '修改密码'}
            </button>
          </div>
        </form>
      </div>

      {/* 审核功能设置卡片 - 已隐藏
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faShieldAlt} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1e2b3c]">内容审核设置</h2>
              <p className="text-sm text-gray-500">管理内容审核功能的开启与关闭</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {settingsMessage && (
            <div className={`p-4 rounded-lg border mb-4 ${settingsMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <span className="text-sm">{settingsMessage.text}</span>
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">内容审核功能</h3>
                <p className="text-sm text-gray-500 mt-1">{reviewEnabled ? '已开启 - 内容需要经过审核才能发布' : '已关闭 - 内容将直接发布'}</p>
              </div>
              <button onClick={toggleReview} disabled={settingsLoading} className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${settingsLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : reviewEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                <FontAwesomeIcon icon={reviewEnabled ? faToggleOn : faToggleOff} className="text-xl mr-2" />
                {reviewEnabled ? '已开启' : '已关闭'}
              </button>
            </div>
          </div>
        </div>
      </div>
      */}
    </>
  );
}
