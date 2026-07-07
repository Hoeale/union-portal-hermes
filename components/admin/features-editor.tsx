'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';

interface Feature {
  title: string;
  description: string;
  color: string;
}

interface FeaturesEditorProps {
  value: string; // JSON string
  onChange: (value: string) => void;
}

const COLOR_OPTIONS = [
  { value: 'blue', label: '蓝色', bg: 'bg-blue-50', border: 'border-blue-200' },
  { value: 'green', label: '绿色', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 'orange', label: '橙色', bg: 'bg-orange-50', border: 'border-orange-200' },
  { value: 'purple', label: '紫色', bg: 'bg-purple-50', border: 'border-purple-200' },
  { value: 'pink', label: '粉色', bg: 'bg-pink-50', border: 'border-pink-200' },
  { value: 'indigo', label: '靛蓝', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { value: 'red', label: '红色', bg: 'bg-red-50', border: 'border-red-200' },
];

export default function FeaturesEditor({ value, onChange }: FeaturesEditorProps) {
  const [features, setFeatures] = useState<Feature[]>(() => {
    try {
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  });

  // 当外部 value 变化时同步更新（如点击编辑按钮加载数据）
  useEffect(() => {
    try {
      const parsed = value ? JSON.parse(value) : [];
      setFeatures(parsed);
    } catch {
      setFeatures([]);
    }
  }, [value]);

  const updateFeatures = (newFeatures: Feature[]) => {
    setFeatures(newFeatures);
    onChange(JSON.stringify(newFeatures));
  };

  const addFeature = () => {
    updateFeatures([...features, { title: '', description: '', color: 'blue' }]);
  };

  const removeFeature = (index: number) => {
    updateFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: keyof Feature, fieldValue: string) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: fieldValue };
    updateFeatures(newFeatures);
  };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= features.length) return;
    
    const newFeatures = [...features];
    [newFeatures[index], newFeatures[targetIndex]] = [newFeatures[targetIndex], newFeatures[index]];
    updateFeatures(newFeatures);
  };

  return (
    <div className="space-y-4">
      {features.map((feature, index) => {
        const colorOption = COLOR_OPTIONS.find(c => c.value === feature.color) || COLOR_OPTIONS[0];
        return (
          <div key={index} className={`p-4 rounded-lg border ${colorOption.border} ${colorOption.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">特点 {index + 1}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveFeature(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faArrowUp} className="text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => moveFeature(index, 'down')}
                  disabled={index === features.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faArrowDown} className="text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-sm" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">标题</label>
                <input
                  type="text"
                  value={feature.title}
                  onChange={(e) => updateFeature(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  placeholder="例如：查找工会"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">描述</label>
                <textarea
                  value={feature.description}
                  onChange={(e) => updateFeature(index, 'description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                  placeholder="例如：根据您的位置，查找附近的工会组织"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">颜色主题</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => updateFeature(index, 'color', color.value)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        feature.color === color.value
                          ? `${color.bg} ${color.border} ring-2 ring-[#b71c1c]`
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      <button
        type="button"
        onClick={addFeature}
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#b71c1c] hover:text-[#b71c1c] transition-colors w-full justify-center"
      >
        <FontAwesomeIcon icon={faPlus} />
        添加服务特点
      </button>
      
      {features.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          点击上方按钮添加服务特点
        </p>
      )}
    </div>
  );
}
