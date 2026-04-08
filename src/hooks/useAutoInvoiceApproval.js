import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useAutoInvoiceApproval = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);

  // Calculate next period based on previous end date
  const calculateNextPeriod = (prevEndStr) => {
    let nextStart, nextEnd;
    
    if (prevEndStr) {
      const prevEnd = new Date(prevEndStr);
      nextStart = new Date(prevEnd);
      nextStart.setDate(prevEnd.getDate() + 1);
    } else {
      // Default to first day of current month if no previous date
      const now = new Date();
      nextStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    nextEnd = new Date(nextStart);
    nextEnd.setMonth(nextStart.getMonth() + 1);
    nextEnd.setDate(nextEnd.getDate() - 1);

    return {
      start: nextStart.toISOString().split('T')[0],
      end: nextEnd.toISOString().split('T')[0]
    };
  };

  const fetchPreviousMonthInvoices = useCallback(async () => {
    setLoading(true);
    try {
      // Determine previous month range
      const now = new Date();
      const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch invoices issued in previous month
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (id, company_name),
          performers (id, name)
        `)
        .gte('issue_date', firstDayPrevMonth.toISOString().split('T')[0])
        .lte('issue_date', lastDayPrevMonth.toISOString().split('T')[0])
        .order('issue_date', { ascending: false });

      if (error) throw error;

      // Process data to include next period calculation
      const processed = (data || []).map(inv => {
        const { start, end } = calculateNextPeriod(inv.service_period_end || inv.due_date);
        return {
          ...inv,
          next_service_start: start,
          next_service_end: end,
          next_amount: inv.total_amount || inv.subtotal, // Defaulting to total
          next_vat: inv.vat_percentage
        };
      });

      setCandidates(processed);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "შეცდომა", description: "წინა თვის ინვოისების წამოღება ვერ მოხერხდა" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const approveInvoice = async (invoice, modifiedData = {}) => {
    try {
      const payload = {
        contract_id: invoice.contract_id,
        client_id: invoice.client_id,
        contractor_id: invoice.performer_id,
        amount: modifiedData.amount || invoice.next_amount,
        vat: modifiedData.vat !== undefined ? modifiedData.vat : invoice.next_vat,
        service_period_start: modifiedData.start || invoice.next_service_start,
        service_period_end: modifiedData.end || invoice.next_service_end,
        status: 'პენდინგი',
        source_invoice_id: invoice.id,
        notes: `Auto-generated from ${invoice.invoice_number}`
      };

      const { error } = await supabase.from('auto_invoices').insert([payload]);
      if (error) throw error;

      // Remove from candidates locally
      setCandidates(prev => prev.filter(c => c.id !== invoice.id));
      toast({ title: "დამტკიცებულია", description: "ინვოისი დაემატა გენერირებულებში" });
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: error.message });
      return false;
    }
  };

  const approveAll = async (selectedIds, modifiedDataMap = {}) => {
    setLoading(true);
    let approvedCount = 0;
    
    // If no IDs selected, assume all visible candidates
    const targets = selectedIds && selectedIds.length > 0 
      ? candidates.filter(c => selectedIds.includes(c.id))
      : candidates;

    for (const inv of targets) {
      const modified = modifiedDataMap[inv.id] || {};
      const success = await approveInvoice(inv, modified);
      if (success) approvedCount++;
    }
    
    setLoading(false);
    toast({ title: "დასრულდა", description: `დამტკიცდა ${approvedCount} ინვოისი` });
  };

  const rejectInvoice = (id) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
    toast({ title: "უარყოფილია", description: "ინვოისი ამოიშალა სიიდან" });
  };

  useEffect(() => {
    fetchPreviousMonthInvoices();
  }, [fetchPreviousMonthInvoices]);

  return {
    loading,
    candidates,
    fetchPreviousMonthInvoices,
    approveInvoice,
    rejectInvoice,
    approveAll
  };
};