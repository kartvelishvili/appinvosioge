import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useExistingInvoices = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [groupedInvoices, setGroupedInvoices] = useState({});

  const fetchExistingInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (id, company_name),
          performers (id, name),
          contracts (id, contract_number)
        `)
        .not('contract_id', 'is', null) // Only fetch invoices linked to a contract
        .order('invoice_date', { ascending: false });

      if (error) throw error;

      // Group by contract (client_id + performer_id + contract_id)
      const grouped = (data || []).reduce((acc, invoice) => {
        const key = `${invoice.client_id}_${invoice.performer_id}_${invoice.contract_id}`;
        
        if (!acc[key]) {
          acc[key] = {
            clientName: invoice.clients?.company_name || 'Unknown Client',
            performerName: invoice.performers?.name || 'Unknown Performer',
            contractNumber: invoice.contracts?.contract_number || 'No Contract',
            contractId: invoice.contract_id,
            clientId: invoice.client_id,
            performerId: invoice.performer_id,
            invoices: []
          };
        }
        
        acc[key].invoices.push(invoice);
        return acc;
      }, {});

      setGroupedInvoices(grouped);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "შეცდომა", description: "ისტორიის წამოღება ვერ მოხერხდა" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteInvoice = async (id) => {
      // Basic check if payments exist (mock logic as strictly enforcing via FK is better, but UI check is good)
      // For this task, we will try to delete and catch FK errors if any
      try {
          const { error } = await supabase.from('invoices').delete().eq('id', id);
          if (error) throw error;
          
          toast({ title: "წაიშალა", description: "ინვოისი წარმატებით წაიშალა" });
          fetchExistingInvoices(); // Refresh list
          return true;
      } catch (error) {
          toast({ 
              variant: "destructive", 
              title: "შეცდომა", 
              description: "ვერ წაიშალა. შესაძლოა ინვოისზე მიბმულია გადახდები." 
          });
          return false;
      }
  };

  return {
    loading,
    groupedInvoices,
    fetchExistingInvoices,
    deleteInvoice
  };
};