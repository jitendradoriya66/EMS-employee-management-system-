import { useState, useEffect } from 'react'
import apiClient from '@/utils/apiClient'

export interface DashboardMetrics {
  total_employees: number;
  pending_leaves: number;
  open_tickets: number;
}

export const useDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await apiClient.get<DashboardMetrics>('/api/v1/dashboard/')
        setMetrics(data)
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch dashboard metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  return { metrics, loading, error }
}
