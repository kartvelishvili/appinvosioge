import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertOctagon, TrendingDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateDDMMYYYY } from '@/utils/formatDate';

const PaymentDelaySection = ({ invoices }) => {
  const paidInvoices = invoices.filter(inv => inv.payment_status === 'paid');
  
  if (paidInvoices.length === 0) return null;

  const onTimePayments = paidInvoices.filter(inv => inv.payment_timing === 'on-time' || !inv.payment_timing); // Assuming old/migrated are on-time or null
  const latePayments = paidInvoices.filter(inv => inv.payment_timing === 'late');
  
  const totalLateDays = latePayments.reduce((sum, inv) => sum + (inv.payment_delay_days || 0), 0);
  const avgDelay = latePayments.length > 0 ? Math.round(totalLateDays / latePayments.length) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">სულ გადახდები</CardTitle>
                <CheckCircle className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paidInvoices.length}</div>
              </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-600">დაგვიანებული</CardTitle>
                <AlertOctagon className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{latePayments.length}</div>
                <p className="text-xs text-slate-500">გადახდა</p>
              </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-600">საშუალო დაგვიანება</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{avgDelay} დღე</div>
                <p className="text-xs text-slate-500">მხოლოდ დაგვიანებულებზე</p>
              </CardContent>
          </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-green-50 px-4 py-3 border-b border-green-100 flex items-center gap-2">
                 <CheckCircle className="h-4 w-4 text-green-600" />
                 <h3 className="font-bold text-green-800 text-sm">დროული გადახდები ({onTimePayments.length})</h3>
             </div>
             <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                 {onTimePayments.length > 0 ? onTimePayments.slice(0, 10).map(inv => (
                     <div key={inv.id} className="px-4 py-3 flex justify-between items-center text-sm">
                         <div>
                             <span className="font-medium text-slate-700">{inv.invoice_number}</span>
                             <div className="text-xs text-slate-500">{formatDateDDMMYYYY(inv.paid_date)}</div>
                         </div>
                         <span className="font-bold text-slate-900">{parseFloat(inv.total_amount).toLocaleString()} {inv.currency}</span>
                     </div>
                 )) : <p className="p-4 text-sm text-slate-500 text-center">მონაცემები არ არის</p>}
             </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center gap-2">
                 <Clock className="h-4 w-4 text-red-600" />
                 <h3 className="font-bold text-red-800 text-sm">დაგვიანებული გადახდები ({latePayments.length})</h3>
             </div>
             <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                 {latePayments.length > 0 ? latePayments.map(inv => (
                     <div key={inv.id} className="px-4 py-3 flex justify-between items-center text-sm">
                         <div>
                             <span className="font-medium text-slate-700">{inv.invoice_number}</span>
                             <div className="text-xs text-red-500 font-medium">დაგვიანდა {inv.payment_delay_days} დღით</div>
                         </div>
                         <div className="text-right">
                            <div className="font-bold text-slate-900">{parseFloat(inv.total_amount).toLocaleString()} {inv.currency}</div>
                            <div className="text-xs text-slate-400">{formatDateDDMMYYYY(inv.paid_date)}</div>
                         </div>
                     </div>
                 )) : <p className="p-4 text-sm text-slate-500 text-center">მონაცემები არ არის</p>}
             </div>
          </div>
      </div>
    </motion.div>
  );
};

export default PaymentDelaySection;