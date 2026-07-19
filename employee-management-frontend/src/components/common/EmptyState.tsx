import React from 'react'

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-3xl px-md text-center">
      <Icon className="h-16 w-16 text-slate-300 mb-md" />
      <h3 className="text-lg font-semibold text-text-primary mb-sm">{title}</h3>
      <p className="text-text-secondary mb-lg max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="button-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
