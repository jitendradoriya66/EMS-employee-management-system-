import { useState, useEffect } from 'react';
import apiClient from '@/utils/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export function useDepartments() {
  const { user } = useAuth();
  const isEmployee = (user?.role ?? 'employee') === 'employee';
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

  const updateDepartment = async (id: string, departmentData: { name: string, description: string }) => {
    try {
      await apiClient.patch(`/api/v1/departments/${id}/`, departmentData);
      await fetchDepartments();
    } catch (err) {
      console.error('Failed to update department', err);
      throw err;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/departments/${id}/`);
      await fetchDepartments();
    } catch (err) {
      console.error('Failed to delete department', err);
      throw err;
    }
  };

  useEffect(() => {
    if (!isEmployee) {
      fetchDepartments();
    } else {
      setLoading(false);
    }
  }, [isEmployee]);

  return { departments, loading, fetchDepartments, addDepartment, updateDepartment, deleteDepartment };
}
