'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCsrfToken, logger } from '@/hooks';
import { apiClient } from '@/lib/api-client';

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
  color: string | null;
  newsCount?: number;
}

export type NewsStatusFilter = 'all' | 'pending' | 'published';

export function useNewsManagement() {
  const router = useRouter();
  const csrfToken = useCsrfToken();

  const [news, setNews] = useState<News[]>([]);
  const [filteredNews, setFilteredNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<NewsStatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [carouselModalOpen, setCarouselModalOpen] = useState(false);
  const [carouselNews, setCarouselNews] = useState<News[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 分类管理弹窗
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#b71c1c');

  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalAllNews, setTotalAllNews] = useState(0);

  // 批量选择
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 统计数据
  const [totalCarousel, setTotalCarousel] = useState(0);
  const [totalByCategory, setTotalByCategory] = useState<{ dynamic: number; notice: number; announcement: number; carousel: number }>({ dynamic: 0, notice: 0, announcement: 0, carousel: 0 });

  // CSRF 请求头辅助函数
  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
    return headers;
  };

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/news-categories');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setCategories(result.data);
      }
    } catch (error) {
      logger.error('Failed to fetch categories:', error);
    }
  };

  // 创建新分类
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('请输入分类名称');
      return;
    }
    if (!csrfToken) {
      alert('安全令牌未获取，请刷新页面重试');
      return;
    }
    try {
      const response = await fetch('/api/admin/news-categories/', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: newCategoryName.trim(),
          color: newCategoryColor,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setNewCategoryName('');
        setNewCategoryColor('#b71c1c');
        await fetchCategories();
        alert('分类创建成功');
      } else {
        alert(result.error || '创建失败');
      }
    } catch (error) {
      logger.error('Failed to create category:', error);
      alert('创建失败');
    }
  };

  // 删除分类
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`确定要删除分类"${name}"吗？该分类下的新闻将移至"未分类"。`)) {
      return;
    }
    if (!csrfToken) {
      alert('安全令牌未获取，请刷新页面重试');
      return;
    }
    try {
      const response = await fetch(`/api/admin/news-categories?id=${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const result = await response.json();
      if (result.success) {
        await fetchCategories();
        alert(result.message || '分类已删除');
      } else {
        alert(result.error || '删除失败');
      }
    } catch (error) {
      logger.error('Failed to delete category:', error);
      alert('删除失败');
    }
  };

  // Fetch news
  const fetchNews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (statusFilter === 'pending' || statusFilter === 'published') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/admin/news?${params}`);
      const result = await response.json();

      if (result.success) {
        setNews(result.data);
        setFilteredNews(result.data);
        setTotalPages(result.totalPages);
        setTotal(result.total);
        // 当无筛选条件时，更新总数（用于统计卡片始终显示真实总数）
        if (categoryFilter === 'all' && !searchTerm && statusFilter === 'all') {
          setTotalAllNews(result.total);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch category stats
  const fetchStats = async () => {
    try {
      const [totalRes, dynamicRes, noticeRes, announcementRes, carouselRes] = await Promise.all([
        fetch('/api/admin/news?page=1&pageSize=1'),
        fetch('/api/admin/news?category=动态&page=1&pageSize=1'),
        fetch('/api/admin/news?category=通知&page=1&pageSize=1'),
        fetch('/api/admin/news?category=公告&page=1&pageSize=1'),
        fetch('/api/admin/news?page=1&pageSize=100'),
      ]);
      const [totalResult, dynamicResult, noticeResult, announcementResult, carouselResult] = await Promise.all([
        totalRes.json(),
        dynamicRes.json(),
        noticeRes.json(),
        announcementRes.json(),
        carouselRes.json(),
      ]);

      if (totalResult.success) {
        setTotalAllNews(totalResult.total);
      }

      const carouselCount = carouselResult.success
        ? Math.min(carouselResult.data.filter((n: News) => n.is_carousel && n.status === 'published').length, 5)
        : 0;
      setTotalCarousel(carouselCount);

      setTotalByCategory({
        dynamic: dynamicResult.success ? dynamicResult.total : 0,
        notice: noticeResult.success ? noticeResult.total : 0,
        announcement: announcementResult.success ? announcementResult.total : 0,
        carousel: carouselCount,
      });
    } catch (error) {
      logger.error('Failed to fetch stats:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!csrfToken) {
      alert('安全令牌未获取，请刷新页面重试');
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`/api/admin/news?id=${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setDeleteConfirm(null);
        fetchNews();
        alert('删除成功！');
      } else {
        alert(result.error || '删除失败');
      }
    } catch (error: unknown) {
      logger.error('Failed to delete news:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        alert('请求超时，请检查网络连接');
      } else {
        const message = error instanceof Error ? error.message : '未知错误';
        alert('删除失败：' + message);
      }
    }
  };

  // Handle preview
  const handlePreview = (id: string) => {
    window.open(`/preview/news/${id}`, '_blank');
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchNews();
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle filter change
  const handleFilterChange = (category: string) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  // 批量选择处理
  const handleSelectAll = () => {
    if (selectedIds.length === filteredNews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNews.map(n => n.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchActionComplete = () => {
    setSelectedIds([]);
    fetchNews();
  };

  // Effects
  useEffect(() => {
    fetchNews();
  }, [statusFilter, currentPage, categoryFilter]);

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, []);

  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, categoryFilter, statusFilter]);

  // 打开轮播排序弹窗
  const openCarouselModal = async () => {
    try {
      const response = await fetch('/api/admin/news?page=1&pageSize=100');
      const result = await response.json();
      if (result.success) {
        const carouselItems = result.data
          .filter((n: News) => n.is_carousel && n.status === 'published')
          .sort((a: News, b: News) => (a.carousel_order || 0) - (b.carousel_order || 0));

        let finalCarouselItems = carouselItems;

        if (carouselItems.length > 5) {
          const itemsToKeep = carouselItems.slice(0, 5);
          const itemsToDisable = carouselItems.slice(5);

          // 批量禁用超出限制的轮播图 - 优化 N+1 查询
          await fetch('/api/admin/news/batch-action/', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              action: 'unset_carousel',
              ids: itemsToDisable.map((item: News) => item.id),
            }),
          });

          finalCarouselItems = itemsToKeep;
        }

        // 批量更新轮播排序 - 优化 N+1 查询
        const sortedItems = finalCarouselItems.slice(0, 5).map((item: News, index: number) => ({
          id: item.id,
          carouselOrder: index,
        }));

        if (sortedItems.length > 0) {
          await fetch('/api/admin/news/batch-carousel-order/', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ items: sortedItems }),
          });
        }

        // 重新获取更新后的数据
        const updatedResponse = await fetch('/api/admin/news?page=1&pageSize=100');
        const updatedResult = await updatedResponse.json();
        if (updatedResult.success) {
          const updatedCarouselItems = updatedResult.data
            .filter((n: News) => n.is_carousel && n.status === 'published')
            .sort((a: News, b: News) => (a.carousel_order || 0) - (b.carousel_order || 0));
          setCarouselNews(updatedCarouselItems.slice(0, 5));
        }

        setCarouselModalOpen(true);
      }
    } catch (error) {
      logger.error('Failed to fetch carousel news:', error);
    }
  };

  // 自动排序轮播图
  const autoSortCarouselNews = async () => {
    const sorted = [...carouselNews]
      .sort((a, b) => (a.carousel_order || 0) - (b.carousel_order || 0))
      .map((item, index) => ({ id: item.id, carouselOrder: index }));

    // 批量更新排序 - 优化 N+1 查询
    try {
      await fetch('/api/admin/news/batch-carousel-order/', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ items: sorted }),
      });

      // 更新本地状态
      const updatedCarouselNews = carouselNews
        .sort((a, b) => (a.carousel_order || 0) - (b.carousel_order || 0))
        .map((item, index) => ({ ...item, carousel_order: index }));
      setCarouselNews(updatedCarouselNews);
      fetchNews();
    } catch (error) {
      logger.error('Failed to auto sort carousel:', error);
    }
  };

  // 更新轮播排序 - 使用批量 API 优化
  const updateCarouselOrder = async (id: string, order: number) => {
    try {
      // 构建所有项目的排序数据
      const updatedItems = carouselNews.map(item => ({
        id: item.id,
        carouselOrder: item.id === id ? order : item.carousel_order,
      }));

      // 批量更新 - 优化 N+1 查询
      const response = await fetch('/api/admin/news/batch-carousel-order', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ items: updatedItems }),
      });
      const result = await response.json();
      if (result.success) {
        setCarouselNews(prev =>
          prev.map(n => n.id === id ? { ...n, carousel_order: order } : n)
            .sort((a, b) => (a.carousel_order || 0) - (b.carousel_order || 0))
        );
        fetchNews();
      }
    } catch (error) {
      logger.error('Failed to update carousel order:', error);
    }
  };

  // 处理发布
  const handlePublish = async (id: string) => {
    if (!confirm('确定要发布这条新闻吗？发布后将在前台显示。')) return;

    if (!csrfToken) {
      alert('安全令牌未获取，请刷新页面重试');
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/admin/news/', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ id, status: 'published' }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        fetchNews();
        alert('发布成功！');
      } else {
        alert(result.error || '发布失败');
      }
    } catch (error: unknown) {
      logger.error('Failed to publish:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        alert('请求超时，请检查网络连接');
      } else {
        const message = error instanceof Error ? error.message : '未知错误';
        alert('发布失败：' + message);
      }
    }
  };

  // Handle unpublish (撤回已发布的文章)
  const handleUnpublish = async (id: string) => {
    if (!confirm('确定要撤回这条新闻吗？撤回后将变为待发布状态，前台不再显示。')) return;

    if (!csrfToken) {
      alert('安全令牌未获取，请刷新页面重试');
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/admin/news/', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ id, status: 'pending' }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        fetchNews();
        alert('已撤回，新闻已变为待发布状态');
      } else {
        alert(result.error || '撤回失败');
      }
    } catch (error: unknown) {
      logger.error('Failed to unpublish:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        alert('请求超时，请检查网络连接或刷新页面重试');
      } else {
        const message = error instanceof Error ? error.message : '未知错误';
        alert('撤回失败：' + message);
      }
    }
  };

  // 处理通知切换
  const handleToggleNotice = async (id: string, currentIsNotice: boolean | undefined) => {
    if (!csrfToken) {
      alert('安全令牌未获取，请刷新页面重试');
      return;
    }
    const newIsNotice = !currentIsNotice;
    try {
      const response = await fetch('/api/admin/news/', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ id, is_notice: newIsNotice }),
      });
      if (response.ok) {
        fetchNews();
      } else {
        alert('更新失败');
      }
    } catch (error) {
      logger.error('Failed to toggle notice:', error);
      alert('更新失败');
    }
  };

  return {
    // State
    news,
    filteredNews,
    categories,
    categoryFilter,
    statusFilter,
    loading,
    carouselModalOpen,
    carouselNews,
    deleteConfirm,
    categoryModalOpen,
    newCategoryName,
    newCategoryColor,
    searchTerm,
    currentPage,
    pageSize,
    totalPages,
    total,
    totalAllNews,
    selectedIds,
    totalCarousel,
    totalByCategory,
    csrfToken,

    // Setters
    setCategoryFilter,
    setStatusFilter,
    setCarouselModalOpen,
    setCarouselNews,
    setDeleteConfirm,
    setCategoryModalOpen,
    setNewCategoryName,
    setNewCategoryColor,
    setSearchTerm,
    setCurrentPage,
    setSelectedIds,

    // Actions
    fetchNews,
    fetchCategories,
    fetchStats,
    handleCreateCategory,
    handleDeleteCategory,
    handleDelete,
    handlePreview,
    handlePublish,
    handleUnpublish,
    handleToggleNotice,
    openCarouselModal,
    autoSortCarouselNews,
    updateCarouselOrder,
    handleSearch,
    handlePageChange,
    handleFilterChange,
    handleSelectAll,
    handleSelectOne,
    handleBatchActionComplete,
    getHeaders,
    router,
  };
}
