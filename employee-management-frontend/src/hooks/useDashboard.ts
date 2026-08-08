import { useState, useEffect } from 'react'
import apiClient from '@/utils/apiClient'

export interface DepartmentStat {
  department: string
  count: number
  percentage: number
}

export interface ChartPoint {
  label: string
  value: number
}

export interface ActivityItem {
  title: string
  description: string
  time: string
  date: string
}

export interface DashboardMetrics {
  // Admin stats
  total_employees?: number;
  active_workforce?: number;
  attendance_rate?: number;
  on_leave?: number;
  payroll_total?: number;
  avg_performance?: number | null;
  department_stats?: DepartmentStat[];
  
  // Employee stats
  my_attendance_rate?: number;
  hours_logged?: number;
  available_leave_balance?: number;
  my_performance_score?: number;
  my_monthly_salary?: number;
  
  // Shared
  trend_data: ChartPoint[];
  recent_activities: ActivityItem[];
}

export const useDashboard = (employeeFilter = 'all', departmentFilter = 'all', rangeFilter = '30d') => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (employeeFilter !== 'all') params.append('employee_id', employeeFilter)
        if (departmentFilter !== 'all') params.append('department_name', departmentFilter)
        params.append('range', rangeFilter)

        const { data } = await apiClient.get<DashboardMetrics>(`/api/v1/dashboard/?${params.toString()}`)
        setMetrics(data)
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch dashboard metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [employeeFilter, departmentFilter, rangeFilter])

  return { metrics, loading, error }
}

