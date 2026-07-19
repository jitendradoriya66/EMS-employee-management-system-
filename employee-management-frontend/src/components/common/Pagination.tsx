import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const pageNumbers: (number | string)[] = []
  const maxPagesToShow = 5

  if (totalPages <= maxPagesToShow) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i)
    }
  } else {
    pageNumbers.push(1)

    if (currentPage > 3) {
      pageNumbers.push('...')
    }

    const startPage = Math.max(2, currentPage - 1)
    const endPage = Math.min(totalPages - 1, currentPage + 1)

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    if (currentPage < totalPages - 2) {
      pageNumbers.push('...')
    }

    pageNumbers.push(totalPages)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-md p-md bg-card border border-border rounded-lg">
      {/* Info Text */}
      <div className="text-sm text-text-secondary">
        Showing <span className="font-semibold text-text-primary">{startItem}</span> to{' '}
        <span className="font-semibold text-text-primary">{endItem}</span> of{' '}
        <span className="font-semibold text-text-primary">{totalItems}</span> employees
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-md">
        {/* Rows per page selector */}
        <div className="flex items-center gap-sm">
          <label htmlFor="items-per-page" className="text-sm text-text-secondary">
            Rows per page:
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={e => onItemsPerPageChange(Number(e.target.value))}
            className="px-md py-xs rounded border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={18}>18</option>
            <option value={24}>24</option>
          </select>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-xs">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-xs rounded border border-border hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4 text-text-primary" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-xs">
            {pageNumbers.map((page, idx) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-sm text-text-secondary">
                    ...
                  </span>
                )
              }

              const isActive = page === currentPage

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={cn(
                    'px-md py-xs rounded text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'border border-border text-text-primary hover:bg-background'
                  )}
                >
                  {page}
                </button>
              )
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-xs rounded border border-border hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4 text-text-primary" />
          </button>
        </div>
      </div>
    </div>
  )
}
