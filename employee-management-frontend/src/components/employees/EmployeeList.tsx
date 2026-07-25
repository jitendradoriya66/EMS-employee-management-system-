import React from 'react'
import { EmployeeCard } from '@/components/employees/EmployeeCard'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { Pagination } from '@/components/common/Pagination'
import { AlertCircle } from 'lucide-react'
import { Employee } from '@/types'
import { Alert } from '@/components/common/Alert'

interface EmployeeListProps {
  employees: Employee[]
  isLoading: boolean
  error?: string | null
  onEmployeeClick?: (employee: Employee) => void
  onEdit?: (employee: Employee) => void
  onDelete?: (employee: Employee) => void
  onRetry?: () => void
  currentPage?: number
  totalPages?: number
  totalItems?: number
  itemsPerPage?: number
  onPageChange?: (page: number) => void
  onItemsPerPageChange?: (items: number) => void
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  isLoading,
  error,
  onEmployeeClick,
  onEdit,
  onDelete,
  onRetry,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 6,
  totalItems = 0,
  onPageChange,
  onItemsPerPageChange,
}) => {
  if (error) {
    return (
      <Alert variant="error" title="Failed to load employees">
        {error}
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-md text-sm font-medium hover:underline"
          >
            Try again
          </button>
        )}
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
        <LoadingSkeleton rows={3} />
      </div>
    )
  }

  if (employees.length === 0) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="No employees found"
        description="Try adjusting your search filters or add a new employee to get started."
        action={{
          label: 'Add Employee',
          onClick: () => {
            // This will be handled by parent component
          },
        }}
      />
    )
  }

  return (
    <div className="space-y-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
        {employees.map(employee => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onClick={() => onEmployeeClick?.(employee)}
            onView={() => onEmployeeClick?.(employee)}
            onEdit={() => onEdit?.(employee)}
            onDelete={() => onDelete?.(employee)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      )}
    </div>
  )
}
