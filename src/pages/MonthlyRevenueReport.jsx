import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';

const MonthlyRevenueReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('service_period_end', { ascending: false });

      if (error) throw error;

      // Group by service_month
      const grouped = invoices.reduce((acc, inv) => {
        const month = inv.service_month || 'Unknown';
        if (!acc[month]) {
          acc[month] = {
            month,
            totalInvoices: 0,
            totalAmount: 0,
            paidAmount: 0,
            unpaidAmount: 0,
            dateForSort: inv.service_period_end || new Date().toISOString() // for sorting
          };
        }
        const amount = parseFloat(inv.total_amount);
        const isPaid = inv.payment_status === 'paid';
        
        acc[month].totalInvoices += 1;
        acc[month].totalAmount += amount;
        
        if (isPaid) {
             acc[month].paidAmount += amount;
        } else {
             acc[month].unpaidAmount += amount;
        }
        return acc;
      }, {});

      const sortedData = Object.values(grouped).sort((a, b) => new Date(b.dateForSort) - new Date(a.dateForSort));
      setReportData(sortedData);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
  );

  return (
    <>
      <Helmet><title>ყოველთვიური რეპორტი - Invoiso</title></Helmet>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
                ყოველთვიური შემოსავლების რეპორტი
            </h1>

            <div className="grid grid-cols-1 gap-6">
                {reportData.map((monthData, index) => {
                    const percentage = monthData.totalAmount > 0 ? (monthData.paidAmount / monthData.totalAmount) * 100 : 0;
                    return (
                        <motion.div
                            key={monthData.month}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 bg-slate-50/50">
                                    <CardTitle className="text-lg font-bold text-slate-800">{monthData.month}</CardTitle>
                                    <span className="text-sm font-medium text-slate-500">{monthData.totalInvoices} ინვოისი</span>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">სულ დარიცხული</p>
                                            <p className="text-2xl font-bold text-slate-900">{monthData.totalAmount.toLocaleString()} ₾</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">გადახდილი</p>
                                            <p className="text-2xl font-bold text-green-600">{monthData.paidAmount.toLocaleString()} ₾</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">გადასახდელი</p>
                                            <p className="text-2xl font-bold text-red-600">{monthData.unpaidAmount.toLocaleString()} ₾</p>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>ამოღების მაჩვენებელი</span>
                                                <span className="font-bold">{percentage.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
      </div>
    </>
  );
};

export default MonthlyRevenueReport;