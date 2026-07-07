import useSWR, { SWRConfiguration } from 'swr';

// 通用的 fetcher 函数
const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching data');
    (error as any).status = res.status;
    throw error;
  }
  
  return res.json();
};

// 默认 SWR 配置
export const defaultSWRConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1分钟内去重
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  keepPreviousData: true,
};

// 创建自定义 hook 的工厂函数
export function createSWRHook<T>(key: string | null, config?: SWRConfiguration) {
  return function useData() {
    return useSWR<T>(key, {
      ...defaultSWRConfig,
      ...config,
    });
  };
}

// 导出 fetcher 供 LayoutConfigContext 等其他地方使用
export { fetcher };

// 导出 useSWR 供直接使用
export { useSWR };

export default useSWR;
