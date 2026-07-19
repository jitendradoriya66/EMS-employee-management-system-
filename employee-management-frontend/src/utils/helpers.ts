import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'badge-success'
    case 'on-leave':
      return 'badge-warning'
    case 'inactive':
      return 'badge-danger'
    default:
      return 'badge-neutral'
  }
}

export const getStatusLabel = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')
}

export const getDepartmentColor = (department: string): string => {
  const colors: Record<string, string> = {
    Engineering: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    Product: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    Sales: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
    HR: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
    Finance: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300',
  }
  return colors[department] || 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
}

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export const getDepartments = (): string[] => {
  return ['Engineering', 'Product', 'Sales', 'HR', 'Finance', 'Marketing', 'Operations']
}

export const getStatuses = (): Array<{ value: string; label: string }> => {
  return [
    { value: 'active', label: 'Active' },
    { value: 'on-leave', label: 'On Leave' },
    { value: 'inactive', label: 'Inactive' },
  ]
}
