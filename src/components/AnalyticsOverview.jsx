import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import { Building, FileText, TrendingUp, AlertTriangle, CheckCircle, Clock, Users, ArrowRight } from 'lucide-react';
import { isBefore, startOfDay } from 'date-fns';

const AnalyticsOverview = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [invRes, clientRes] = await Promise.all([
        supabase.from('invoices').select('*, clients(id, company, name)').order('created_at', { ascending: false }),
        supabase.from('clients').select('*')
      ]);
      setInvoices(invRes.data || []);
      setClients(clientRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const analytics = useMemo(() => {
    if (!invoices.length) return null;
    const now = new Date();

    const totalCount = invoices.length;
    const paidInvoices = invoices.filter(i => i.payment_status === 'paid');
    const unpaidInvoices = invoices.filter(i => i.payment_status !== 'paid');
    const overdueInvoices = unpaidInvoices.filter(i => isBefore(new Date(i.due_date), startOfDay(now)));

    const totalRevenue = invoices.reduce((s, i) => s + parseFloat(i.total || i.amount || 0), 0);
    const paidTotal = paidInvoices.reduce((s, i) => s + parseFloat(i.total || i.amount || 0), 0);

    // Top clients by revenue
    const clientMap = {};
    invoices.forEach(inv => {
      const clientId = inv.client_id;
      const clientName = inv.clients?.company || inv.clients?.name || 'უცნობი';
      if (!clientMap[clientId]) {
        clientMap[clientId] = { id: clientId, name: clientName, total: 0, paid: 0, count: 0, paidCount: 0 };
      }
      const amount = parseFloat(inv.total || inv.amount || 0);
      clientMap[clientId].total += amount;
      clientMap[clientId].count++;
      if (inv.payment_status === 'paid') {
        clientMap[clientId].paid += amount;
        clientMap[clientId].paidCount++;
      }
    });
    const topClients = Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 5);

    // Monthly trend (last 6 months)
    const monthlyData = {};
    invoices.forEach(inv => {
      const d = new Date(inv.invoice_date || inv.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) monthlyData[key] = { month: key, count: 0, total: 0 };
      monthlyData[key].count++;
      monthlyData[key].total += parseFloat(inv.total || inv.amount || 0);
    });
    const monthly = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

    return {
      totalCount, paidCount: paidInvoices.length, unpaidCount: unpaidInvoices.length,
      overdueCount: overdueInvoices.length, totalRevenue, paidTotal,
      collectionRate: totalRevenue > 0 ? ((paidTotal / totalRevenue) * 100).toFixed(1) : 0,
      topClients, monthly, activeClients: clients.filter(c => c.status === 'active').length
    };
  }, [invoices, clients]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (!analytics) return <div className="text-center py-12 text-slate-400">მონაცემი არ მოიძებნა</div>;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-indigo-100"><FileText className="h-5 w-5 text-indigo-600" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase">სულ ინვოისები</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{analytics.totalCount}</div>
          <div className="text-xs text-slate-400 mt-1">{analytics.paidCount} გადახდილი • {analytics.unpaidCount} გადასახდელი</div>
        </motion.div>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.05}} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-green-100"><TrendingUp className="h-5 w-5 text-green-600" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase">სრული შემოსავალი</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{analytics.totalRevenue.toLocaleString()} <span className="text-lg text-slate-400">₾</span></div>
          <div className="text-xs text-green-500 mt-1">საინკასო {analytics.collectionRate}%</div>
        </motion.div>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-100"><Users className="h-5 w-5 text-amber-600" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase">აქტიური კლიენტები</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{analytics.activeClients}</div>
          <div className="text-xs text-slate-400 mt-1">{clients.length} სულ</div>
        </motion.div>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className={`bg-white rounded-2xl p-5 shadow-sm border ${analytics.overdueCount > 0 ? 'border-red-200' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${analytics.overdueCount > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
              <AlertTriangle className={`h-5 w-5 ${analytics.overdueCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">ვადაგადაცილებული</span>
          </div>
          <div className={`text-3xl font-black ${analytics.overdueCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>{analytics.overdueCount}</div>
          <div className="text-xs text-slate-400 mt-1">ინვოისი</div>
        </motion.div>
      </div>

      {/* Top Clients */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">ტოპ კლიენტები შემოსავლით</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {analytics.topClients.map((client, idx) => (
            <div key={client.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate(`/clients/${client.id}`)}>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-300 w-5">{idx + 1}</span>
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800">{client.name}</p>
                  <p className="text-xs text-slate-400">{client.count} ინვოისი • {client.paidCount} გადახდილი</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black font-mono text-sm text-slate-900">{client.total.toLocaleString()} ₾</p>
                <p className="text-xs text-green-500">{client.paid.toLocaleString()} ₾ მიღებული</p>
              </div>
            </div>
          ))}
          {analytics.topClients.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-400">კლიენტები არ მოიძებნა</div>
          )}
        </div>
      </motion.div>

      {/* Monthly Activity */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">ყოველთვიური აქტივობა</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {analytics.monthly.map(m => {
            const [y, mon] = m.month.split('-');
            const monthNames = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];
            return (
              <div key={m.month} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <p className="text-xs font-bold text-slate-500">{monthNames[parseInt(mon) - 1]} {y}</p>
                <p className="text-lg font-black text-slate-900 mt-1">{m.count}</p>
                <p className="text-[10px] text-slate-400">ინვოისი</p>
                <p className="text-xs font-bold text-indigo-600 mt-1">{m.total.toLocaleString()} ₾</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsOverview;
