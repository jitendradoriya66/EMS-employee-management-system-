import { useState, useEffect, useCallback } from 'react';
import { fetchPayslips, generatePayroll, approvePayslip } from '@/utils/api';

export function usePayslips() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayslips = useCallback(() => {
    setLoading(true);
    fetchPayslips().then(res => {
      setPayslips(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadPayslips();
  }, [loadPayslips]);

  const generate = async (month: number, year: number) => {
    await generatePayroll(month, year);
    loadPayslips();
  };

  const approve = async (id: string) => {
    await approvePayslip(id);
    loadPayslips();
  };

  return { payslips, loading, generate, approve, refresh: loadPayslips };
}
