
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, CheckCircle, Clock } from 'lucide-react';
import DateCell from '@/components/DateCell';
import { formatDateDDMMYYYY } from '@/utils/formatDate';
import { Button } from '@/components/ui/button';

const ClientInvoicesTab = ({ invoices }) => {
  const navigate = useNavigate();

  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">ინვოისები არ მოიძებნა</h3>
        <p className="text-slate-500">ამ კლიენტისთვის ინვოისები ჯერ არ შექმნილა</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ინვოისი #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">თანხა</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">შექმნილია</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ვადა</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">სერვისის პერიოდი</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">საანგარიშო თვე</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">სტატუსი</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {invoices.map((invoice, index) => {
              const isPaid = invoice.payment_status === 'paid';
              return (
                <motion.tr 
                  key={invoice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                    {invoice.invoice_number}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {parseFloat(invoice.amount).toLocaleString()} {invoice.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <DateCell date={invoice.invoice_date} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <DateCell date={invoice.due_date} />
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                        {invoice.service_period_start ? (
                            <span>{formatDateDDMMYYYY(invoice.service_period_start)} - {formatDateDDMMYYYY(invoice.service_period_end)}</span>
                        ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-700">
                        {invoice.service_month || '-'}
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        isPaid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                    }`}>
                        {isPaid ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {isPaid ? 'გადახდილი' : 'გადასახდელი'}
                    </span>
                     {isPaid && invoice.paid_date && (
                        <div className="text-[10px] text-slate-500 mt-1 pl-1">
                            {formatDateDDMMYYYY(invoice.paid_date)}
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-600">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
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

export default ClientInvoicesTab;
