import React, { useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { getDepartments } from '@/utils/helpers'
import { cn } from '@/utils/helpers'

interface EmployeeFiltersProps {
  onSearch: (search: string) => void
  onDepartmentChange: (department: string) => void
  onStatusChange: (status: 'active' | 'inactive' | 'on-leave' | 'all') => void
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  isExpanded?: boolean
  onExpandChange?: (expanded: boolean) => void
}

export const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  onSearch,
  onDepartmentChange,
  onStatusChange,
  onSortChange,
  isExpanded,
  onExpandChange,
}) => {
  const [expanded, setExpanded] = useState(isExpanded || false)
  const departments = getDepartments()

  const handleExpandChange = (newExpanded: boolean) => {
    setExpanded(newExpanded)
    onExpandChange?.(newExpanded)
  }

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'on-leave', label: 'On Leave' },
    { value: 'inactive', label: 'Inactive' },
  ]

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    ...departments.map(dept => ({ value: dept, label: dept })),
  ]

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'date', label: 'Start Date' },
    { value: 'department', label: 'Department' },
  ]

  return (
    <div className="card p-md space-y-md">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-md top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
        <Input
          type="text"
          placeholder="Search by name, email, ID, role, or manager..."
          onChange={(e) => onSearch(e.target.value)}
          className="pl-3xl"
          aria-label="Search employees"
        />
      </div>

      {/* Expandable filters */}
      <button
        onClick={() => handleExpandChange(!expanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-text-primary hover:text-primary-500 transition-colors"
        aria-expanded={expanded}
      >
        <span>More Filters</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            expanded && 'transform rotate-180'
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-md pt-md border-t border-border">
          <Select
            label="Status"
            options={statusOptions}
            onChange={(e) => onStatusChange(e.target.value as any)}
            aria-label="Filter by status"
          />

          <Select
            label="Department"
            options={departmentOptions}
            onChange={(e) => onDepartmentChange(e.target.value)}
            aria-label="Filter by department"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <Select
              label="Sort By"
              options={sortOptions}
              onChange={(e) => onSortChange(e.target.value, 'asc')}
              aria-label="Sort employees by"
            />

            <Select
              label="Order"
              options={[
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' },
              ]}
              onChange={(e) => onSortChange('name', e.target.value as 'asc' | 'desc')}
              aria-label="Sort order"
            />
          </div>
        </div>
      )}
    </div>
  )
}
