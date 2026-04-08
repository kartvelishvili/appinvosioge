
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useAutoInvoices = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, clients(company)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchGeneratedInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('auto_invoices')
        .select(`*, clients (company)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const generateInvoice = async (invoiceData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('auto_invoices')
        .insert([{ ...invoiceData, status: 'პენდინგი' }]);

      if (error) throw error;
      toast({ title: "წარმატება", description: "აუტო ინვოისი შეიქმნა" });
      await fetchGeneratedInvoices();
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const transferInvoice = async (invoice, dueDate) => {
    setLoading(true);
    try {
        const { data: lastInv } = await supabase.from('invoices').select('invoice_number').order('created_at', { ascending: false }).limit(1);
        let newNumber = 'INV-AUTO-001';
        if (lastInv && lastInv.length > 0) {
             const lastNum = lastInv[0].invoice_number;
             const numPart = parseInt(lastNum.split('-')[1] || lastNum.replace(/\D/g,'') || 0) + 1;
             newNumber = `INV-${String(numPart).padStart(7, '0')}`;
        }

        const subtotal = parseFloat(invoice.amount) || 0;
        const tax_rate = 18; // Defaulting to 18 for now, or get from user profile
        const tax_amount = subtotal * (tax_rate / 100);
        const total = subtotal + tax_amount;

        const { data: newInv, error: invError } = await supabase.from('invoices').insert({
            client_id: invoice.client_id,
            invoice_number: newNumber,
            invoice_date: new Date().toISOString(),
            due_date: dueDate,
            status: 'active',
            payment_status: 'unpaid',
            subtotal,
            tax_rate,
            tax_amount,
            total,
            amount: total,
            is_draft: false,
            created_at: new Date().toISOString()
        }).select().single();

        if (invError) throw invError;

        await supabase.from('invoice_items').insert({
            invoice_id: newInv.id,
            description: 'მომსახურების საფასური (ავტომატური)',
            quantity: 1,
            unit_price: subtotal,
            line_total: subtotal
        });

        const { error: updateError } = await supabase
            .from('auto_invoices')
            .update({ status: 'გადატანილი' })
            .eq('id', invoice.id);

        if (updateError) throw updateError;

        toast({ title: "წარმატება", description: "ინვოისი წარმატებით გადავიდა აქტიურებში" });
        await fetchGeneratedInvoices();
    } catch (error) {
        toast({ variant: "destructive", title: "შეცდომა", description: error.message });
    } finally {
        setLoading(false);
    }
  };
  
  const bulkTransferInvoices = async (selectedInvoices) => {
      for (const inv of selectedInvoices) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 5);
          await transferInvoice(inv, dueDate.toISOString().split('T')[0]);
      }
  };

  const deleteInvoice = async (id) => {
      if(!window.confirm("ნამდვილად გსურთ წაშლა?")) return;
      setLoading(true);
      try {
          const { error } = await supabase.from('auto_invoices').delete().eq('id', id);
          if(error) throw error;
          toast({ title: "წაიშალა", description: "ჩანაწერი წაიშალა" });
          await fetchGeneratedInvoices();
      } catch (error) {
          toast({ variant: "destructive", title: "შეცდომა", description: error.message });
      } finally {
          setLoading(false);
      }
  };

  const replaceInvoice = async (oldId, newData) => {
      setLoading(true);
      try {
          await supabase.from('auto_invoices').delete().eq('id', oldId);
          await generateInvoice(newData);
          toast({ title: "ჩანაცვლდა", description: "ინვოისი წარმატებით ჩანაცვლდა" });
      } catch (error) {
           toast({ variant: "destructive", title: "შეცდომა", description: error.message });
      } finally {
          setLoading(false);
      }
  };

  const toggleAutoGeneration = async (contractId, status) => {
      try {
          const { error } = await supabase
            .from('contracts')
            .update({ auto_generation_enabled: status })
            .eq('id', contractId);
          if(error) throw error;
          setContracts(prev => prev.map(c => c.id === contractId ? { ...c, auto_generation_enabled: status } : c));
          toast({ title: "განახლდა", description: `ავტო-გენერაცია ${status ? 'ჩაირთო' : 'გამოირთო'}` });
      } catch (error) {
          toast({ variant: "destructive", title: "შეცდომა", description: error.message });
      }
  };

  return {
    loading, contracts, invoices, fetchContracts, fetchGeneratedInvoices,
    generateInvoice, transferInvoice, bulkTransferInvoices, deleteInvoice,
    replaceInvoice, toggleAutoGeneration
  };
};
