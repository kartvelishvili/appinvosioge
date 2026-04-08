import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { differenceInDays, isPast, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { formatDateDDMMYYYY } from '@/utils/formatDate';

const OverdueInvoicesSection = () => {
  const navigate = useNavigate();
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverdueInvoices = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('invoices')
          .select('*, clients(company_name, name)')
          .neq('payment_status', 'paid')
          .lt('due_date', today)
          .order('due_date', { ascending: true }); // Oldest due date first

        if (error) throw error;

        const processed = (data || []).map(inv => ({
          ...inv,
          daysOverdue: differenceInDays(new Date(), parseISO(inv.due_date))
        }));

        // Sort by most overdue
        processed.sort((a, b) => b.daysOverdue - a.daysOverdue);

        setOverdueInvoices(processed);
      } catch (error) {
        console.error('Error fetching overdue invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverdueInvoices();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-slate-100 rounded-lg"></div>
          <div className="h-16 bg-slate-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (overdueInvoices.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-green-100 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">დაგვიანებული ინვოისები არ არის</h3>
        <p className="text-slate-500 text-sm mt-1">ყველაფერი კონტროლის ქვეშაა! 🎉</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-red-100 bg-red-50/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-bold text-slate-800">დაგვიანებული ინვოისები</h2>
          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full border border-red-200">
            {overdueInvoices.length}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/invoices?status=unpaid')}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
        >
          ყველას ნახვა
        </Button>
      </div>

      <div className="divide-y divide-red-50">
        {overdueInvoices.slice(0, 5).map((invoice) => (
          <motion.div 
            key={invoice.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 hover:bg-red-50/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
            onClick={() => navigate(`/invoices/${invoice.id}`)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600 font-bold text-xs">
                {invoice.daysOverdue}დ
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{invoice.clients?.company_name || invoice.clients?.name}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="font-mono">{invoice.invoice_number}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateDDMMYYYY(invoice.due_date)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-12 sm:pl-0">
              <div className="text-right">
                <p className="font-bold text-slate-900">{parseFloat(invoice.total_amount).toLocaleString()} ₾</p>
                <p className="text-xs text-red-500 font-medium">ვადაგადაცილებული</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-red-500 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>
      
      {overdueInvoices.length > 5 && (
        <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-xs text-slate-500">კიდევ {overdueInvoices.length - 5} ინვოისი...</p>
        </div>
      )}
    </div>
  );
};

export default OverdueInvoicesSection;