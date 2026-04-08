import React from 'react';
import { motion } from 'framer-motion';
import { FileText, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

const QuickStatistics = ({ invoices, oneTimeInvoices = [] }) => {
  // Regular Invoices Stats
  const regularTotalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
  const regularPaidRevenue = invoices
    .filter(inv => inv.payment_status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);

  // One-Time Invoices Stats
  const oneTimeTotalRevenue = oneTimeInvoices.reduce((sum, inv) => sum + parseFloat(inv.calculated_amount || 0), 0);
  const oneTimePaidRevenue = oneTimeInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.calculated_amount || 0), 0);

  // Combined Stats
  const totalInvoicesCount = invoices.length + oneTimeInvoices.length;
  const totalRevenue = regularTotalRevenue + oneTimeTotalRevenue;
  const paidRevenue = regularPaidRevenue + oneTimePaidRevenue;
  const unpaidRevenue = totalRevenue - paidRevenue;

  const cards = [
    { 
      label: 'სულ ინვოისი', 
      value: totalInvoicesCount, 
      icon: FileText, 
      color: 'bg-blue-500', 
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      label: 'სრული შემოსავალი', 
      value: `${totalRevenue.toLocaleString()} ₾`, 
      icon: DollarSign, 
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    { 
      label: 'გადახდილი', 
      value: `${paidRevenue.toLocaleString()} ₾`, 
      icon: CheckCircle, 
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      label: 'გადასახდელი', 
      value: `${unpaidRevenue.toLocaleString()} ₾`, 
      icon: AlertCircle, 
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
              <h3 className={`text-2xl font-black ${card.textColor}`}>{card.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${card.bgColor}`}>
              <card.icon className={`h-6 w-6 ${card.textColor}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default QuickStatistics;