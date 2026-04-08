import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertCircle, FileText, Rocket } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/customSupabaseClient';
import { calculateProportionalRevenue } from '@/utils/revenueUtils';
import { Button } from '@/components/ui/button';
import { isBoostInvoice, getRevenueAmount } from '@/utils/invoiceUtils';
import { getGeorgianMonthName } from '@/utils/georgianMonths';

const MonthlyDetailPage = () => {
  const { month, year } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [monthData, setMonthData] = useState(null);

  useEffect(() => {
    fetchMonthData();
  }, [month, year]);

  const fetchMonthData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(name, company_name)');
        
      if (error) throw error;

      const processedData = calculateProportionalRevenue(data);
      const currentMonthKey = `${String(month).padStart(2, '0')}-${year}`;
      const foundData = processedData.find(d => d.id === currentMonthKey);

      setMonthData(foundData || { 
          id: currentMonthKey, 
          monthName: getGeorgianMonthName(parseInt(month) - 1), 
          year,
          totalAmount: 0, 
          paidAmount: 0, 
          unpaidAmount: 0,
          invoices: [] 
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = useMemo(() => {
      if (!monthData) return [];
      return [
        { label: 'სულ დარიცხული (Rev)', value: `${monthData.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₾`, color: 'bg-indigo-50 text-indigo-700' },
        { label: 'გადახდილი', value: `${monthData.paidAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₾`, color: 'bg-green-50 text-green-700' },
        { label: 'გადასახდელი', value: `${monthData.unpaidAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₾`, color: 'bg-red-50 text-red-700' },
        { label: 'ინვოისები', value: monthData.invoices.length, color: 'bg-blue-50 text-blue-700' },
      ];
  }, [monthData]);

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
  );

  return (
    <>
      <Helmet><title>{monthData?.monthName} {year} - დეტალები</title></Helmet>
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
           <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6 hover:bg-white hover:shadow-sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> უკან დაფაზე
           </Button>

           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
                  <div>
                      <h1 className="text-3xl font-black text-slate-900 capitalize mb-2">
                        {monthData?.monthName} {year}
                      </h1>
                      <p className="text-slate-500">ფინანსური მიმოხილვა და ინვოისები</p>
                  </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  {statCards.map((stat, i) => (
                      <div key={i} className={`p-6 rounded-xl border border-slate-100 shadow-sm ${stat.color}`}>
                          <p className="text-xs font-bold uppercase opacity-70 mb-1">{stat.label}</p>
                          <p className="text-2xl font-black">{stat.value}</p>
                      </div>
                  ))}
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-indigo-600" />
                          ინვოისები ამ პერიოდში
                      </h3>
                      <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border">
                          პროპორციული დათვლა
                      </span>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100">
                          <thead className="bg-slate-50">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ინვოისი</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">კლიენტი</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">შემოსავალი (Rev)</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-indigo-600 uppercase bg-indigo-50/50">ამ თვის წილი</th>
                                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">დღეები</th>
                                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">სტატუსი</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {monthData?.invoices.map((inv) => {
                                  const isPaid = inv.payment_status === 'paid';
                                  const isBoost = isBoostInvoice(inv);
                                  const revenue = getRevenueAmount(inv);

                                  return (
                                      <tr key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)} className="hover:bg-slate-50 cursor-pointer group">
                                          <td className="px-6 py-4 text-sm font-bold text-indigo-600 font-mono group-hover:underline">{inv.invoice_number}</td>
                                          <td className="px-6 py-4 text-sm font-medium text-slate-700">{inv.clients?.company_name || inv.clients?.name}</td>
                                          <td className="px-6 py-4 text-sm text-slate-500">
                                            <div className="flex items-center gap-2">
                                                {revenue.toLocaleString()} ₾
                                                {isBoost && <Rocket className="h-3 w-3 text-indigo-500" title="Boost Invoice" />}
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 text-sm font-bold text-indigo-700 bg-indigo-50/30">
                                              {inv.allocated_amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ₾
                                          </td>
                                          <td className="px-6 py-4 text-center text-sm text-slate-600">{inv.days_in_month}</td>
                                          <td className="px-6 py-4 text-center">
                                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                  {isPaid ? <CheckCircle className="w-3 h-3"/> : <AlertCircle className="w-3 h-3"/>}
                                                  {isPaid ? 'გადახდილი' : 'გადასახდელი'}
                                              </span>
                                          </td>
                                      </tr>
                                  );
                              })}
                              {monthData?.invoices.length === 0 && (
                                  <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">ინვოისები არ მოიძებნა</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
           </motion.div>
        </div>
      </div>
    </>
  );
};

export default MonthlyDetailPage;