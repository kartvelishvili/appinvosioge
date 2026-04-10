import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownAZ, Calendar as CalendarIcon, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ka } from 'date-fns/locale';

const DetailedBreakdownModal = ({ isOpen, onClose, data }) => {
  const [sortBy, setSortBy] = useState('date'); // 'amount', 'date', 'status'

  if (!isOpen || !data) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> გადახდილი</span>;
      case 'overdue':
        return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> ვადაგადაცილებული</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> გადაუხდელი</span>;
    }
  };

  const sortedInvoices = [...data.invoices].sort((a, b) => {
    if (sortBy === 'amount') return b.total_amount - a.total_amount;
    if (sortBy === 'status') return a.calculatedStatus.localeCompare(b.calculatedStatus);
    // date
    return new Date(b.invoice_date || b.created_at) - new Date(a.invoice_date || a.created_at);
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-800">დეტალური რეპორტი</h2>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                <CalendarIcon className="w-4 h-4" /> პერიოდი: <strong className="text-slate-700">{data.name}</strong>
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-200">
              <X className="h-5 w-5 text-slate-500" />
            </Button>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 bg-white">
            <div className="p-4 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">სულ</p>
              <p className="text-lg font-mono font-black text-slate-800">{Number(data.total).toLocaleString()} ₾</p>
            </div>
            <div className="p-4 text-center bg-emerald-50/30">
              <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">გადახდილი</p>
              <p className="text-lg font-mono font-bold text-emerald-600">{Number(data.paid).toLocaleString()} ₾</p>
              <p className="text-xs text-emerald-500 font-medium mt-0.5">{((data.paid / (data.total || 1)) * 100).toFixed(1)}%</p>
            </div>
            <div className="p-4 text-center bg-slate-50/50">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">გადაუხდელი</p>
              <p className="text-lg font-mono font-bold text-slate-600">{Number(data.unpaid).toLocaleString()} ₾</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{((data.unpaid / (data.total || 1)) * 100).toFixed(1)}%</p>
            </div>
            <div className="p-4 text-center bg-red-50/30">
              <p className="text-[10px] uppercase font-bold text-red-600 mb-1">ვადაგადაცილებული</p>
              <p className="text-lg font-mono font-bold text-red-600">{Number(data.overdue).toLocaleString()} ₾</p>
              <p className="text-xs text-red-500 font-medium mt-0.5">{((data.overdue / (data.total || 1)) * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* List Controls */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-600">{sortedInvoices.length} ინვოისი</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSortBy('date')} className={`h-8 text-xs ${sortBy==='date'?'bg-indigo-50 text-indigo-600 border-indigo-200':''}`}>თარიღით</Button>
              <Button variant="outline" size="sm" onClick={() => setSortBy('amount')} className={`h-8 text-xs ${sortBy==='amount'?'bg-indigo-50 text-indigo-600 border-indigo-200':''}`}>თანხით</Button>
              <Button variant="outline" size="sm" onClick={() => setSortBy('status')} className={`h-8 text-xs ${sortBy==='status'?'bg-indigo-50 text-indigo-600 border-indigo-200':''}`}>სტატუსით</Button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 bg-slate-50/30">
            {sortedInvoices.length > 0 ? (
              <div className="space-y-2 px-4">
                {sortedInvoices.map(inv => (
                  <div key={inv.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-mono font-bold text-slate-800">{inv.invoice_number}</p>
                          {getStatusBadge(inv.calculatedStatus)}
                        </div>
                        <p className="text-sm font-medium text-slate-600">{inv.clients?.company_name || inv.clients?.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{format(new Date(inv.invoice_date || inv.created_at), 'dd MMM yyyy', { locale: ka })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-mono font-black text-slate-800">{Number(inv.total_amount).toLocaleString()} ₾</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <FileText className="w-12 h-12 mb-3 opacity-20" />
                <p>ამ პერიოდში ინვოისები არ მოიძებნა</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DetailedBreakdownModal;