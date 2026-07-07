'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';

interface Step {
  order: number;
  title: string;
  description: string;
}

interface StepsEditorProps {
  value: string; // JSON string
  onChange: (value: string) => void;
}

export default function StepsEditor({ value, onChange }: StepsEditorProps) {
  const [steps, setSteps] = useState<Step[]>(() => {
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
      setSteps(parsed);
    } catch {
      setSteps([]);
    }
  }, [value]);

  const updateSteps = (newSteps: Step[]) => {
    // 重新计算序号
    const renumbered = newSteps.map((step, index) => ({
      ...step,
      order: index + 1
    }));
    setSteps(renumbered);
    onChange(JSON.stringify(renumbered));
  };

  const addStep = () => {
    updateSteps([...steps, { order: steps.length + 1, title: '', description: '' }]);
  };

  const removeStep = (index: number) => {
    updateSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof Step, fieldValue: string | number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: fieldValue };
    updateSteps(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    
    const newSteps = [...steps];
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    updateSteps(newSteps);
  };

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 gradient-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                {step.order}
              </div>
              <span className="text-sm font-medium text-gray-700">步骤 {step.order}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveStep(index, 'up')}
                disabled={index === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faArrowUp} className="text-sm" />
              </button>
              <button
                type="button"
                onClick={() => moveStep(index, 'down')}
                disabled={index === steps.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faArrowDown} className="text-sm" />
              </button>
              <button
                type="button"
                onClick={() => removeStep(index)}
                className="p-1 text-red-400 hover:text-red-600"
              >
                <FontAwesomeIcon icon={faTrash} className="text-sm" />
              </button>
            </div>
          </div>
          
          <div className="space-y-3 ml-11">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">标题</label>
              <input
                type="text"
                value={step.title}
                onChange={(e) => updateStep(index, 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                placeholder="例如：打开地图"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">描述</label>
              <textarea
                value={step.description}
                onChange={(e) => updateStep(index, 'description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#b71c1c] focus:border-transparent"
                placeholder="例如：进入工会地图功能"
              />
            </div>
          </div>
        </div>
      ))}
      
      <button
        type="button"
        onClick={addStep}
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#b71c1c] hover:text-[#b71c1c] transition-colors w-full justify-center"
      >
        <FontAwesomeIcon icon={faPlus} />
        添加流程步骤
      </button>
      
      {steps.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          点击上方按钮添加流程步骤
        </p>
      )}
    </div>
  );
}
