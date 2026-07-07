'use client';

import { useState, useCallback } from 'react';

export type MessageType = 'success' | 'error' | 'info' | 'warning';

export interface Message {
  type: MessageType;
  text: string;
  duration?: number;
}

/**
 * 消息通知 Hook
 * 
 * 提供统一的消息显示和自动隐藏功能
 * 
 * @example
 * const { message, showMessage, clearMessage } = useMessage();
 * 
 * showMessage('success', '操作成功');
 * showMessage('error', '操作失败', 5000); // 5秒后消失
 */
export function useMessage(defaultDuration = 3000) {
  const [message, setMessage] = useState<Message | null>(null);

  const showMessage = useCallback((
    type: MessageType,
    text: string,
    duration = defaultDuration
  ) => {
    setMessage({ type, text, duration });
    
    if (duration > 0) {
      setTimeout(() => {
        setMessage(null);
      }, duration);
    }
  }, [defaultDuration]);

  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  return {
    message,
    showMessage,
    clearMessage,
  };
}

export default useMessage;
