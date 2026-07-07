/**
 * API 响应类型定义
 * 统一的 API 响应格式
 */

// 基础响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

// 分页响应类型
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 错误响应类型
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

// 成功响应类型
export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// 列表查询参数
export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, string | string[]>;
}

// 新闻相关类型
export interface NewsItem {
  id: string;
  title: string;
  category: string | null;
  content: string;
  imageUrl: string | null;
  isCarousel: boolean;
  isNotice: boolean;
  publishedAt: string;
  status: 'pending' | 'published';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewsListResponse {
  items: NewsItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 政策相关类型
export interface PolicyItem {
  id: string;
  title: string;
  category: string;
  publishDate: string;
  source: string;
  fileUrl: string | null;
  content: string;
  isActive: boolean;
  status: 'pending' | 'published';
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyListResponse {
  items: PolicyItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 服务相关类型
export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  process: string;
  requirements: string;
  isActive: boolean;
  orderIndex: number;
  enableDownload: boolean;
  fileName: string | null;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceListResponse {
  items: ServiceItem[];
  total: number;
}

// 反馈相关类型
export interface FeedbackItem {
  id: string;
  name: string;
  contact: string;
  content: string;
  isRead: boolean;
  isPublic: boolean;
  category: string | null;
  status: 'unread' | 'read' | 'processing' | 'resolved';
  reply: string | null;
  replyBy: string | null;
  replyAt: string | null;
  createdAt: string;
}

export interface FeedbackListResponse {
  items: FeedbackItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 管理员相关类型
export interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'editor' | 'reviewer';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminSession {
  adminId: string;
  username: string;
  role: string;
  createdAt: number;
}

// 统计数据类型
export interface DashboardStats {
  totalNews: number;
  totalPolicies: number;
  totalServices: number;
  totalFeedbacks: number;
  totalPageViews: number;
  todayPageViews: number;
  pendingReviews: number;
  unreadFeedbacks: number;
}

export interface PageViewStats {
  date: string;
  count: number;
}

export interface ContentStats {
  type: string;
  count: number;
  trend: number;
}

// 文件上传响应
export interface UploadResponse {
  success: boolean;
  url: string;
  filename: string;
  size: number;
  type: string;
}

// 导出响应
export interface ExportResponse {
  success: boolean;
  downloadUrl: string;
  filename: string;
  expiresAt: string;
}

// 搜索响应
export interface SearchResult {
  id: string;
  title: string;
  type: 'news' | 'policy' | 'service';
  excerpt: string;
  url: string;
  createdAt: string;
}

export interface SearchResponse {
  items: SearchResult[];
  total: number;
  query: string;
  suggestions?: string[];
}

// 通知类型
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'feedback' | 'schedule' | 'content_expired' | 'system';
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unreadCount: number;
}

// 类型守卫函数
export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

export function isErrorResponse(response: ApiResponse<unknown>): response is ErrorResponse {
  return response.success === false;
}

export function isPaginatedResponse<T>(response: ApiResponse<T[]>): response is PaginatedResponse<T> {
  return response.success === true && response.meta !== undefined && 'total' in response.meta;
}
