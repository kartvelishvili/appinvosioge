import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { formatDateDDMMYYYY } from '@/utils/formatDate';

const OneTimeInvoicesSection = () => {
  const navigate = useNavigate();
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [stats, setStats] = useState({ count: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0,0,0,0);

      // Fetch recent 5
      const { data, error } = await supabase
        .from('one_time_invoices')
        .select(`
          *, 
          clients(company_name, logo_url),
          performers(name, logo_url)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentInvoices(data || []);

      // Fetch stats for current month
      const { data: monthData } = await supabase
        .from('one_time_invoices')
        .select('calculated_amount')
        .gte('created_at', startOfMonth.toISOString());

      const revenue = monthData?.reduce((sum, inv) => sum + (parseFloat(inv.calculated_amount) || 0), 0) || 0;
      setStats({
        count: monthData?.length || 0,
        revenue
      });

    } catch (error) {
      console.error('Error fetching one-time invoices section data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm animate-pulse h-64">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-slate-100 rounded-lg"></div>
          <div className="h-12 bg-slate-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-violet-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-violet-100 bg-violet-50/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-100 rounded-lg">
            <Zap className="h-4 w-4 text-violet-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">ერთჯერადი ინვოისები</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/one-time-invoices')}
          className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 text-xs"
        >
          ყველას ნახვა
        </Button>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4 border-b border-violet-50">
        <div className="p-3 bg-violet-50 rounded-lg">
          <p className="text-xs text-violet-600 font-medium mb-1">მიმდინარე თვეში</p>
          <p className="text-xl font-bold text-slate-900">{stats.revenue.toLocaleString()} ₾</p>
        </div>
        <div className="p-3 bg-violet-50 rounded-lg">
          <p className="text-xs text-violet-600 font-medium mb-1">რაოდენობა</p>
          <p className="text-xl font-bold text-slate-900">{stats.count}</p>
        </div>
      </div>

      <div className="divide-y divide-violet-50">
        {recentInvoices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            ჯერ არ არის ერთჯერადი ინვოისები
          </div>
        ) : (
          recentInvoices.map((invoice) => (
            <motion.div 
              key={invoice.id}
              whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.03)' }}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              onClick={() => navigate(`/one-time-invoices/${invoice.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold flex-shrink-0">
                  {invoice.clients?.company_name?.[0] || 'C'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{invoice.clients?.company_name}</h4>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDateDDMMYYYY(invoice.service_period_start)}</span>
                    </div>
                    {invoice.performers && (
                      <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium">
                        <User className="h-3 w-3" />
                        <span>{invoice.performers.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-12 sm:pl-0">
                <div className="text-right">
                  <p className="font-bold text-slate-900">{parseFloat(invoice.calculated_amount).toLocaleString()} ₾</p>
                  <p className={`text-xs font-medium ${invoice.status === 'paid' ? 'text-green-600' : 'text-slate-500'}`}>
                    {invoice.status === 'paid' ? 'გადახდილი' : 'გადასახდელი'}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-violet-600 transition-colors" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default OneTimeInvoicesSection;