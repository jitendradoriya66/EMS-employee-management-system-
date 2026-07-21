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
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; // Replace with actual backend if needed
        // Assuming backend runs on port 8000 locally, or same host in prod
        const wsUrl = import.meta.env.VITE_API_URL 
          ? import.meta.env.VITE_API_URL.replace('http', 'ws') + '/ws/attendance/'
          : `${protocol}//${host}/ws/attendance/`;

        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.message && data.message.data) {
                    const newRecord = data.message.data;
                    
                    const formattedRecord = {
                        id: newRecord.id,
                        employeeId: newRecord.employee?.id || '',
                        employeeName: newRecord.employee ? `${newRecord.employee.firstName} ${newRecord.employee.lastName}` : 'Unknown',
                        department: newRecord.employee?.department || 'Unassigned',
                        date: newRecord.date,
                        checkIn: newRecord.checkIn,
                        checkOut: newRecord.checkOut,
                        hoursWorked: newRecord.hoursWorked,
                        status: newRecord.status,
                    };

                    setRecords(prev => {
                        const exists = prev.find(r => r.id === formattedRecord.id);
                        if (exists) {
                            return prev.map(r => r.id === formattedRecord.id ? formattedRecord : r);
                        } else {
                            return [formattedRecord, ...prev];
                        }
                    });
                }
            } catch (e) {
                console.error("WebSocket message parsing error:", e);
            }
        };

        return () => {
            ws.close();
        };
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
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.detail || err.response?.data?.[0] || 'Failed to check in. Please try again.')
    }
  }

  const checkOut = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const activeRecord = records.find(r => r.date === today && !r.checkOut)
      
      if (!activeRecord) {
        alert('No active check-in found for today')
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
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.detail || err.response?.data?.[0] || 'Failed to check out. Please try again.')
    }
  }

  return { records, loading, error, checkIn, checkOut, fetchRecords }
}
