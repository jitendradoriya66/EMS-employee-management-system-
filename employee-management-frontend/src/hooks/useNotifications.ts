import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/utils/apiClient'

export interface Notification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/api/v1/notifications/')
      const results = data.results || data
      setNotifications(Array.isArray(results) ? results : [])
    } catch (err) {
      console.error('Failed to fetch notifications', err)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  const markAllAsRead = async () => {
    try {
      await apiClient.post('/api/v1/notifications/mark-read/')
      await fetchNotifications()
    } catch (err) {
      console.error('Failed to mark notifications as read', err)
      throw err
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return { notifications, loading, fetchNotifications, markAllAsRead }
}
