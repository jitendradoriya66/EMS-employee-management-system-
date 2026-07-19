import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string | number; label: string }>
  helperText?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, helperText, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-xs">
        {label && (
          <label
            htmlFor={props.id}
            className="text-sm font-medium text-text-primary"
          >
            {label}
            {props.required && <span className="text-red-500 ml-xs">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'theme-select cursor-pointer w-full pr-12',
              error && 'input-error',
              className
            )}
            aria-label={props['aria-label'] || label}
            aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-md top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        </div>
        {error && (
          <span
            id={`${props.id}-error`}
            className="text-sm text-red-600"
            role="alert"
          >
            {error}
          </span>
        )}
        {helperText && !error && (
          <span
            id={`${props.id}-helper`}
            className="text-sm text-text-secondary"
          >
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
