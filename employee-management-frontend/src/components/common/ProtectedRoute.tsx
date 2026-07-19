import React from 'react'
import { Loader2 } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowPendingApproval?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowPendingApproval = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // While loading auth state from localStorage, render nothing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-md">
        <div className="flex flex-col items-center gap-md rounded-2xl border border-border bg-card px-xl py-2xl shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-text-secondary">Loading Workforce Hub...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.approvalStatus === 'pending' && !allowPendingApproval) {
    return <Navigate to="/pending-approval" replace state={{ from: location.pathname }} />
  }

  if (user?.approvalStatus === 'rejected') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
