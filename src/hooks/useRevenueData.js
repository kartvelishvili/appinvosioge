
import { useMemo, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { startOfDay, endOfDay, subDays, subMonths, subYears, isAfter, isBefore, format } from 'date-fns';
import { ka } from 'date-fns/locale';
import { useSupabaseQuery } from './useSupabaseQuery';

export const useRevenueData = (filters) => {
  const fetchInvoices = useCallback(async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients(name, company)')
      .order('issue_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }, []);

  const { data: invoices, loading, error, retry } = useSupabaseQuery(
    fetchInvoices,
    [],
    { fallbackData: [], immediate: true }
  );

  const processedData = useMemo(() => {
    if (!invoices || !invoices.length) return { metrics: {}, chartData: [], pieData: [] };

    const now = new Date();
    let startDate = new Date(0); 
    let endDate = endOfDay(now);

    if (filters.dateRange === 'week') startDate = startOfDay(subDays(now, 7));
    else if (filters.dateRange === 'month') startDate = startOfDay(subMonths(now, 1));
    else if (filters.dateRange === 'year') startDate = startOfDay(subYears(now, 1));

    let filtered = invoices.filter(inv => {
      const issueDate = new Date(inv.issue_date || inv.created_at);
      if (filters.dateRange !== 'all') {
        if (isBefore(issueDate, startDate) || isAfter(issueDate, endDate)) return false;
      }

      if (filters.bank !== 'all') {
        const hasBank = inv.bank_accounts_settings?.some(acc => {
          const bankId = acc.bank_id?.toLowerCase() || '';
          if (filters.bank === 'tbc') return bankId.includes('tbc') || bankId.includes('თიბისი');
          if (filters.bank === 'bog') return bankId.includes('bog') || bankId.includes('საქართველოს') || bankId.includes('national');
          return false;
        });
        if (!hasBank) return false;
      }

      const isPaid = inv.payment_status === 'paid';
      const isOverdue = !isPaid && isBefore(new Date(inv.due_date), startOfDay(now));
      
      if (filters.status === 'paid' && !isPaid) return false;
      if (filters.status === 'unpaid' && isPaid) return false;
      if (filters.status === 'overdue' && !isOverdue) return false;

      return true;
    });

    let totalRevenue = 0, paidAmount = 0, unpaidAmount = 0, overdueAmount = 0;
    const aggregatedByDate = {};

    filtered.forEach(inv => {
      const amount = parseFloat(inv.total_amount || 0);
      const isPaid = inv.payment_status === 'paid';
      const isOverdue = !isPaid && isBefore(new Date(inv.due_date), startOfDay(now));
      
      totalRevenue += amount;
      if (isPaid) paidAmount += amount;
      else unpaidAmount += amount;
      if (isOverdue) overdueAmount += amount;

      const dateObj = new Date(inv.issue_date || inv.created_at);
      let dateKey = format(dateObj, 'MMM yyyy', { locale: ka });
      if (filters.dateRange === 'week' || filters.dateRange === 'month') {
         dateKey = format(dateObj, 'dd MMM', { locale: ka });
      }

      if (!aggregatedByDate[dateKey]) {
        aggregatedByDate[dateKey] = { name: dateKey, total: 0, paid: 0, unpaid: 0, overdue: 0, invoices: [], dateObj };
      }

      aggregatedByDate[dateKey].total += amount;
      if (isPaid) aggregatedByDate[dateKey].paid += amount;
      else aggregatedByDate[dateKey].unpaid += amount;
      if (isOverdue) aggregatedByDate[dateKey].overdue += amount;
      
      aggregatedByDate[dateKey].invoices.push({
          ...inv,
          calculatedStatus: isPaid ? 'paid' : (isOverdue ? 'overdue' : 'unpaid')
      });
    });

    const chartData = Object.values(aggregatedByDate).sort((a, b) => a.dateObj - b.dateObj);
    let cumulative = 0;
    chartData.forEach(d => {
        cumulative += d.total;
        d.cumulative = cumulative;
    });

    const pieData = [
      { name: 'გადახდილი', value: paidAmount, fill: '#10B981' },
      { name: 'გადაუხდელი', value: unpaidAmount - overdueAmount, fill: '#E5E7EB' },
      { name: 'ვადაგადაცილებული', value: overdueAmount, fill: '#EF4444' }
    ].filter(d => d.value > 0);

    return {
      metrics: {
        totalRevenue, paidAmount, unpaidAmount, overdueAmount,
        overduePercentage: totalRevenue > 0 ? ((overdueAmount / totalRevenue) * 100).toFixed(1) : 0
      },
      chartData,
      pieData
    };
  }, [invoices, filters]);

  return { ...processedData, loading, error, retry };
};
