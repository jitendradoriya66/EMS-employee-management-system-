import React from 'react'
import { cn } from '@/utils/helpers'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
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
        <input
          ref={ref}
          className={cn(
            'input',
            error && 'input-error',
            className
          )}
          aria-label={props['aria-label'] || label}
          aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
          {...props}
        />
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

Input.displayName = 'Input'
