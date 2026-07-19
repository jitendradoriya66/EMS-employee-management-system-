import { useState, useEffect } from 'react';
import { fetchEmployees } from '@/utils/api';
import { Employee } from '@/types';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees().then(res => {
      setEmployees(res.employees);
      setLoading(false);
    }).catch(err => {
      setLoading(false);
    });
  }, []);

  return { employees, loading };
}
