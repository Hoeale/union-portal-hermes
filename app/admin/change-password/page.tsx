'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey,
  faEye,
  faEyeSlash,
  faSave,
  faExclamationCircle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { useCsrfToken, useMessage, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

export default function ChangePasswordPage() {
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      showMessage('error', '请输入当前密码');
      return false;
    }
    if (!formData.newPassword) {
      showMessage('error', '请输入新密码');
      return false;
    }
    if (formData.newPassword.length < 6) {
      showMessage('error', '新密码长度不能少于6位');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      showMessage('error', '两次输入的新密码不一致');
      return false;
    }
    if (formData.currentPassword === formData.newPassword) {
      showMessage('error', '新密码不能与当前密码相同');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await apiClient.post('/api/admin/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }, { csrfToken });

      showMessage('success', '密码修改成功！');
      // 清空表单
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      logger.error('Failed to change password:', error);
      showMessage('error', error.message || '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faKey} className="text-[#b71c1c]" />
          修改密码
        </h1>
        <p className="text-gray-500 mt-1">为了账号安全，请定期更换密码</p>
      </div>

      {/* 密码修改表单 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <FontAwesomeIcon
              icon={message.type === 'success' ? faCheckCircle : faExclamationCircle}
              className="flex-shrink-0"
            />
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 当前密码 */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              当前密码 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-[#b71c1c] transition-colors pr-10"
                placeholder="请输入当前密码"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, current: !prev.current }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={showPassword.current ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {/* 新密码 */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              新密码 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-[#b71c1c] transition-colors pr-10"
                placeholder="请输入新密码（至少6位）"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, new: !prev.new }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={showPassword.new ? faEyeSlash : faEye} />
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              密码长度至少6位，建议使用字母、数字组合
            </p>
          </div>

          {/* 确认新密码 */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              确认新密码 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-[#b71c1c] transition-colors pr-10"
                placeholder="请再次输入新密码"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FontAwesomeIcon icon={showPassword.confirm ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {/* 按钮组 */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#b71c1c] text-white rounded-lg hover:bg-[#9a1818] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  保存中...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} />
                  保存修改
                </>
              )}
            </button>
            <Link
              href="/admin"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              返回
            </Link>
          </div>
        </form>
      </div>

      {/* 安全提示 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">安全提示</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>请定期更换密码，建议每3个月修改一次</li>
          <li>密码应包含字母、数字，避免使用简单密码</li>
          <li>不要将密码告知他人或在公共场合输入</li>
          <li>修改密码后，其他设备需要重新登录</li>
        </ul>
      </div>
    </div>
  );
}
