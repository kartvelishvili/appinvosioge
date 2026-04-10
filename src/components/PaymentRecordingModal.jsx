import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const PaymentRecordingModal = ({ isOpen, onClose, invoice, onPaymentSuccess }) => {
  const { toast } = useToast();
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Update invoice payment status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          payment_status: 'paid'
        })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      toast({
        title: "გადახდა დაფიქსირდა",
        description: "ინვოისი მონიშნულია როგორც გადახდილი",
        className: "bg-green-50 border-green-200"
      });

      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: "გადახდის დაფიქსირება ვერ მოხერხდა"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>გადახდის დაფიქსირება</DialogTitle>
          <DialogDescription>
            ინვოისი #{invoice?.invoice_number}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="payment-date">გადახდის თარიღი</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-600">
             <div className="flex justify-between mb-1">
                <span>გადასახდელი თანხა:</span>
                <span className="font-bold">{parseFloat(invoice?.total || 0).toLocaleString()} {invoice?.currency}</span>
             </div>
             <div className="flex justify-between text-xs text-slate-500">
                <span>გადახდის ვადა:</span>
                <span>{new Date(invoice?.due_date).toLocaleDateString('ka-GE')}</span>
             </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>გაუქმება</Button>
          <Button onClick={handlePayment} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? 'იწერება...' : 'დადასტურება'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentRecordingModal;