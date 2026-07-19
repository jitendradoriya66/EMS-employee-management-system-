import { useState, useEffect } from 'react'
import apiClient from '@/utils/apiClient'

export interface JobPosting {
  id: string
  title: string
  department: string
  location: string
  type: string
  status: string
  postedDate: string
}

export const useRecruitment = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/api/v1/recruitment/')
      const results = data.results || data
      setJobs(Array.isArray(results) ? results : [])
    } catch (err) {
      console.error('Failed to fetch jobs', err)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  return { jobs, loading, fetchJobs }
}
