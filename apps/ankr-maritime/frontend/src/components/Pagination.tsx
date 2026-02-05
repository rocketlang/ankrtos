/**
 * Standardized Pagination Component
 * Supports 20/50/100 items per page
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  showItemCount?: boolean;
  showPageNumbers?: boolean;
}

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [20, 50, 100],
  showItemCount = true,
  showPageNumbers = true,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show subset with ellipsis
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-maritime-800 border-t border-maritime-700">
      {/* Left: Items per page selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-maritime-400">Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="bg-maritime-900 border border-maritime-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="text-sm text-maritime-400">per page</span>
        </div>

        {showItemCount && (
          <div className="text-sm text-maritime-400">
            Showing <span className="text-white font-medium">{startItem}</span> to{' '}
            <span className="text-white font-medium">{endItem}</span> of{' '}
            <span className="text-white font-medium">{totalItems}</span> results
          </div>
        )}
      </div>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-2">
        {/* First page */}
        <button
          onClick={() => goToPage(1)}
          disabled={!canGoPrevious}
          className={`p-1 rounded transition-colors ${
            canGoPrevious
              ? 'text-maritime-400 hover:text-white hover:bg-maritime-700'
              : 'text-maritime-600 cursor-not-allowed'
          }`}
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={!canGoPrevious}
          className={`p-1 rounded transition-colors ${
            canGoPrevious
              ? 'text-maritime-400 hover:text-white hover:bg-maritime-700'
              : 'text-maritime-600 cursor-not-allowed'
          }`}
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {showPageNumbers && (
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-2 text-maritime-500">
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              const isCurrent = pageNum === currentPage;

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`min-w-[32px] h-8 px-2 rounded text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'text-maritime-400 hover:text-white hover:bg-maritime-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        )}

        {/* Next page */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={!canGoNext}
          className={`p-1 rounded transition-colors ${
            canGoNext
              ? 'text-maritime-400 hover:text-white hover:bg-maritime-700'
              : 'text-maritime-600 cursor-not-allowed'
          }`}
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => goToPage(totalPages)}
          disabled={!canGoNext}
          className={`p-1 rounded transition-colors ${
            canGoNext
              ? 'text-maritime-400 hover:text-white hover:bg-maritime-700'
              : 'text-maritime-600 cursor-not-allowed'
          }`}
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Hook for managing pagination state
 */
export function usePagination(totalItems: number, defaultItemsPerPage: number = 20) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(defaultItemsPerPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to page 1 when items per page changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Reset to page 1 when total items changes significantly
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    setCurrentPage,
    setItemsPerPage,
  };
}

// Add React import
import React from 'react';
