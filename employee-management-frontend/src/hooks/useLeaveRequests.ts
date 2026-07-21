import { useState, useCallback } from 'react';
import apiClient from '@/utils/apiClient';
import { approveLeaveRequest, rejectLeaveRequest, submitLeaveRequest } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export function useLeaveRequests() {
  const { user } = useAuth();
  const isEmployee = (user?.role ?? 'employee') === 'employee';

  const [loading, setLoading] = useState(true);
  
  // Employee State
  const [employeeLeaves, setEmployeeLeaves] = useState<any[]>([]);
  const [employeeTotalCount, setEmployeeTotalCount] = useState(0);

  // Admin State
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [reviewedLeaves, setReviewedLeaves] = useState<any[]>([]);
  const [reviewedTotalCount, setReviewedTotalCount] = useState(0);

  const [stats, setStats] = useState<any>(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/v1/leave/stats/');
      setStats(data);
    } catch (e) {}
  }, []);

  const fetchEmployeeLeaves = useCallback(async (page = 1, pageSize = 6) => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/api/v1/leave/?page=${page}&page_size=${pageSize}`);
      setEmployeeLeaves(data.results || data);
      setEmployeeTotalCount(data.count || (data.results || data).length);
      await fetchStats();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [fetchStats]);

  const fetchAdminLeaves = useCallback(async (page = 1, pageSize = 6) => {
    try {
      setLoading(true);
      
      // Fetch pending requests (usually we want all of them, or a large page size)
      const { data: pendingData } = await apiClient.get(`/api/v1/leave/?status=pending&page_size=100`);
      setPendingLeaves(pendingData.results || pendingData);
      
      // Fetch reviewed requests (paginated)
      const { data: reviewedData } = await apiClient.get(`/api/v1/leave/?exclude_status=pending&page=${page}&page_size=${pageSize}`);
      setReviewedLeaves(reviewedData.results || reviewedData);
      setReviewedTotalCount(reviewedData.count || (reviewedData.results || reviewedData).length);
      
      await fetchStats();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [fetchStats]);

  const approveLeave = async (id: string, currentPage = 1) => {
    await approveLeaveRequest(id);
    if (isEmployee) await fetchEmployeeLeaves(currentPage);
    else await fetchAdminLeaves(currentPage);
  };

  const rejectLeave = async (id: string, currentPage = 1) => {
    await rejectLeaveRequest(id);
    if (isEmployee) await fetchEmployeeLeaves(currentPage);
    else await fetchAdminLeaves(currentPage);
  };

  const submitLeave = async (payload: any, currentPage = 1) => {
    await submitLeaveRequest(payload);
    if (isEmployee) await fetchEmployeeLeaves(currentPage);
    else await fetchAdminLeaves(currentPage);
  }

  return { 
    employeeLeaves, employeeTotalCount, 
    pendingLeaves, reviewedLeaves, reviewedTotalCount, 
    stats, loading, 
    fetchEmployeeLeaves, fetchAdminLeaves, 
    approveLeave, rejectLeave, submitLeave 
  };
}
