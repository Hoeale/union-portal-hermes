/**
 * API Client
 * 
 * 统一封装API调用，自动处理CSRF token和错误处理
 * 支持 CSRF token 过期自动刷新重试
 */

import { ApiResponse } from '@/lib/types';

interface RequestConfig {
  csrfToken?: string;
  headers?: Record<string, string>;
}

/**
 * 从 cookie 中读取 CSRF token
 * 注意：浏览器环境中 document.cookie 可直接读取
 */
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null; // 服务端环境
  }
  
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? match[1] : null;
}

/**
 * 更新 cookie 中的 CSRF token
 */
function updateCsrfTokenCookie(token: string): void {
  if (typeof document === 'undefined') {
    return; // 服务端环境
  }
  
  // 设置 cookie，max-age=3600 与后端保持一致
  document.cookie = `csrf_token=${token}; path=/; max-age=3600; SameSite=Lax`;
}

/**
 * 检查是否为 CSRF 相关错误
 */
function isCsrfError(error: string): boolean {
  return typeof error === 'string' && error.toLowerCase().includes('csrf');
}

/**
 * 刷新 CSRF token
 */
async function refreshCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/admin/csrf-token/', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.warn('[API Client] CSRF token 刷新失败:', response.status);
      return null;
    }
    
    const data = await response.json();
    const newToken = data.token;
    
    if (newToken) {
      // 更新本地 cookie
      updateCsrfTokenCookie(newToken);
      return newToken;
    }
    
    return null;
  } catch (error) {
    console.warn('[API Client] CSRF token 刷新异常:', error);
    return null;
  }
}

/**
 * 执行带 CSRF 重试的请求
 * @param executor 原始请求执行函数
 * @param url 请求 URL
 * @param body 请求体（可选）
 * @param config 请求配置
 * @param isRetry 是否已是重试请求
 */
async function executeWithCsrfRetry<T>(
  executor: (token: string | undefined) => Promise<ApiResponse<T>>,
  url: string,
  body?: unknown,
  config: RequestConfig = {},
  isRetry = false
): Promise<ApiResponse<T>> {
  try {
    return await executor(config.csrfToken);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 仅在非重试状态下尝试 CSRF 刷新
    if (!isRetry && isCsrfError(errorMessage)) {
      console.log('[API Client] 检测到 CSRF token 过期，尝试自动刷新...');
      
      const newToken = await refreshCsrfToken();
      
      if (newToken) {
        console.log('[API Client] CSRF token 刷新成功，重试原请求...');
        // 使用新 token 重试
        const retryConfig = { ...config, csrfToken: newToken };
        return executeWithCsrfRetry(executor, url, body, retryConfig, true);
      } else {
        console.warn('[API Client] CSRF token 刷新失败，放弃重试');
      }
    }
    
    // 重试后仍失败，或非 CSRF 错误，抛出原错误
    throw error;
  }
}

/**
 * GET 请求
 */
export async function get<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include', // 发送 session cookie
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * POST 请求（支持 CSRF 自动重试）
 */
export async function post<T>(
  url: string,
  data: unknown,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  return executeWithCsrfRetry<T>(
    async (csrfToken) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers,
      };

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include', // 允许发送和接收 cookie
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      return result;
    },
    url,
    data,
    config
  );
}

/**
 * PUT 请求（支持 CSRF 自动重试）
 */
export async function put<T>(
  url: string,
  data: unknown,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  return executeWithCsrfRetry<T>(
    async (csrfToken) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers,
      };

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        credentials: 'include', // 允许发送和接收 cookie
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      return result;
    },
    url,
    data,
    config
  );
}

/**
 * PATCH 请求（支持 CSRF 自动重试）
 */
export async function patch<T>(
  url: string,
  data: unknown,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  return executeWithCsrfRetry<T>(
    async (csrfToken) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers,
      };

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
        credentials: 'include', // 允许发送和接收 cookie
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      return result;
    },
    url,
    data,
    config
  );
}

/**
 * DELETE 请求（支持 CSRF 自动重试）
 */
export async function del<T>(
  url: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  return executeWithCsrfRetry<T>(
    async (csrfToken) => {
      const headers: Record<string, string> = {
        ...config.headers,
      };

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        credentials: 'include', // 允许发送和接收 cookie
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      return result;
    },
    url,
    undefined,
    config
  );
}

/**
 * 上传文件（支持 CSRF 自动重试）
 */
export async function uploadFile(
  url: string,
  formData: FormData,
  config: RequestConfig = {}
): Promise<ApiResponse<{ url: string }>> {
  return executeWithCsrfRetry<{ url: string }>(
    async (csrfToken) => {
      const headers: Record<string, string> = {
        ...config.headers,
      };

      // 不要设置 Content-Type，让浏览器自动设置
      delete headers['Content-Type'];

      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include', // 允许发送和接收 cookie
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      return result;
    },
    url,
    undefined,
    config
  );
}

// 导出默认对象
export const apiClient = {
  get,
  post,
  put,
  patch,
  delete: del,
  uploadFile,
};

export default apiClient;
