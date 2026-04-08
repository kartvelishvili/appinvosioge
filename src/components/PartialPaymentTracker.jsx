import React from 'react';
import { motion } from 'framer-motion';
import { formatDateDDMMYYYY } from '@/utils/formatDate';
import { useCompanyBoost } from '@/hooks/useCompanyBoost';

const PartialPaymentTracker = ({ invoices, payments }) => {
  const { boostEnabled } = useCompanyBoost();

  if (!boostEnabled) return null;

  // Filter only unpaid or partial invoices
  const activeInvoices = invoices.filter(inv => {
    const total = parseFloat(inv.total_amount);
    const paid = parseFloat(inv.paid_amount || 0);
    return paid < total;
  });

  if (activeInvoices.length === 0) return null;

  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-lg font-bold text-slate-900">გადახდების პროგრესი (Boost)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeInvoices.map((invoice, idx) => {
            const total = parseFloat(invoice.total_amount);
            const paid = parseFloat(invoice.paid_amount || 0);
            const remaining = total - paid;
            const percentage = Math.min(100, (paid / total) * 100);
            
            // Find payments related to this invoice
            const invoicePayments = payments.filter(p => p.invoice_id === invoice.id);

            return (
                <motion.div 
                    key={invoice.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                {invoice.invoice_number}
                            </span>
                            <div className="mt-2 font-bold text-slate-800">
                                {total.toLocaleString()} {invoice.currency}
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-xs text-slate-500 mb-1">ნაშთი</div>
                             <div className="font-bold text-orange-600">
                                {remaining.toLocaleString()} {invoice.currency}
                             </div>
                        </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                        <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>

                    {invoicePayments.length > 0 ? (
                        <div className="bg-slate-50 rounded-lg p-3 text-sm">
                            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">გადახდების ისტორია</p>
                            <div className="space-y-2">
                                {invoicePayments.map(p => (
                                    <div key={p.id} className="flex justify-between text-slate-700 text-xs border-b border-slate-200 last:border-0 pb-1 last:pb-0">
                                        <span>{formatDateDDMMYYYY(p.payment_date)}</span>
                                        <span className="font-medium">+{parseFloat(p.amount).toLocaleString()} ₾</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic">გადახდები ჯერ არ ფიქსირდება</p>
                    )}
                </motion.div>
            );
        })}
      </div>
    </div>
  );
};

export default PartialPaymentTracker;