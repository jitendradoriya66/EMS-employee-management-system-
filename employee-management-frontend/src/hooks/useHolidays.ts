import { useState, useEffect } from 'react';
import Holidays from 'date-holidays';

export interface HolidayItem {
  date: string;
  name: string;
  type: string;
}

export function useHolidays() {
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Initialize with India (IN)
      const hd = new Holidays('IN');
      const currentYear = new Date().getFullYear();
      const allHolidays = hd.getHolidays(currentYear);
      
      const formatted = allHolidays.map((h: any) => ({
        date: h.date.split(' ')[0], // YYYY-MM-DD
        name: h.name,
        type: h.type === 'public' ? 'Public Holiday' : h.type === 'bank' ? 'Bank Holiday' : 'Observance'
      }));

      // Filter only upcoming holidays
      const today = new Date().toISOString().split('T')[0];
      const upcoming = formatted.filter(h => h.date >= today).slice(0, 5);

      setHolidays(upcoming);
    } catch (err) {
      console.error('Failed to load holidays', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { holidays, loading };
}
