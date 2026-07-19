import React from 'react'

interface LoadingSkeletonProps {
  rows?: number
  className?: string
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 5,
  className,
}) => {
  return (
    <div className={className ?? 'grid gap-md sm:grid-cols-2 xl:grid-cols-3'}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-md space-y-sm animate-pulse">
          <div className="skeleton h-5 w-2/3" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-24 w-full" />
          <div className="grid grid-cols-3 gap-xs">
            <div className="skeleton h-9 w-full" />
            <div className="skeleton h-9 w-full" />
            <div className="skeleton h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
