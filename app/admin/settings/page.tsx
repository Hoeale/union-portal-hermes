'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faSignInAlt, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import BasicSettingsTab from './basic-settings-tab';
import LoginLogsTab from './login-logs-tab';
import OperationLogsTab from './operation-logs-tab';

type TabType = 'basic' | 'login-logs' | 'operation-logs';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  const tabs = [
    { id: 'basic' as TabType, name: '基本设置', icon: faCog },
    { id: 'login-logs' as TabType, name: '登录日志', icon: faSignInAlt },
    { id: 'operation-logs' as TabType, name: '操作日志', icon: faClipboardList },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-[#1e2b3c]">系统设置</h1>
        <p className="text-gray-500 mt-1">管理账户安全、系统配置与日志记录</p>
      </div>

      {/* Tab 导航 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-[#b71c1c] text-[#b71c1c]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon
                icon={tab.icon}
                className={`-ml-0.5 mr-2 h-5 w-5 ${
                  activeTab === tab.id ? 'text-[#b71c1c]' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 内容 */}
      {activeTab === 'basic' && <BasicSettingsTab />}
      {activeTab === 'login-logs' && <LoginLogsTab />}
      {activeTab === 'operation-logs' && <OperationLogsTab />}
    </div>
  );
}
