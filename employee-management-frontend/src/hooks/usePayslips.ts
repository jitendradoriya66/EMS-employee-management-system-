import { useState, useEffect } from 'react';
import { fetchPayslips } from '@/utils/api';

export function usePayslips() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayslips().then(res => {
      setPayslips(res);
      setLoading(false);
    }).catch(err => {
      setLoading(false);
    });
  }, []);

  return { payslips, loading };
}
