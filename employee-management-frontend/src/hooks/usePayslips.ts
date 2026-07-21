import { useState, useCallback } from 'react';
import apiClient from '@/utils/apiClient';
import { generatePayroll, approvePayslip } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export function usePayslips() {
  const { user } = useAuth();
  const isEmployee = (user?.role ?? 'employee') === 'employee';

  const [loading, setLoading] = useState(true);

  // Employee State
  const [employeePayslips, setEmployeePayslips] = useState<any[]>([]);
  const [employeeTotalCount, setEmployeeTotalCount] = useState(0);

  // Admin State
  const [adminPayslips, setAdminPayslips] = useState<any[]>([]);
  const [adminTotalCount, setAdminTotalCount] = useState(0);

  const [stats, setStats] = useState<any>(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/v1/payroll/payslips/stats/');
      setStats(data);
    } catch (e) {}
  }, []);

  const fetchEmployeePayslips = useCallback(async (page = 1, pageSize = 6) => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/api/v1/payroll/payslips/?page=${page}&page_size=${pageSize}`);
      setEmployeePayslips(data.results || data);
      setEmployeeTotalCount(data.count || (data.results || data).length);
      await fetchStats();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [fetchStats]);

  const fetchAdminPayslips = useCallback(async (page = 1, pageSize = 6) => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/api/v1/payroll/payslips/?page=${page}&page_size=${pageSize}`);
      setAdminPayslips(data.results || data);
      setAdminTotalCount(data.count || (data.results || data).length);
      await fetchStats();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [fetchStats]);

  const generate = async (month: number, year: number, currentPage = 1) => {
    await generatePayroll(month, year);
    if (isEmployee) await fetchEmployeePayslips(currentPage);
    else await fetchAdminPayslips(currentPage);
  };

  const approve = async (id: string, currentPage = 1) => {
    await approvePayslip(id);
    if (isEmployee) await fetchEmployeePayslips(currentPage);
    else await fetchAdminPayslips(currentPage);
  };

  return {
    employeePayslips, employeeTotalCount,
    adminPayslips, adminTotalCount,
    stats, loading,
    fetchEmployeePayslips, fetchAdminPayslips,
    generate, approve
  };
}
