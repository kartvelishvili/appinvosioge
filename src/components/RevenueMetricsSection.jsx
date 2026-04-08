import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle, Clock, AlertTriangle, TrendingDown } from 'lucide-react';

const MetricCard = ({ title, amount, percentage, icon: Icon, colorClass, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5"
  >
    <div className={`p-4 rounded-xl ${colorClass.bg} ${colorClass.text}`}>
      <Icon className="h-7 w-7" />
    </div>
    <div>
      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-800 font-mono">
        {Number(amount || 0).toLocaleString('ka-GE')} <span className="text-lg text-slate-500">₾</span>
      </h3>
      {percentage !== undefined && (
        <p className="text-xs font-semibold mt-1 flex items-center gap-1 text-slate-500">
          <span className={colorClass.text}>{percentage}%</span> სრული შემოსავლიდან
        </p>
      )}
    </div>
  </motion.div>
);

const RevenueMetricsSection = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      <MetricCard 
        title="სრული შემოსავალი" 
        amount={metrics.totalRevenue} 
        icon={DollarSign} 
        colorClass={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
        delay={0.1}
      />
      <MetricCard 
        title="გადახდილი" 
        amount={metrics.paidAmount} 
        icon={CheckCircle} 
        colorClass={{ bg: 'bg-emerald-100', text: 'text-emerald-500' }}
        delay={0.2}
      />
      <MetricCard 
        title="გადაუხდელი" 
        amount={metrics.unpaidAmount} 
        icon={Clock} 
        colorClass={{ bg: 'bg-slate-100', text: 'text-slate-500' }}
        delay={0.3}
      />
      <MetricCard 
        title="ვადაგადაცილებული" 
        amount={metrics.overdueAmount} 
        percentage={metrics.overduePercentage}
        icon={AlertTriangle} 
        colorClass={{ bg: 'bg-red-100', text: 'text-red-500' }}
        delay={0.4}
      />
    </div>
  );
};

export default RevenueMetricsSection;