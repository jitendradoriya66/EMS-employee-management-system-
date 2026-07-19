import { useState, useEffect } from 'react'
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

export const useAttendance = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/api/v1/attendance/')
      
      const formatted = (data.results || data).map((item: any) => ({
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
  }

  useEffect(() => {
    if (user) {
      fetchRecords()
    }
  }, [user])

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
    } catch (err) {
    }
  }

  return { records, loading, error, checkIn, checkOut, fetchRecords }
}
