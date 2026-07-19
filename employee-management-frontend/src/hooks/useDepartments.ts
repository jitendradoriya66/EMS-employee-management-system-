import { useState, useEffect } from 'react';
import apiClient from '@/utils/apiClient';

export function useDepartments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/api/v1/departments/');
      const results = data.results || data;
      setDepartments(Array.isArray(results) ? results.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        headcount: item.headcount || 0,
        managerName: item.managerName,
      })) : []);
    } catch (err) {
      console.error(err);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = async (departmentData: { name: string, description: string }) => {
    try {
      await apiClient.post('/api/v1/departments/', departmentData);
      await fetchDepartments();
    } catch (err) {
      console.error('Failed to add department', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return { departments, loading, fetchDepartments, addDepartment };
}
