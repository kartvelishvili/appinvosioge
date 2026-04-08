import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const useEnhancedRevenueData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);
        const previousMonthStart = startOfMonth(subMonths(now, 1));
        const previousMonthEnd = endOfMonth(subMonths(now, 1));

        const { data: invoices, error: fetchError } = await supabase
          .from('invoices')
          .select('*, clients(name, company_name)')
          .gte('issue_date', previousMonthStart.toISOString())
          .lte('issue_date', currentMonthEnd.toISOString());

        if (fetchError) throw fetchError;

        const processMonth = (start, end) => {
          const monthInvoices = invoices.filter(inv => {
            const date = new Date(inv.issue_date || inv.created_at);
            return date >= start && date <= end;
          });

          let planned = 0, paid = 0, unpaid = 0, overdue = 0;
          monthInvoices.forEach(inv => {
            const amount = parseFloat(inv.total_amount || 0);
            planned += amount;
            if (inv.payment_status === 'paid') {
              paid += amount;
            } else {
              const isOverdue = new Date(inv.due_date) < new Date();
              if (isOverdue) overdue += amount;
              else unpaid += amount;
            }
          });

          return {
            date: start,
            planned,
            paid,
            unpaid,
            overdue,
            invoices: monthInvoices
          };
        };

        setData([
          processMonth(previousMonthStart, previousMonthEnd),
          processMonth(currentMonthStart, currentMonthEnd)
        ]);
      } catch (err) {
        console.error('Error fetching enhanced data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};