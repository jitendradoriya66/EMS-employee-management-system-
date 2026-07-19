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
      console.error(err)
    }
  }

  const checkOut = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const activeRecord = records.find(r => r.date === today && !r.checkOut)
      
      if (!activeRecord) {
        console.warn('No active check-in found for today')
        return
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
    } catch (err) {
      console.error(err)
    }
  }

  return { records, loading, error, checkIn, checkOut, fetchRecords }
}
