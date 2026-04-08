
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { differenceInDays, getDaysInMonth } from 'date-fns';

export const useOneTimeInvoices = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchOneTimeInvoices = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('one_time_invoices')
        .select(`*, clients (id, name, company, logo_url), performers (id, name, logo_url)`)
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.clientId && filters.clientId !== 'all') {
        query = query.eq('client_id', filters.clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: "ერთჯერადი ინვოისების ჩატვირთვა ვერ მოხერხდა" });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchOneTimeInvoiceById = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('one_time_invoices')
        .select(`*, clients (id, name, company, logo_url, email, phone, address, city, country), performers (id, name, logo_url, email, phone, address)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: "ინვოისის დეტალების ჩატვირთვა ვერ მოხერხდა" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const calculateProportionalAmount = (fullAmount, startStr, endStr) => {
    if (!fullAmount || !startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    const totalDays = differenceInDays(end, start) + 1;
    const daysInMonth = getDaysInMonth(start);
    const ratio = totalDays / daysInMonth;
    const calculated = parseFloat(fullAmount) * ratio;
    return parseFloat(calculated.toFixed(2));
  };

  const createOneTimeInvoice = async (invoiceData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('one_time_invoices').insert([invoiceData]).select();
      if (error) throw error;
      toast({ title: "წარმატება", description: "ერთჯერადი ინვოისი შეიქმნა" });
      return data[0];
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: "ინვოისის შექმნა ვერ მოხერხდა" });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateOneTimeInvoice = async (id, updates) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('one_time_invoices').update(updates).eq('id', id).select();
      if (error) throw error;
      toast({ title: "წარმატება", description: "ინვოისი განახლდა" });
      return data[0];
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: "ინვოისის განახლება ვერ მოხერხდა" });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteOneTimeInvoice = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('one_time_invoices').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "წარმატება", description: "ინვოისი წაიშალა" });
      return true;
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: "ინვოისის წაშლა ვერ მოხერხდა" });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (id, isPaid) => {
    return updateOneTimeInvoice(id, { status: isPaid ? 'paid' : 'unpaid' });
  };

  return {
    loading, fetchOneTimeInvoices, fetchOneTimeInvoiceById, createOneTimeInvoice,
    updateOneTimeInvoice, deleteOneTimeInvoice, markAsPaid, calculateProportionalAmount
  };
};
