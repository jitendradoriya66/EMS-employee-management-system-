import { useState, useEffect } from 'react'
import apiClient from '@/utils/apiClient'

export interface Task {
  id: string
  title: string
  description: string
  status: string
  dueDate: string
  assignee: string
  assigneeName: string
  project: string
  projectName: string
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/api/v1/tasks/')
      const results = data.results || data
      setTasks(Array.isArray(results) ? results.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        status: item.status,
        dueDate: item.due_date,
        assignee: item.assignee,
        assigneeName: item.assigneeName,
        project: item.project,
        projectName: item.projectName,
      })) : [])
    } catch (err) {
      console.error('Failed to fetch tasks', err)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  return { tasks, loading, fetchTasks }
}
