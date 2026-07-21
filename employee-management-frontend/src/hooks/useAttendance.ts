import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/utils/apiClient'
import { useAuth } from '@/contexts/AuthContext'

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  department: string
  date: string
  checkIn: string
  checkOut: string
  hoursWorked: number
  status: 'present' | 'late' | 'leave'
}

export interface AttendanceStats {
  total: number
  present: number
  late: number
  leave: number
  average_hours: number
  daily_summary: Array<{
    date: string
    present: number
    late: number
    leave: number
  }>
}

export const useAttendance = (
  page: number = 1,
  pageSize: number = 8,
  search: string = '',
  department: string = 'all',
  status: string = 'all'
) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      })
      
      if (search) params.append('search', search)
      if (department !== 'all') params.append('employee__department__name', department)
      if (status !== 'all') params.append('status', status)
      
      // Fetch paginated records
      const { data } = await apiClient.get(`/api/v1/attendance/?${params.toString()}`)
      
      // Fetch overall stats
      const { data: statsData } = await apiClient.get(`/api/v1/attendance/stats/?${params.toString()}`)
      
      const items = data.results || data
      setTotalCount(data.count || items.length)
      setStats(statsData)
      
      const formatted = items.map((item: any) => ({
        id: item.id,
        employeeId: item.employee?.id || user?.id,
        employeeName: item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : user?.name,
        department: item.employee?.department || user?.department || 'Unassigned',
        date: item.date,
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        hoursWorked: item.hoursWorked,
        status: item.status,
      }))
      
      setRecords(formatted)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch attendance records')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, department, status, user])

  useEffect(() => {
    if (user) {
        fetchRecords()
        
        // ... (WebSocket code removed for brevity in diffs, let's keep it but just re-trigger fetch)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = import.meta.env.VITE_API_URL 
          ? import.meta.env.VITE_API_URL.replace('http', 'ws') + '/ws/attendance/'
          : `${protocol}//${host}/ws/attendance/`;

        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            try {
                // If there's an update, just refetch to keep pagination/stats in sync
                fetchRecords();
            } catch (e) {
                console.error("WebSocket message parsing error:", e);
            }
        };

        return () => {
            ws.close();
        };
    }
  }, [user, fetchRecords])

  const checkIn = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const time = new Date().toTimeString().split(' ')[0].substring(0, 5) // HH:MM
      
      await apiClient.post('/api/v1/attendance/', {
        date: today,
        checkIn: time,
        status: 'present',
        hoursWorked: 0,
      })
      await fetchRecords()
    } catch (err: any) {
      console.error(err)
      throw new Error(err.response?.data?.detail || err.response?.data?.[0] || 'Failed to check in. Please try again.')
    }
  }

  const checkOut = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      let activeRecord = records.find(r => r.date === today && !r.checkOut)
      
      if (!activeRecord) {
        // Query backend if not on current page
        const { data } = await apiClient.get(`/api/v1/attendance/?date=${today}`)
        const items = data.results || data
        const item = items.find((r: any) => !r.checkOut)
        if (item) {
           activeRecord = {
             id: item.id,
             checkIn: item.checkIn,
             checkOut: item.checkOut,
             date: item.date
           } as any
        }
      }

      if (!activeRecord) {
        throw new Error('No active check-in found for today')
      }

      const time = new Date().toTimeString().split(' ')[0].substring(0, 5) // HH:MM
      
      // Calculate basic hours worked
      const [inHour, inMin] = activeRecord.checkIn.split(':').map(Number)
      const [outHour, outMin] = time.split(':').map(Number)
      const hoursWorked = (outHour + outMin / 60) - (inHour + inMin / 60)

      await apiClient.patch(`/api/v1/attendance/${activeRecord.id}/`, {
        checkOut: time,
        hoursWorked: Math.max(0, hoursWorked),
      })
      
      await fetchRecords()
    } catch (err: any) {
      console.error(err)
      throw new Error(err.response?.data?.detail || err.response?.data?.[0] || err.message || 'Failed to check out. Please try again.')
    }
  }

  return { records, totalCount, stats, loading, error, checkIn, checkOut, fetchRecords }
}
