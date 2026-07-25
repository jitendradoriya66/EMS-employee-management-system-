import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/utils/apiClient'
import { socketManager } from '@/utils/websocket'

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
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error('Failed to mark notifications as read', err)
      throw err
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await apiClient.post(`/api/v1/notifications/${id}/mark-read/`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (err) {
      console.error('Failed to mark notification as read', err)
      throw err
    }
  }

  // Request browser notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Listen to WebSocket notifications in real-time
  useEffect(() => {
    socketManager.connect()

    const unsubNotify = socketManager.on('notification', (data) => {
      console.log('[WebSocket] Real-time Notification received:', data)
      if (data.notification) {
        const notif = data.notification
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev
          return [notif, ...prev]
        })

        // Fetch settings preference to check if browser notifications are allowed
        const checkAndShowBrowserNotification = async () => {
          try {
            // Check if permission is granted
            if ('Notification' in window && Notification.permission === 'granted') {
              const browserNotif = new Notification(notif.title, {
                body: notif.message,
                icon: '/favicon.ico'
              })
              browserNotif.onclick = () => {
                window.focus()
              }
            }
          } catch (e) {
            console.error('Browser Notification error:', e)
          }
        }
        checkAndShowBrowserNotification()
      }
    })

    return () => {
      unsubNotify()
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return { notifications, loading, fetchNotifications, markAllAsRead, markAsRead }
}
