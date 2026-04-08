
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

// Components
import QuickStatistics from '@/components/QuickStatistics';
import OverdueInvoicesSection from '@/components/OverdueInvoicesSection';
import MonthlyRevenueForecast from '@/components/MonthlyRevenueForecast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [oneTimeInvoices, setOneTimeInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch Regular Invoices
      const { data: regularData, error: regularError } = await supabase
        .from('invoices')
        .select('*, clients(name, company)')
        .order('created_at', { ascending: false });

      if (regularError) throw regularError;
      
      const { data: oneTimeData, error: oneTimeError } = await supabase
        .from('one_time_invoices')
        .select('*, clients(name, company), performers(name)');
      
      if (oneTimeError) throw oneTimeError;

      setInvoices(regularData || []);
      setOneTimeInvoices(oneTimeData || []);

    } catch (error) {
      console.error("Dashboard error:", error);
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: "მონაცემების ჩატვირთვა ვერ მოხერხდა.",
      });
    } finally {
      setLoading(false);
    }
  };

  const unpaidInvoices = invoices.filter(inv => inv.payment_status !== 'paid').slice(0, 5);

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
  );

  return (
    <>
      <Helmet><title>დაფა - Invoiso</title></Helmet>
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navbar />
        
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">მიმოხილვა</h1>
                <p className="text-slate-500 mt-1">სწრაფი წვდომა და ფინანსური მონაცემები</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={fetchDashboardData} className="gap-2 rounded-full h-10 px-5 bg-white shadow-sm border-slate-200 hover:bg-slate-50">
                  <RefreshCw className="h-4 w-4 text-indigo-500" /> განახლება
                </Button>
                <Button 
                  onClick={() => navigate('/invoices/create')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-10 px-6 shadow-lg shadow-indigo-200"
                >
                  <Plus className="h-4 w-4 mr-2" /> ახალი ინვოისი
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mb-8">
              <QuickStatistics invoices={invoices} oneTimeInvoices={oneTimeInvoices} />
            </div>

            {/* Grid Layout for Forecast and Overdue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
               <MonthlyRevenueForecast />
               <OverdueInvoicesSection invoices={invoices} />
            </div>

            {/* Unpaid Invoices Section */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        ბოლო გადასახდელი ინვოისები
                    </h3>
                    <Button variant="link" onClick={() => navigate('/invoices')} className="text-indigo-600 text-sm font-semibold">ყველას ნახვა</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ინვოისი #</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">კლიენტი</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">თანხა</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ვადა</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {unpaidInvoices.map((inv) => (
                                <tr key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700 font-mono">{inv.invoice_number}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{inv.clients?.company || inv.clients?.name}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{parseFloat(inv.total || inv.amount || 0).toLocaleString()} ₾</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(inv.due_date).toLocaleDateString('ka-GE')}</td>
                                </tr>
                            ))}
                            {unpaidInvoices.length === 0 && (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">გადასახდელი ინვოისები არ არის 🎉</td></tr>
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

export default Dashboard;
