import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, TrendingUp } from 'lucide-react';

const MonthlyRevenueChart = ({ data }) => {
  // Take last 6 months
  const chartData = data.slice(0, 6).reverse(); 

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
           <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
             <TrendingUp className="h-5 w-5 text-indigo-600" />
             ბოლო 6 თვის შემოსავალი
           </h3>
           <p className="text-sm text-slate-500 mt-1">პროპორციული გადანაწილება</p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-end gap-4 min-h-[300px]">
        {chartData.map((item, index) => {
           const percentPaid = item.totalAmount > 0 ? (item.paidAmount / item.totalAmount) * 100 : 0;
           return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
               <div className="flex justify-between items-center text-sm font-medium mb-1">
                  <span className="capitalize text-slate-700 font-bold">{item.monthName} {item.year}</span>
                  <span className="text-slate-900">{item.totalAmount.toLocaleString()} ₾</span>
               </div>
               
               <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                  {/* Total Bar Background (represents unpaid if we stack) */}
                  <div className="absolute top-0 left-0 h-full w-full bg-red-400 opacity-20"></div>
                  
                  {/* Paid Bar */}
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentPaid}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                  />
               </div>
               
               <div className="flex justify-between text-xs mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <span className="text-green-700 font-semibold">{item.paidAmount.toLocaleString()} ₾</span>
                  <span className="text-red-600 font-semibold">{item.unpaidAmount.toLocaleString()} ₾</span>
               </div>
            </motion.div>
           );
        })}
        {chartData.length === 0 && (
           <div className="flex items-center justify-center h-full text-slate-400 text-sm">მონაცემები არ არის</div>
        )}
      </div>
    </div>
  );
};

export default MonthlyRevenueChart;