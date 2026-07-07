'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * CSRF Token Hook
 * 
 * 用于在后台管理页面获取CSRF token
 * 
 * @example
 * const csrfToken = useCsrfToken();
 * 
 * fetch('/api/admin/news', {
 *   method: 'PUT',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'x-csrf-token': csrfToken,
 *   },
 *   body: JSON.stringify(data),
 * });
 */
export function useCsrfToken(): string {
  const [csrfToken, setCsrfToken] = useState('');

  // 刷新 CSRF Token
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/csrf-token/', {
        credentials: 'include', // 确保 cookie 能正确传递
      });
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      const data = await response.json();
      if (data.token) {
        setCsrfToken(data.token);
        return data.token;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch CSRF token:', error);
      }
    }
    return null;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/admin/csrf-token/', {
          credentials: 'include', // 确保 cookie 能正确传递
        });
        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token');
        }
        const data = await response.json();
        if (isMounted && data.token) {
          setCsrfToken(data.token);
        }
      } catch (error) {
        // Silent fail - token will be empty and requests will fail with proper error
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Failed to fetch CSRF token:', error);
        }
      }
    };

    fetchCsrfToken();

    return () => {
      isMounted = false;
    };
  }, []);

  return csrfToken;
}

export default useCsrfToken;
