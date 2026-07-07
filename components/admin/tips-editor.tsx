'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';

interface TipsEditorProps {
  value: string; // JSON string array
  onChange: (value: string) => void;
}

export default function TipsEditor({ value, onChange }: TipsEditorProps) {
  const [tips, setTips] = useState<string[]>(() => {
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
      setTips(parsed);
    } catch {
      setTips([]);
    }
  }, [value]);

  const updateTips = (newTips: string[]) => {
    setTips(newTips);
    onChange(JSON.stringify(newTips));
  };

  const addTip = () => {
    updateTips([...tips, '']);
  };

  const removeTip = (index: number) => {
    updateTips(tips.filter((_, i) => i !== index));
  };

  const updateTip = (index: number, tipText: string) => {
    const newTips = [...tips];
    newTips[index] = tipText;
    updateTips(newTips);
  };

  const moveTip = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tips.length) return;
    
    const newTips = [...tips];
    [newTips[index], newTips[targetIndex]] = [newTips[targetIndex], newTips[index]];
    updateTips(newTips);
  };

  return (
    <div className="space-y-3">
      {tips.map((tip, index) => (
        <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-yellow-700">提示 {index + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveTip(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-yellow-600 hover:text-yellow-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faArrowUp} className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => moveTip(index, 'down')}
                  disabled={index === tips.length - 1}
                  className="p-1 text-yellow-600 hover:text-yellow-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faArrowDown} className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => removeTip(index)}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              </div>
            </div>
            <input
              type="text"
              value={tip}
              onChange={(e) => updateTip(index, e.target.value)}
              className="w-full px-3 py-2 border border-yellow-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="输入提示内容..."
            />
          </div>
        </div>
      ))}
      
      <button
        type="button"
        onClick={addTip}
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-yellow-300 rounded-lg text-yellow-600 hover:border-yellow-500 hover:text-yellow-700 transition-colors w-full justify-center bg-yellow-50/50"
      >
        <FontAwesomeIcon icon={faPlus} />
        添加温馨提示
      </button>
      
      {tips.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          点击上方按钮添加温馨提示
        </p>
      )}
    </div>
  );
}
