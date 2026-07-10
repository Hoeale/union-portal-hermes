'use client';

import { useRouter } from 'next/navigation';
import { useNewsManagement } from '@/hooks/useNewsManagement';
import {
  NewsStats,
  NewsFilters,
  NewsList,
  CarouselModal,
  CategoryModal,
} from '@/components/admin/news';

export default function AdminNewsPage() {
  const router = useRouter();
  const newsManager = useNewsManagement();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">新闻管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            管理网站新闻动态、通知和公告
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/news/create')}
          className="inline-flex items-center justify-center px-6 py-3 bg-[#b71c1c] text-white text-sm font-semibold rounded-lg hover:bg-[#8b0000] transition-colors shadow-sm"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          发布新闻
        </button>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'all' as const, label: '全部' },
              { id: 'pending' as const, label: '待发布' },
              { id: 'published' as const, label: '已发布' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  newsManager.setStatusFilter(tab.id);
                  newsManager.setCurrentPage(1);
                }}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  newsManager.statusFilter === tab.id
                    ? 'border-[#b71c1c] text-[#b71c1c]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <NewsFilters
        searchTerm={newsManager.searchTerm}
        categoryFilter={newsManager.categoryFilter}
        carouselOnly={newsManager.carouselOnly}
        categories={newsManager.categories}
        onSearchTermChange={newsManager.setSearchTerm}
        onSearch={newsManager.handleSearch}
        onClear={newsManager.handleClearFilters}
        onFilterChange={newsManager.handleFilterChange}
        onCarouselFilterChange={(enabled) => {
          newsManager.setCarouselOnly(enabled);
          newsManager.setCurrentPage(1);
        }}
        onCategoryModalOpen={() => newsManager.setCategoryModalOpen(true)}
      />

      {/* Stats */}
      <NewsStats
        total={newsManager.total}
        totalAllNews={newsManager.totalAllNews}
        totalCarousel={newsManager.totalCarousel}
        categories={newsManager.categories}
        statusFilter={newsManager.statusFilter}
        onCarouselClick={newsManager.openCarouselModal}
      />

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <NewsList
          news={newsManager.filteredNews}
          loading={newsManager.loading}
          total={newsManager.total}
          currentPage={newsManager.currentPage}
          totalPages={newsManager.totalPages}
          selectedIds={newsManager.selectedIds}
          onSelectAll={newsManager.handleSelectAll}
          onSelectOne={newsManager.handleSelectOne}
          onPublish={newsManager.handlePublish}
          onUnpublish={newsManager.handleUnpublish}
          onPreview={newsManager.handlePreview}
          onDelete={(id) => newsManager.setDeleteConfirm(id)}
          onPageChange={newsManager.handlePageChange}
          onBatchActionComplete={newsManager.handleBatchActionComplete}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {newsManager.deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-900/50 backdrop-blur-sm"
              onClick={() => newsManager.setDeleteConfirm(null)}
            />
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-6 pt-6 pb-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-bold text-gray-900">确认删除</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        此操作将永久删除该新闻，无法恢复。确定要继续吗？
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                <button
                  onClick={() => newsManager.handleDelete(newsManager.deleteConfirm!)}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-2.5 bg-red-600 text-base font-semibold text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  删除
                </button>
                <button
                  onClick={() => newsManager.setDeleteConfirm(null)}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-6 py-2.5 bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Carousel Modal */}
      {newsManager.carouselModalOpen && (
        <CarouselModal
          carouselNews={newsManager.carouselNews}
          totalCarousel={newsManager.totalCarousel}
          onClose={() => newsManager.setCarouselModalOpen(false)}
          onAutoSort={newsManager.autoSortCarouselNews}
          onUpdateOrder={newsManager.updateCarouselOrder}
        />
      )}

      {/* Category Modal */}
      {newsManager.categoryModalOpen && (
        <CategoryModal
          categories={newsManager.categories}
          newCategoryName={newsManager.newCategoryName}
          newCategoryColor={newsManager.newCategoryColor}
          onClose={() => newsManager.setCategoryModalOpen(false)}
          onNameChange={newsManager.setNewCategoryName}
          onColorChange={newsManager.setNewCategoryColor}
          onCreate={newsManager.handleCreateCategory}
          onDelete={newsManager.handleDeleteCategory}
        />
      )}
    </div>
  );
}
