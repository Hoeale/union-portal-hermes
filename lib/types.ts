// 管理员登录日志接口
export interface LoginLog {
  id: string;
  username: string;
  adminId: string | null;
  ipAddress: string;
  userAgent: string | null;
  os: string;
  browser: string;
  device: string;
  loginType: 'success' | 'failed';
  failureReason: string | null;
  loginAt: string;
}

// 游客访问日志接口
export interface VisitorLog {
  id: string;
  url: string;
  title: string | null;
  ip: string;
  userAgent: string | null;
  deviceType: string;
  referer: string | null;
  createdAt: string;
}

// 操作日志接口
export interface OperationLog {
  id: string;
  adminId: string;
  adminName: string;
  module: string;
  action: string;
  targetId: string | null;
  targetType: string | null;
  targetTitle: string | null;
  details: string | null;
  ipAddress: string;
  userAgent: string | null;
  os: string;
  browser: string;
  device: string;
  createdAt: string;
}

// 登录日志子标签类型
export type LogSubTabType = 'admin' | 'visitor';

// ==================== 新闻管理类型 ====================

export interface News {
  id: string;
  title: string;
  category: string;
  content: string;
  image_url: string | null;
  image_source_type?: 'local' | 'external';
  is_carousel: boolean;
  carousel_order: number | null;
  is_notice?: boolean;
  status: 'pending' | 'published';
  publish_status?: 'immediate' | 'scheduled';
  scheduled_publish_at?: string | null;
  published_at: string;
  created_at: string;
}

export interface Draft {
  id: string;
  title: string;
  category: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  order_index: number;
  is_active: boolean;
  newsCount?: number;
}

// ==================== 政策文件类型 ====================

export interface Policy {
  id: string;
  title: string;
  category: string;
  publishDate: string;
  source: string;
  fileUrl: string | null;
  fileName: string | null;
  enableDownload: boolean;
  content: string;
  isActive: boolean;
  status: 'pending' | 'published';
  orderIndex: number;
}

// ==================== 视频管理类型 ====================

export interface Video {
  id: string;
  title: string;
  category: string;
  description: string | null;
  source_type: string;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  file_size: number | null;
  is_active: boolean;
  view_count: number;
  order_index: number;
}

// ==================== 反馈管理类型 ====================

export interface Feedback {
  id: string;
  name: string;
  contact: string;
  content: string;
  isPublic: boolean;
  isRead: boolean;
  isReplied: boolean;
  replyContent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackComment {
  id: string;
  feedbackId: string;
  adminId: string;
  adminName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

// ==================== 通知类型 ====================

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'news' | 'feedback';
  isRead: boolean;
  createdAt: string;
}

// ==================== 友情链接类型 ====================

export interface FriendlyLink {
  id: string;
  title: string;
  url: string;
  is_required: boolean;
  order_index: number;
}

// ==================== 站点配置类型 ====================

export interface SiteInfo {
  address: string;
  phone: string;
}

export interface FooterConfig {
  organization_name: string;
  organization_name_en: string;
  organization_description: string;
  logo_url: string;
  contact_email: string;
  contact_email_label: string;
  copyright_text: string;
  copyright_show_year: boolean;
  copyright_reserved: string;
  show_footer: boolean;
  show_friendly_links: boolean;
  privacy_policy_url: string;
  terms_url: string;
  sitemap_url: string;
  show_privacy_policy: boolean;
  show_terms: boolean;
  show_sitemap: boolean;
}

// ==================== 服务管理类型 ====================

export interface Service {
  id: string;
  title: string;
  icon: string;
  description: string;
  process: string;
  requirements: string;
  deadline: string;
  contact: string;
  order_index: number;
  is_active: boolean;
}

// ==================== 劳动者类型 ====================

export interface Worker {
  id: string;
  name: string;
  title: string;
  department: string;
  description: string;
  image_url: string | null;
  order_index: number;
  is_active: boolean;
}

// ==================== 通用响应类型 ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
