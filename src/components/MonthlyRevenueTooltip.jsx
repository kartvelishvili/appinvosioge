import React from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const MonthlyRevenueTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const { planned, actual, invoices } = data;

    const getStatusIcon = (status, isOverdue) => {
      if (status === 'paid') return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      if (isOverdue) return <AlertTriangle className="w-3 h-3 text-red-500" />;
      return <Clock className="w-3 h-3 text-slate-400" />;
    };

    return (
      <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200 shadow-xl rounded-xl w-72 z-50">
        <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100 capitalize">{label}</h4>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#bfdbfe]"></span>
              დაგეგმილი
            </span>
            <span className="font-mono font-bold text-slate-700">{planned.toLocaleString()} ₾</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
              რეალური
            </span>
            <span className="font-mono font-bold text-emerald-600">{actual.toLocaleString()} ₾</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">ინვოისები ({invoices?.length || 0})</p>
          <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {invoices && invoices.length > 0 ? (
              invoices.map((inv) => {
                const isOverdue = inv.payment_status !== 'paid' && new Date(inv.due_date) < new Date();
                return (
                  <div key={inv.id} className="flex justify-between items-center text-xs bg-slate-50/50 p-1.5 rounded">
                    <div className="flex flex-col truncate pr-2">
                      <span className="font-mono font-medium text-slate-700">{inv.invoice_number}</span>
                      <span className="text-slate-500 truncate text-[10px]">{inv.clients?.company_name || inv.clients?.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="font-mono font-semibold text-slate-800">{Number(inv.total_amount).toLocaleString()} ₾</span>
                      {getStatusIcon(inv.payment_status, isOverdue)}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center italic py-2">მონაცემი არ მოიძებნა</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MonthlyRevenueTooltip;