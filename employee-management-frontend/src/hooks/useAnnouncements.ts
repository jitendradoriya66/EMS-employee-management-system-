import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/utils/apiClient'

export interface Announcement {
  id: string
  title: string
  category: string
  audience: string
  date: string
  status: string
  body: string
}

export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/api/v1/notifications/announcements/')
      const results = data.results || data
      setAnnouncements(Array.isArray(results) ? results.map((item: any) => ({
        id: item.id,
        title: item.title || item.message?.substring(0, 30) || 'Notice',
        category: item.type || 'Company Update',
        audience: 'All Employees',
        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        status: item.is_read ? 'Read' : 'New',
        body: item.message || '',
      })) : [])
    } catch (err) {
      console.error('Failed to fetch announcements', err)
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }, [])

  const broadcastAnnouncement = async (data: { title: string, message: string }) => {
    try {
      await apiClient.post('/api/v1/notifications/broadcast/', data)
      await fetchAnnouncements()
    } catch (err) {
      console.error('Failed to broadcast announcement', err)
      throw err
    }
  }

  const markAllAsRead = async () => {
    try {
      await apiClient.post('/api/v1/notifications/announcements/mark-read/')
      await fetchAnnouncements()
    } catch (err) {
      console.error('Failed to mark announcements as read', err)
      throw err
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  return { announcements, loading, fetchAnnouncements, broadcastAnnouncement, markAllAsRead }
}
