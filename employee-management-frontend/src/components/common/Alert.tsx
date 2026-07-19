import React from 'react'
import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface AlertProps {
  children: React.ReactNode
  variant?: 'error' | 'warning' | 'success' | 'info'
  title?: string
  onClose?: () => void
  className?: string
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  onClose,
  className,
}) => {
  const variantConfig = {
    error: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-900/30',
      text: 'text-red-900 dark:text-red-100',
      icon: AlertTriangle,
      iconColor: 'text-red-600 dark:text-red-300',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
      border: 'border-yellow-200 dark:border-yellow-900/30',
      text: 'text-yellow-900 dark:text-yellow-100',
      icon: AlertCircle,
      iconColor: 'text-yellow-600 dark:text-yellow-300',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-900/30',
      text: 'text-green-900 dark:text-green-100',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-300',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-900/30',
      text: 'text-blue-900 dark:text-blue-100',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-300',
    },
  }

  const config = variantConfig[variant]
  const IconComponent = config.icon

  return (
    <div
      role="alert"
      className={cn(
        'card border-2 p-md flex gap-md items-start',
        config.bg,
        config.border,
        className
      )}
    >
      <IconComponent className={cn('h-5 w-5 flex-shrink-0 mt-xs', config.iconColor)} />
      <div className="flex-1">
        {title && <h4 className={cn('font-semibold mb-xs', config.text)}>{title}</h4>}
        <div className={cn('text-sm', config.text)}>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-sm font-medium hover:opacity-70 transition-opacity"
          aria-label="Close alert"
        >
          ✕
        </button>
      )}
    </div>
  )
}
