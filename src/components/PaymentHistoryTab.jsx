import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertOctagon, History } from 'lucide-react';
import { formatDateDDMMYYYY } from '@/utils/formatDate';

const PaymentHistoryTab = ({ invoices }) => {
  // We use paid invoices as proxy for payments since partials are removed
  const payments = invoices
    .filter(inv => inv.payment_status === 'paid')
    .sort((a, b) => new Date(b.paid_date) - new Date(a.paid_date));

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <History className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">გადახდები არ მოიძებნა</h3>
        <p className="text-slate-500">ამ კლიენტს ჯერ გადახდები არ განუხორციელებია</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">გადახდის თარიღი</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ინვოისი #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">თანხა</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">სტატუსი</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">დაგვიანება</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {payments.map((payment, index) => {
               const isLate = payment.payment_timing === 'late';
               return (
                  <motion.tr 
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                      {formatDateDDMMYYYY(payment.paid_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">
                      {payment.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      {parseFloat(payment.total_amount).toLocaleString()} {payment.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isLate ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                          {isLate ? <AlertOctagon className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          {isLate ? 'დაგვიანებული' : 'დროული'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                       {isLate ? (
                           <span className="text-red-600">{payment.payment_delay_days} დღე</span>
                       ) : <span className="text-slate-400">-</span>}
                    </td>
                  </motion.tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistoryTab;