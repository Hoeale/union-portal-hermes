'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faSave, faSpinner,
  faTimes, faToggleOn, faToggleOff, faInfoCircle, faArrowUp, faArrowDown,
  faDownload, faCheck, faXmark
} from '@fortawesome/free-solid-svg-icons';
import FileUpload from '@/components/admin/file-upload';
import MultiFileUpload, { Attachment } from '@/components/admin/multi-file-upload';
import FeaturesEditor from '@/components/admin/features-editor';
import StepsEditor from '@/components/admin/steps-editor';
import TipsEditor from '@/components/admin/tips-editor';
import { useCsrfToken, useMessage, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

interface Service {
  id: string;
  title: string;
  description: string;
  process: string;
  requirements: string;
  fileUrl: string | null;
  fileName: string | null;
  fileUrls: string | null;
  fileNames: string | null;
  enableDownload: boolean;
  isActive: boolean;
  orderIndex: number;
  
  // 显示控制字段
  icon: string | null;
  gradient: string | null;
  routePath: string | null;
  
  // 旧版字段
  serviceIntro: string;
  showServiceIntro: boolean;
  selectionCriteria: string;
  showSelectionCriteria: boolean;
  applicationProcess: string;
  showApplicationProcess: boolean;
  tips: string;
  showTips: boolean;
  
  // 结构化字段
  introText: string;
  introTitle: string;
  showIntro: boolean;
  features: string;
  showFeatures: boolean;
  steps: string;
  stepsTitle: string;
  showSteps: boolean;
  tipsTitle: string;
}

interface FormData {
  title: string;
  description: string;
  process: string;
  requirements: string;
  fileUrl: string;
  fileName: string;
  fileUrls: string;
  fileNames: string;
  attachments: Attachment[];
  enableDownload: boolean;
  isActive: boolean;
  orderIndex: number;
  
  // 显示控制字段
  icon: string;
  gradient: string;
  routePath: string;
  
  // 旧版字段
  serviceIntro: string;
  showServiceIntro: boolean;
  selectionCriteria: string;
  showSelectionCriteria: boolean;
  applicationProcess: string;
  showApplicationProcess: boolean;
  tips: string;
  showTips: boolean;
  
  // 结构化字段
  introText: string;
  introTitle: string;
  showIntro: boolean;
  features: string;
  showFeatures: boolean;
  steps: string;
  stepsTitle: string;
  showSteps: boolean;
  tipsTitle: string;
}

// 全局开关组件
function GlobalToggleSwitch({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    setSaving(true);
    try {
      await onToggle(!enabled);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
      <div>
        <h3 className="text-sm font-medium text-gray-900">{label}</h3>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <button
        onClick={handleToggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-[#b71c1c]' : 'bg-gray-300'
        } disabled:opacity-50`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function AdminServicesPage() {
  const csrfToken = useCsrfToken();
  const { message, showMessage } = useMessage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [globalShowIntro, setGlobalShowIntro] = useState(true);
  const [globalShowCriteria, setGlobalShowCriteria] = useState(true);
  const [globalShowProcess, setGlobalShowProcess] = useState(true);
  const [globalShowTips, setGlobalShowTips] = useState(true);
  const [showPageSettings, setShowPageSettings] = useState(false);
  const [flowSteps, setFlowSteps] = useState<{order: number; title: string; description: string}[]>([
    { order: 1, title: '准备资料', description: '准备相关申请材料' },
    { order: 2, title: '资料审核', description: '工作人员审核材料' },
    { order: 3, title: '办理服务', description: '工作人员为您办理' },
    { order: 4, title: '完成反馈', description: '服务完成并反馈' },
  ]);
  const [contactPhone, setContactPhone] = useState('029-12345678');
  const [contactEmail, setContactEmail] = useState('service@union.gov.cn');
  const [contactPhoneLabel, setContactPhoneLabel] = useState('服务热线');
  const [contactEmailLabel, setContactEmailLabel] = useState('邮箱地址');
  const [savingPageSettings, setSavingPageSettings] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    process: '',
    requirements: '',
    fileUrl: '',
    fileName: '',
    fileUrls: '[]',
    fileNames: '[]',
    attachments: [],
    enableDownload: false,
    isActive: true,
    orderIndex: 0,
    icon: '',
    gradient: '',
    routePath: '',
    serviceIntro: '',
    showServiceIntro: true,
    selectionCriteria: '',
    showSelectionCriteria: true,
    applicationProcess: '',
    showApplicationProcess: true,
    tips: '',
    showTips: true,
    introText: '',
    introTitle: '服务介绍',
    showIntro: true,
    features: '[]',
    showFeatures: true,
    steps: '[]',
    stepsTitle: '使用流程',
    showSteps: true,
    tipsTitle: '温馨提示',
  });

  useEffect(() => {
    fetchServices();
    fetchGlobalSettings();
  }, []);

  const fetchGlobalSettings = async () => {
    try {
      const response = await fetch('/api/site-config', {
        credentials: 'include',
      });
      if (response.ok) {
        const config = await response.json();
        setGlobalShowIntro(config.service_show_intro !== 'false');
        setGlobalShowCriteria(config.service_show_criteria !== 'false');
        setGlobalShowProcess(config.service_show_process !== 'false');
        setGlobalShowTips(config.service_show_tips !== 'false');
        
        // 加载服务流程配置
        if (config.service_flow_steps) {
          try {
            const steps = JSON.parse(config.service_flow_steps);
            if (steps.length > 0) setFlowSteps(steps);
          } catch {}
        }
        
        // 加载联系信息配置
        if (config.service_contact_info) {
          try {
            const contact = JSON.parse(config.service_contact_info);
            if (contact.phone) setContactPhone(contact.phone);
            if (contact.email) setContactEmail(contact.email);
            if (contact.phoneLabel) setContactPhoneLabel(contact.phoneLabel);
            if (contact.emailLabel) setContactEmailLabel(contact.emailLabel);
          } catch {}
        }
      }
    } catch (error) {
      logger.error('Error fetching global settings:', error);
    }
  };

  const updateGlobalSetting = async (key: string, value: string) => {
    try {
      await apiClient.put('/api/site-config', { key, value }, { csrfToken });
      showMessage('success', '设置已更新');
    } catch (error) {
      logger.error('Error updating global setting:', error);
      showMessage('error', '设置更新失败');
    }
  };

  const savePageSettings = async () => {
    setSavingPageSettings(true);
    try {
      // 保存服务流程
      await apiClient.put('/api/site-config', { 
        key: 'service_flow_steps', 
        value: JSON.stringify(flowSteps) 
      }, { csrfToken });
      
      // 保存联系信息
      await apiClient.put('/api/site-config', { 
        key: 'service_contact_info', 
        value: JSON.stringify({ phone: contactPhone, email: contactEmail, phoneLabel: contactPhoneLabel, emailLabel: contactEmailLabel }) 
      }, { csrfToken });
      
      showMessage('success', '页面设置已保存');
    } catch (error) {
      logger.error('Error saving page settings:', error);
      showMessage('error', '保存失败');
    } finally {
      setSavingPageSettings(false);
    }
  };

  const addFlowStep = () => {
    setFlowSteps([...flowSteps, { order: flowSteps.length + 1, title: '', description: '' }]);
  };

  const removeFlowStep = (index: number) => {
    const newSteps = flowSteps.filter((_, i) => i !== index);
    setFlowSteps(newSteps.map((step, i) => ({ ...step, order: i + 1 })));
  };

  const updateFlowStep = (index: number, field: string, value: string) => {
    const newSteps = [...flowSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFlowSteps(newSteps);
  };

  const fetchServices = async () => {
    try {
      const result = await apiClient.get<any>('/api/admin/services');
      setServices(result.data || []);
    } catch (error) {
      logger.error('Error fetching services:', error);
      showMessage('error', '加载服务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    
    // 解析多附件数据
    let attachments: Attachment[] = [];
    try {
      if (service.fileUrls) {
        const urls = JSON.parse(service.fileUrls);
        const names = service.fileNames ? JSON.parse(service.fileNames) : [];
        attachments = urls.map((url: string, i: number) => ({
          url,
          fileName: names[i] || url.split('/').pop() || '附件',
        }));
      } else if (service.fileUrl) {
        // 兼容旧数据
        attachments = [{ url: service.fileUrl, fileName: service.fileName || '附件' }];
      }
    } catch {
      attachments = [];
    }
    
    // 如果新字段为空但旧字段有数据，将旧数据转换为新格式
    let featuresData = service.features || '[]';
    let stepsData = service.steps || '[]';
    let tipsData = service.tips || '[]';
    let introTextData = service.introText || '';
    
    // 转换旧的服务介绍为新的 introText
    if (!introTextData && service.serviceIntro) {
      introTextData = service.serviceIntro;
    }
    
    // 转换旧的温馨提示为新的 tips 数组
    if (tipsData === '[]' && service.tips && service.tips.trim()) {
      // 尝试解析 tips 是否为 JSON 数组
      try {
        const parsed = JSON.parse(service.tips);
        if (Array.isArray(parsed)) {
          tipsData = service.tips;
        } else {
          // 如果不是数组，按行分割
          tipsData = JSON.stringify(service.tips.split('\n').filter(line => line.trim()));
        }
      } catch {
        // 纯文本，按行分割
        tipsData = JSON.stringify(service.tips.split('\n').filter(line => line.trim()));
      }
    }
    
    setFormData({
      title: service.title,
      description: service.description,
      process: service.process,
      requirements: service.requirements,
      fileUrl: service.fileUrl || '',
      fileName: service.fileName || '',
      fileUrls: service.fileUrls || '[]',
      fileNames: service.fileNames || '[]',
      attachments,
      enableDownload: service.enableDownload,
      isActive: service.isActive,
      orderIndex: service.orderIndex,
      icon: service.icon || '',
      gradient: service.gradient || '',
      routePath: service.routePath || '',
      serviceIntro: service.serviceIntro || '',
      showServiceIntro: service.showServiceIntro,
      selectionCriteria: service.selectionCriteria || '',
      showSelectionCriteria: service.showSelectionCriteria,
      applicationProcess: service.applicationProcess || '',
      showApplicationProcess: service.showApplicationProcess,
      tips: tipsData,
      showTips: service.showTips,
      introText: introTextData,
      introTitle: service.introTitle || '服务介绍',
      showIntro: service.showIntro,
      features: featuresData,
      showFeatures: service.showFeatures,
      steps: stepsData,
      stepsTitle: service.stepsTitle || '使用流程',
      showSteps: service.showSteps,
      tipsTitle: service.tipsTitle || '温馨提示',
    });
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingId(null);
    setIsCreating(false);
    setFormData({
      title: '',
      description: '',
      process: '',
      requirements: '',
      fileUrl: '',
      fileName: '',
      fileUrls: '[]',
      fileNames: '[]',
      attachments: [],
      enableDownload: false,
      isActive: true,
      orderIndex: 0,
      icon: '',
      gradient: '',
      routePath: '',
      serviceIntro: '',
      showServiceIntro: true,
      selectionCriteria: '',
      showSelectionCriteria: true,
      applicationProcess: '',
      showApplicationProcess: true,
      tips: '[]',
      showTips: true,
      introText: '',
      introTitle: '服务介绍',
      showIntro: true,
      features: '[]',
      showFeatures: true,
      steps: '[]',
      stepsTitle: '使用流程',
      showSteps: true,
      tipsTitle: '温馨提示',
    });
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'x-csrf-token': csrfToken,
      },
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      return data.url;
    }
    throw new Error('Upload failed');
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showMessage('error', '服务标题不能为空');
      return;
    }

    if (!formData.description.trim()) {
      showMessage('error', '服务描述不能为空');
      return;
    }

    setSaving(true);
    try {
      // 处理多附件数据
      const urls = formData.attachments.map(a => a.url);
      const names = formData.attachments.map(a => a.fileName);
      
      const body = isCreating ? {
        ...formData,
        fileUrls: JSON.stringify(urls),
        fileNames: JSON.stringify(names),
        fileUrl: urls.length > 0 ? urls[0] : '',
        fileName: names.length > 0 ? names[0] : '',
      } : {
        ...formData,
        id: editingId,
        fileUrls: JSON.stringify(urls),
        fileNames: JSON.stringify(names),
        fileUrl: urls.length > 0 ? urls[0] : '',
        fileName: names.length > 0 ? names[0] : '',
      };
      
      const result = isCreating
        ? await apiClient.post<any>('/api/admin/services', body, { csrfToken })
        : await apiClient.put<any>('/api/admin/services', body, { csrfToken });

      const savedData = result.data || result;
      showMessage('success', isCreating ? '创建成功' : '更新成功');
      
      // 编辑模式下保持打开状态，用最新数据更新表单
      if (!isCreating && savedData) {
        setFormData({
          title: savedData.title || formData.title,
          description: savedData.description || formData.description,
          process: savedData.process || formData.process,
          requirements: savedData.requirements || formData.requirements,
          fileUrl: savedData.fileUrl || '',
          fileName: savedData.fileName || '',
          fileUrls: savedData.fileUrls || formData.fileUrls,
          fileNames: savedData.fileNames || formData.fileNames,
          attachments: formData.attachments,
          enableDownload: savedData.enableDownload !== undefined ? savedData.enableDownload : formData.enableDownload,
          isActive: savedData.isActive !== undefined ? savedData.isActive : formData.isActive,
          orderIndex: savedData.orderIndex !== undefined ? savedData.orderIndex : formData.orderIndex,
          icon: savedData.icon || formData.icon,
          gradient: savedData.gradient || formData.gradient,
          routePath: savedData.routePath || formData.routePath,
          serviceIntro: savedData.serviceIntro || '',
          showServiceIntro: savedData.showServiceIntro !== undefined ? savedData.showServiceIntro : formData.showServiceIntro,
          selectionCriteria: savedData.selectionCriteria || '',
          showSelectionCriteria: savedData.showSelectionCriteria !== undefined ? savedData.showSelectionCriteria : formData.showSelectionCriteria,
          applicationProcess: savedData.applicationProcess || '',
          showApplicationProcess: savedData.showApplicationProcess !== undefined ? savedData.showApplicationProcess : formData.showApplicationProcess,
          tips: savedData.tips || formData.tips,
          showTips: savedData.showTips !== undefined ? savedData.showTips : formData.showTips,
          introText: savedData.introText || '',
          introTitle: savedData.introTitle || '服务介绍',
          showIntro: savedData.showIntro !== undefined ? savedData.showIntro : formData.showIntro,
          features: savedData.features || formData.features,
          showFeatures: savedData.showFeatures !== undefined ? savedData.showFeatures : formData.showFeatures,
          steps: savedData.steps || formData.steps,
          stepsTitle: savedData.stepsTitle || '使用流程',
          showSteps: savedData.showSteps !== undefined ? savedData.showSteps : formData.showSteps,
          tipsTitle: savedData.tipsTitle || '温馨提示',
        });
        // 刷新列表
        fetchServices();
      } else {
        handleCancel();
        fetchServices();
      }
    } catch (error) {
      logger.error('Error saving service:', error);
      showMessage('error', '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个服务吗？')) return;

    try {
      await apiClient.delete(`/api/admin/services?id=${id}`, { csrfToken });
      showMessage('success', '删除成功');
      fetchServices();
    } catch (error) {
      logger.error('Error deleting service:', error);
      showMessage('error', '删除失败');
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await apiClient.put('/api/admin/services', { id: service.id, isActive: !service.isActive }, { csrfToken });
      fetchServices();
    } catch (error) {
      logger.error('Error toggling service:', error);
      showMessage('error', '更新失败');
    }
  };

  const moveService = async (index: number, direction: 'up' | 'down') => {
    const newServices = [...services];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newServices.length) return;

    // Swap orderIndex
    const temp = newServices[index].orderIndex;
    newServices[index].orderIndex = newServices[targetIndex].orderIndex;
    newServices[targetIndex].orderIndex = temp;

    // Sort and update
    newServices.sort((a, b) => a.orderIndex - b.orderIndex);
    setServices(newServices);

    // Update in database
    try {
      await apiClient.put('/api/admin/services', { id: newServices[index].id, orderIndex: newServices[index].orderIndex }, { csrfToken });
      await apiClient.put('/api/admin/services', { id: newServices[targetIndex].id, orderIndex: newServices[targetIndex].orderIndex }, { csrfToken });
    } catch (error) {
      logger.error('Error reordering:', error);
      fetchServices();
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e2b3c]">办事服务管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理和配置工会办事服务项目
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPageSettings(!showPageSettings)}
            className={`px-4 py-2 border rounded-lg transition-colors ${
              showPageSettings 
                ? 'bg-[#b71c1c] text-white border-[#b71c1c]' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            页面设置
          </button>
          <button
            onClick={() => {
              setIsCreating(true);
              setShowModal(true);
              setFormData({
                title: '',
                description: '',
                process: '',
                requirements: '',
                fileUrl: '',
                fileName: '',
                fileUrls: '[]',
                fileNames: '[]',
                attachments: [],
                enableDownload: false,
                isActive: true,
                orderIndex: services.length,
                icon: '',
                gradient: '',
                routePath: '',
                serviceIntro: '',
                showServiceIntro: true,
                selectionCriteria: '',
                showSelectionCriteria: true,
                applicationProcess: '',
                showApplicationProcess: true,
                tips: '[]',
                showTips: true,
                introText: '',
                introTitle: '服务介绍',
                showIntro: true,
                features: '[]',
                showFeatures: true,
                steps: '[]',
                stepsTitle: '使用流程',
                showSteps: true,
                tipsTitle: '温馨提示',
              });
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#b71c1c] text-white rounded-lg hover:bg-[#9a1616] transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} />
            添加服务
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <FontAwesomeIcon icon={faInfoCircle} />
          <span>{message.text}</span>
        </div>
      )}

      {/* 全局设置已隐藏 — 用户可自行编辑每项服务的字段 */}
      {/* Global Settings panel removed */}
      {false && showGlobalSettings && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-[#1e2b3c]">全局显示设置</h2>
            <p className="text-sm text-gray-500 mt-1">
              控制前台服务详情页面各部分的显示/隐藏
            </p>
          </div>
          <div className="p-6 space-y-4">
            <GlobalToggleSwitch
              label="服务介绍"
              description="控制'服务介绍'部分在前台的显示"
              enabled={globalShowIntro}
              onToggle={(enabled) => {
                setGlobalShowIntro(enabled);
                updateGlobalSetting('service_show_intro', String(enabled));
              }}
            />
            <GlobalToggleSwitch
              label="评选条件"
              description="控制'评选条件'部分在前台的显示"
              enabled={globalShowCriteria}
              onToggle={(enabled) => {
                setGlobalShowCriteria(enabled);
                updateGlobalSetting('service_show_criteria', String(enabled));
              }}
            />
            <GlobalToggleSwitch
              label="申报流程"
              description="控制'申报流程'部分在前台的显示"
              enabled={globalShowProcess}
              onToggle={(enabled) => {
                setGlobalShowProcess(enabled);
                updateGlobalSetting('service_show_process', String(enabled));
              }}
            />
            <GlobalToggleSwitch
              label="温馨提示"
              description="控制'温馨提示'部分在前台的显示"
              enabled={globalShowTips}
              onToggle={(enabled) => {
                setGlobalShowTips(enabled);
                updateGlobalSetting('service_show_tips', String(enabled));
              }}
            />
          </div>
        </div>
      )}

      {/* Page Settings (服务流程 & 联系我们) */}
      {showPageSettings && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-[#1e2b3c]">办事服务页设置</h2>
            <p className="text-sm text-gray-500 mt-1">
              编辑 /services 页面的服务流程和联系信息
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* 服务流程 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">服务流程</h3>
                <button
                  onClick={addFlowStep}
                  className="text-sm text-[#b71c1c] hover:text-[#9a1616] font-medium"
                >
                  + 添加步骤
                </button>
              </div>
              <div className="space-y-3">
                {flowSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="w-8 h-8 flex items-center justify-center bg-[#b71c1c] text-white rounded-full text-sm font-bold flex-shrink-0">
                      {step.order}
                    </span>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => updateFlowStep(index, 'title', e.target.value)}
                      placeholder="步骤标题"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={step.description}
                      onChange={(e) => updateFlowStep(index, 'description', e.target.value)}
                      placeholder="步骤描述"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                    />
                    <button
                      onClick={() => removeFlowStep(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 联系信息 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">联系信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                  <input
                    type="text"
                    value={contactPhoneLabel}
                    onChange={(e) => setContactPhoneLabel(e.target.value)}
                    placeholder="例如：服务热线"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent mb-2"
                  />
                  <label className="block text-sm font-medium text-gray-700 mb-2">电话</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="例如：029-12345678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                  <input
                    type="text"
                    value={contactEmailLabel}
                    onChange={(e) => setContactEmailLabel(e.target.value)}
                    placeholder="例如：邮箱地址"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent mb-2"
                  />
                  <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="例如：service@union.gov.cn"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={savePageSettings}
                disabled={savingPageSettings}
                className="px-6 py-2.5 bg-[#b71c1c] text-white rounded-lg hover:bg-[#9a1616] transition-colors disabled:opacity-50"
              >
                {savingPageSettings ? '保存中...' : '保存设置'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-[#1e2b3c]">
                {isCreating ? '添加服务' : '编辑服务'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* 基本信息 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">基本信息</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      服务标题 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                      placeholder="例如：困难职工帮扶"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-[#b71c1c] rounded focus:ring-[#b71c1c]"
                      />
                      <span className="text-sm font-medium text-gray-700">在前台显示</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    服务描述 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                    placeholder="简短描述该服务..."
                  />
                </div>

                {/* 显示配置字段 - 已隐藏（图标名称、渐变色、路由路径） */}
              </div>

              {/* 服务介绍 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">服务介绍</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showIntro}
                        onChange={(e) => setFormData({ ...formData, showIntro: e.target.checked })}
                        className="w-4 h-4 text-[#b71c1c] rounded focus:ring-[#b71c1c]"
                      />
                      <span className="text-sm text-gray-600">显示此部分</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">显示标题</label>
                    <input
                      type="text"
                      value={formData.introTitle}
                      onChange={(e) => setFormData({ ...formData, introTitle: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                      placeholder="例如：服务介绍"
                    />
                  </div>
                </div>
                {formData.showIntro && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">简介文本</label>
                      <textarea
                        value={formData.introText}
                        onChange={(e) => setFormData({ ...formData, introText: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                        placeholder="输入服务简介..."
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700">服务特点</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.showFeatures}
                            onChange={(e) => setFormData({ ...formData, showFeatures: e.target.checked })}
                            className="w-4 h-4 text-[#b71c1c] rounded focus:ring-[#b71c1c]"
                          />
                          <span className="text-xs text-gray-500">显示特点列表</span>
                        </label>
                      </div>
                      {formData.showFeatures && (
                        <FeaturesEditor
                          value={formData.features}
                          onChange={(value) => setFormData({ ...formData, features: value })}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 流程步骤 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">流程步骤</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showSteps}
                        onChange={(e) => setFormData({ ...formData, showSteps: e.target.checked })}
                        className="w-4 h-4 text-[#b71c1c] rounded focus:ring-[#b71c1c]"
                      />
                      <span className="text-sm text-gray-600">显示此部分</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">显示标题</label>
                    <input
                      type="text"
                      value={formData.stepsTitle}
                      onChange={(e) => setFormData({ ...formData, stepsTitle: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                      placeholder="例如：使用流程"
                    />
                  </div>
                </div>
                {formData.showSteps && (
                  <StepsEditor
                    value={formData.steps}
                    onChange={(value) => setFormData({ ...formData, steps: value })}
                  />
                )}
              </div>

              {/* 温馨提示 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">温馨提示</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showTips}
                        onChange={(e) => setFormData({ ...formData, showTips: e.target.checked })}
                        className="w-4 h-4 text-[#b71c1c] rounded focus:ring-[#b71c1c]"
                      />
                      <span className="text-sm text-gray-600">显示此部分</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">显示标题</label>
                    <input
                      type="text"
                      value={formData.tipsTitle}
                      onChange={(e) => setFormData({ ...formData, tipsTitle: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                      placeholder="例如：温馨提示"
                    />
                  </div>
                </div>
                {formData.showTips && (
                  <TipsEditor
                    value={formData.tips}
                    onChange={(value) => setFormData({ ...formData, tips: value })}
                  />
                )}
              </div>

              {/* 文件上传 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">附件（支持多个）</h3>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableDownload}
                      onChange={(e) => setFormData({ ...formData, enableDownload: e.target.checked })}
                      className="w-4 h-4 text-[#b71c1c] rounded focus:ring-[#b71c1c]"
                    />
                    <span className="text-sm text-gray-600">允许下载附件</span>
                  </label>
                </div>
                {formData.enableDownload && (
                  <div className="mt-3">
                    <MultiFileUpload
                      uploadType="service"
                      attachments={formData.attachments}
                      onChange={(attachments) => setFormData({ 
                        ...formData, 
                        attachments,
                        fileUrl: attachments.length > 0 ? attachments[0].url : '',
                        fileName: attachments.length > 0 ? attachments[0].fileName : '',
                      })}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#b71c1c] text-white rounded-lg hover:bg-[#9a1616] transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} />
                      保存
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-[#1e2b3c]">服务列表</h2>
          <p className="text-sm text-gray-500 mt-1">共 {services.length} 个服务项目</p>
        </div>
        <div className="divide-y divide-gray-200">
          {services.map((service, index) => (
            <div key={service.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-medium text-[#1e2b3c]">{service.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveService(index, 'up')}
                    disabled={index === 0}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                    title="上移"
                  >
                    <FontAwesomeIcon icon={faArrowUp} />
                  </button>
                  <button
                    onClick={() => moveService(index, 'down')}
                    disabled={index === services.length - 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                    title="下移"
                  >
                    <FontAwesomeIcon icon={faArrowDown} />
                  </button>
                  <button
                    onClick={() => handleToggleActive(service)}
                    className={`p-2 ${service.isActive ? 'text-green-500' : 'text-gray-400'} hover:opacity-80 transition-colors`}
                    title={service.isActive ? '隐藏' : '显示'}
                  >
                    <FontAwesomeIcon icon={service.isActive ? faToggleOn : faToggleOff} />
                  </button>
                  <button
                    onClick={() => {
                      handleEdit(service);
                      setShowModal(true);
                    }}
                    className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                    title="编辑"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors"
                    title="删除"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Card */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
          管理提示
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>点击&quot;添加服务&quot;创建新的办事服务项目</li>
          <li>每个服务包含四个可独立控制的部分：服务介绍、评选条件、申报流程、温馨提示</li>
          <li>可以通过开关控制每个部分是否在前台显示</li>
          <li>使用箭头按钮调整服务在前台的显示顺序</li>
          <li>点击开关按钮可显示或隐藏服务</li>
          <li>所有富文本内容支持图片上传和预览功能</li>
        </ul>
      </div>
    </div>
  );
}
