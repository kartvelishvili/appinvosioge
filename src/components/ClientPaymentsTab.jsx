import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { formatDateDDMMYYYY } from '@/utils/formatDate';

const ClientPaymentsTab = ({ payments }) => {
  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-slate-400" />
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
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">თარიღი</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ინვოისი</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">თანხა</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">მეთოდი</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">სტატუსი</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {payments.map((payment, index) => (
              <motion.tr 
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-slate-50"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                  {formatDateDDMMYYYY(payment.payment_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">
                   {/* Fallback to Invoice ID if number not available via join */}
                  {payment.invoices?.invoice_number || 'INV-???'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                  {parseFloat(payment.amount).toLocaleString()} ₾
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 capitalize">
                  {payment.payment_method || 'Bank Transfer'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    წარმატებული
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientPaymentsTab;