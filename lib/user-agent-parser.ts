/**
 * 客户端信息解析工具
 * 从请求中提取 IP 地址、操作系统、浏览器、设备类型等信息
 */

/**
 * 获取客户端真实 IP 地址（支持代理环境）
 */
export function getClientIp(request: Request): string {
  // 尝试从常见的代理头中获取 IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // 取第一个 IP（客户端真实 IP）
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // 如果没有代理头，返回 unknown
  return 'unknown';
}

/**
 * 解析操作系统信息
 */
export function parseOS(userAgent: string | null): string {
  if (!userAgent) return 'Unknown';

  const ua = userAgent.toLowerCase();

  // Windows
  if (ua.includes('windows nt')) {
    const version = ua.match(/windows nt (\d+\.\d+)/);
    if (version) {
      const versionMap: Record<string, string> = {
        '10.0': 'Windows 10',
        '6.3': 'Windows 8.1',
        '6.2': 'Windows 8',
        '6.1': 'Windows 7',
      };
      return versionMap[version[1]] || 'Windows';
    }
    return 'Windows';
  }

  // macOS
  if (ua.includes('mac os x')) {
    const version = ua.match(/mac os x (\d+[._]\d+)/);
    if (version) {
      return `macOS ${version[1].replace('_', '.')}`;
    }
    return 'macOS';
  }

  // Linux
  if (ua.includes('linux')) {
    return 'Linux';
  }

  // iOS
  if (ua.includes('iphone') || ua.includes('ipad')) {
    const version = ua.match(/os (\d+_\d+)/);
    if (version) {
      return `iOS ${version[1].replace('_', '.')}`;
    }
    return 'iOS';
  }

  // Android
  if (ua.includes('android')) {
    const version = ua.match(/android (\d+\.\d+)/);
    if (version) {
      return `Android ${version[1]}`;
    }
    return 'Android';
  }

  return 'Unknown';
}

/**
 * 解析浏览器信息
 */
export function parseBrowser(userAgent: string | null): string {
  if (!userAgent) return 'Unknown';

  const ua = userAgent;

  // Edge (在 Chrome 之前检测)
  if (ua.includes('Edg/') || ua.includes('Edge/')) {
    const match = ua.match(/Edg\/(\d+\.\d+)/) || ua.match(/Edge\/(\d+\.\d+)/);
    return match ? `Edge ${match[1]}` : 'Edge';
  }

  // Chrome
  if (ua.includes('Chrome/') && !ua.includes('Chromium')) {
    const match = ua.match(/Chrome\/(\d+\.\d+)/);
    return match ? `Chrome ${match[1]}` : 'Chrome';
  }

  // Firefox
  if (ua.includes('Firefox/')) {
    const match = ua.match(/Firefox\/(\d+\.\d+)/);
    return match ? `Firefox ${match[1]}` : 'Firefox';
  }

  // Safari (在 Chrome 之后检测)
  if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/(\d+\.\d+)/);
    return match ? `Safari ${match[1]}` : 'Safari';
  }

  // IE
  if (ua.includes('MSIE') || ua.includes('Trident/')) {
    return 'Internet Explorer';
  }

  return 'Unknown';
}

/**
 * 解析设备类型
 */
export function parseDevice(userAgent: string | null): string {
  if (!userAgent) return 'Desktop';

  const ua = userAgent.toLowerCase();

  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    return 'Mobile';
  }

  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'Tablet';
  }

  return 'Desktop';
}

/**
 * 解析客户端信息（综合函数）
 */
export function parseClientInfo(request: Request) {
  const userAgent = request.headers.get('user-agent');
  const ipAddress = getClientIp(request);
  const os = parseOS(userAgent);
  const browser = parseBrowser(userAgent);
  const device = parseDevice(userAgent);

  return {
    ipAddress,
    userAgent: userAgent || '',
    os,
    browser,
    device,
  };
}
