import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useEnhancedRevenueData } from '@/hooks/useEnhancedRevenueData';
import { getGeorgianMonthName } from '@/utils/georgianMonths';
import EnhancedMonthlyRevenueTooltip from './EnhancedMonthlyRevenueTooltip';
import { Loader2 } from 'lucide-react';

const EnhancedMonthlyRevenueChart = () => {
  const { data, loading, error } = useEnhancedRevenueData();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 text-sm">მონაცემები იტვირთება...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500 text-sm">შეცდომა: {error}</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    name: `${getGeorgianMonthName(d.date.getMonth())} ${d.date.getFullYear()}`
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-slate-100 p-6"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">თვის შემოსავალი პროგნოზი (გაუმჯობესებული)</h2>
        <p className="text-sm text-slate-500 mt-1">მიმდინარე და წინა თვის მონაცემები</p>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748b', fontSize: 12}} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748b', fontSize: 12}} 
              tickFormatter={(val) => `${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
            />
            <Tooltip 
              content={<EnhancedMonthlyRevenueTooltip />} 
              cursor={{ fill: '#f8fafc' }}
            />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
            />
            <Bar dataKey="paid" stackId="a" name="გადახდილი" fill="#10B981" maxBarSize={50} />
            <Bar dataKey="unpaid" stackId="a" name="გადაუხდელი" fill="#E5E7EB" maxBarSize={50} />
            <Bar dataKey="overdue" stackId="a" name="ვადაგადაცილებული" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="planned" name="დაგეგმილი" fill="#bfdbfe" radius={[4, 4, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default EnhancedMonthlyRevenueChart;