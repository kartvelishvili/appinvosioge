import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/lib/customSupabaseClient';
import { startOfMonth, addMonths, format, endOfMonth, isWithinInterval } from 'date-fns';
import { ka } from 'date-fns/locale';
import EnhancedMonthlyRevenueTooltip from './EnhancedMonthlyRevenueTooltip';
import { Loader2 } from 'lucide-react';

const MonthlyRevenueForecast = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecastData();
  }, []);

  const fetchForecastData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const targetMonthEnd = endOfMonth(addMonths(now, 3)); // Current + next 3

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, payment_status, due_date, clients(name, company_name)')
        .gte('due_date', currentMonthStart.toISOString())
        .lte('due_date', targetMonthEnd.toISOString());

      if (error) throw error;

      // Generate next 4 months layout
      const monthsData = Array.from({ length: 4 }).map((_, i) => {
        const monthDate = addMonths(currentMonthStart, i);
        return {
          monthKey: format(monthDate, 'yyyy-MM'),
          name: format(monthDate, 'MMM yyyy', { locale: ka }),
          planned: 0,
          actual: 0,
          paid: 0,
          unpaid: 0,
          overdue: 0,
          invoices: [],
          monthStart: startOfMonth(monthDate),
          monthEnd: endOfMonth(monthDate)
        };
      });

      // Populate data
      (invoices || []).forEach(inv => {
        const dueDate = new Date(inv.due_date);
        const amount = parseFloat(inv.total_amount || 0);
        
        const monthObj = monthsData.find(m => isWithinInterval(dueDate, { start: m.monthStart, end: m.monthEnd }));
        
        if (monthObj) {
          monthObj.planned += amount;
          if (inv.payment_status === 'paid') {
            monthObj.actual += amount;
            monthObj.paid += amount;
          } else {
             if (new Date(inv.due_date) < new Date()) {
                 monthObj.overdue += amount;
             } else {
                 monthObj.unpaid += amount;
             }
          }
          monthObj.invoices.push(inv);
        }
      });

      setData(monthsData);
    } catch (err) {
      console.error('Error fetching forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 text-sm">მონაცემები იტვირთება...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-slate-100 p-6"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">თვის შემოსავალი პროგნოზი</h2>
        <p className="text-sm text-slate-500 mt-1">მიმდინარე და მომდევნო 3 თვის მონაცემები</p>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748b', fontSize: 12, textTransform: 'capitalize'}} 
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
            <Bar 
              dataKey="planned" 
              name="დაგეგმილი" 
              fill="#bfdbfe" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={50}
            />
            <Bar 
              dataKey="actual" 
              name="რეალური" 
              fill="#10B981" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default MonthlyRevenueForecast;