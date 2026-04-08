import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Calendar } from 'lucide-react';

const MonthlyBreakdownList = ({ data }) => {
  const navigate = useNavigate();
  // Take last 12 months
  const listData = data.slice(0, 12);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 h-full flex flex-col">
       <div className="flex items-center justify-between mb-6">
        <div>
           <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
             <Calendar className="h-5 w-5 text-indigo-600" />
             თვიური რეპორტი
           </h3>
           <p className="text-sm text-slate-500 mt-1">ბოლო 12 თვე</p>
        </div>
      </div>

      <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
        <div className="space-y-3">
          {listData.map((item, index) => {
             const percentPaid = item.totalAmount > 0 ? (item.paidAmount / item.totalAmount) * 100 : 0;
             return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/monthly/${item.month + 1}/${item.year}`)}
                className="group flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-md cursor-pointer transition-all duration-200"
              >
                 <div className="flex flex-col">
                    <span className="font-bold text-slate-800 capitalize text-sm">{item.monthName} {item.year}</span>
                    <span className="text-xs text-slate-500 mt-0.5">{item.invoices.length} ინვოისი</span>
                 </div>
                 
                 <div className="text-right">
                    <p className="font-bold text-indigo-900 text-sm">{item.totalAmount.toLocaleString()} ₾</p>
                    <div className="flex items-center justify-end gap-2 text-xs mt-0.5">
                       <span className="text-green-600">{Math.round(percentPaid)}%</span>
                       <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                           <div className="h-full bg-green-500" style={{ width: `${percentPaid}%` }}></div>
                       </div>
                    </div>
                 </div>
                 
                 <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </motion.div>
             );
          })}
          {listData.length === 0 && (
             <div className="text-center py-10 text-slate-400 text-sm">მონაცემები არ არის</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyBreakdownList;