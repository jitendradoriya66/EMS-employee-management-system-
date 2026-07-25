import React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

interface ModernPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  onItemsPerPageChange?: (items: number) => void
  itemsPerPageOptions?: number[]
}

export const ModernPagination: React.FC<ModernPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = [8, 12, 24, 48]
}) => {
  if (totalPages <= 1 && !onItemsPerPageChange) return null;

  const getVisiblePages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-md pt-md border-t border-border">
      {/* Items per page selector */}
      {onItemsPerPageChange && itemsPerPage ? (
        <div className="flex items-center gap-sm text-sm text-text-secondary">
          <span>Rows per page</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="theme-select text-sm h-9 rounded-lg border-border bg-background"
          >
            {itemsPerPageOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      ) : (
        <div /> // Spacer
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-xs sm:gap-sm">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="inline-flex h-9 items-center justify-center gap-xs rounded-lg border border-border bg-background px-3 text-sm font-medium text-text-primary transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {getVisiblePages().map((page, index) => {
            if (page === '...') {
              return (
                <div key={`ellipsis-${index}`} className="flex h-9 w-9 items-center justify-center text-text-secondary">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              );
            }
            const pageNum = page as number;
            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-primary-500 text-white shadow-sm' 
                    : 'text-text-secondary hover:bg-background hover:text-text-primary'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        
        <div className="sm:hidden flex items-center justify-center h-9 px-3 text-sm font-medium text-text-secondary">
          Page {currentPage} of {totalPages}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 items-center justify-center gap-xs rounded-lg border border-border bg-background px-3 text-sm font-medium text-text-primary transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-slate-800"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
