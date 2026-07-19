import { useState, useEffect, useCallback } from 'react';
import { fetchLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from '@/utils/api';

export function useLeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = useCallback(() => {
    setLoading(true);
    fetchLeaveRequests().then(res => {
      setLeaveRequests(res);
      setLoading(false);
    }).catch(err => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const approveLeave = async (id: string) => {
    await approveLeaveRequest(id);
    await fetchLeaves();
  };

  const rejectLeave = async (id: string) => {
    await rejectLeaveRequest(id);
    await fetchLeaves();
  };

  return { leaveRequests, loading, fetchLeaves, approveLeave, rejectLeave };
}
