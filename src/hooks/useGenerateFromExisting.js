import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useGenerateFromExisting = (onSuccess) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const calculateNextPeriod = (prevEndStr) => {
      if (!prevEndStr) return { start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };
      
      const prevEnd = new Date(prevEndStr);
      
      // Start is day after previous end
      const nextStart = new Date(prevEnd);
      nextStart.setDate(prevEnd.getDate() + 1);
      
      // End is one month after nextStart (minus 1 day generally, or same day next month relative to start)
      // Standard monthly billing usually: Jan 1 - Jan 31 -> Feb 1 - Feb 28
      const nextEnd = new Date(nextStart);
      nextEnd.setMonth(nextStart.getMonth() + 1);
      nextEnd.setDate(nextEnd.getDate() - 1); // Subtract 1 day to encompass the full month period accurately

      return {
          start: nextStart.toISOString().split('T')[0],
          end: nextEnd.toISOString().split('T')[0]
      };
  };

  const generateFromExisting = async (invoice) => {
    setGenerating(true);
    try {
      const { start, end } = calculateNextPeriod(invoice.service_period_end);

      const payload = {
          contract_id: invoice.contract_id,
          client_id: invoice.client_id,
          contractor_id: invoice.performer_id,
          amount: invoice.subtotal || invoice.total_amount, // Prefer subtotal before tax if available logic allows, but prompt says "copied amount"
          vat: invoice.vat_percentage || 18,
          service_period_start: start,
          service_period_end: end,
          status: 'პენდინგი',
          source_invoice_id: invoice.id,
          notes: `გენერირებულია ინვოისიდან #${invoice.invoice_number}`
      };

      const { error } = await supabase
        .from('auto_invoices')
        .insert([payload]);

      if (error) throw error;

      toast({ 
          title: "გენერირებულია", 
          description: `ახალი აუტო-ინვოისი შეიქმნა პერიოდისთვის: ${start} - ${end}` 
      });

      if (onSuccess) onSuccess();
      return true;

    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: error.message });
      return false;
    } finally {
      setGenerating(false);
    }
  };

  const batchGenerate = async (invoices) => {
      setGenerating(true);
      let successCount = 0;
      let failCount = 0;

      for (const invoice of invoices) {
          try {
            const { start, end } = calculateNextPeriod(invoice.service_period_end);
            const payload = {
                contract_id: invoice.contract_id,
                client_id: invoice.client_id,
                contractor_id: invoice.performer_id,
                amount: invoice.subtotal || invoice.total_amount,
                vat: invoice.vat_percentage || 18,
                service_period_start: start,
                service_period_end: end,
                status: 'პენდინგი',
                source_invoice_id: invoice.id,
                notes: `Batch generated from #${invoice.invoice_number}`
            };

            const { error } = await supabase.from('auto_invoices').insert([payload]);
            if (error) throw error;
            successCount++;
          } catch (e) {
              console.error(e);
              failCount++;
          }
      }

      setGenerating(false);
      toast({
          title: "დასრულდა",
          description: `გენერირდა: ${successCount}, ვერ მოხერხდა: ${failCount}`
      });
      
      if (onSuccess) onSuccess();
  };

  return {
    generating,
    generateFromExisting,
    batchGenerate
  };
};