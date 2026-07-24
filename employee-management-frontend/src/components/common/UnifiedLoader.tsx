import React from 'react'
import { Loader2 } from 'lucide-react'

interface UnifiedLoaderProps {
  message?: string
}

export const UnifiedLoader: React.FC<UnifiedLoaderProps> = ({ message = 'Loading details...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-2xl w-full min-h-[300px]">
      <div className="relative flex items-center justify-center">
        {/* Outer animated track */}
        <div className="h-16 w-16 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin" />
        {/* Inner spinning icon */}
        <div className="absolute h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </div>
      <p className="mt-lg text-sm font-semibold text-text-secondary animate-pulse tracking-wide">{message}</p>
    </div>
  )
}
