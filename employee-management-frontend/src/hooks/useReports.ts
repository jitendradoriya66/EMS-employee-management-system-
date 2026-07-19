import { useState, useEffect } from 'react'
import apiClient from '@/utils/apiClient'

export interface Report {
  id: string
  name: string
  type: string
  generatedDate: string
  size: string
  status: string
}

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get('/api/v1/reports/')
      const results = data.results || data
      setReports(Array.isArray(results) ? results.map((item: any) => ({
        id: item.id,
        name: item.name || `Report ${item.id}`,
        type: item.report_type || 'Custom',
        generatedDate: item.generated_at ? new Date(item.generated_at).toLocaleDateString() : new Date().toLocaleDateString(),
        size: '1.2 MB', // Mock size as it's not in the model typically
        status: item.status || 'Ready',
      })) : [])
    } catch (err) {

  return { reports, loading, fetchReports }
}
