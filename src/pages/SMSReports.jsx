import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/customSupabaseClient';
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

const SMSReports = () => {
  const [stats, setStats] = useState({
      total: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      deliveryRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      fetchStats();
  }, []);

  const fetchStats = async () => {
      try {
          const { data, error } = await supabase
            .from('sms_logs')
            .select('status');
            
          if (error) throw error;

          const total = data.length;
          const sent = data.filter(x => x.status === 'sent').length;
          const delivered = data.filter(x => x.status === 'delivered').length;
          const failed = data.filter(x => x.status === 'failed' || x.status === 'undelivered').length;
          
          // "Sent" usually implies successful API handoff. "Delivered" is end user receipt.
          // We'll consider 'sent', 'delivered' as successful attempts for the "Total Sent" metric shown to user usually,
          // but specifically distinguish delivered.
          
          setStats({
              total,
              sent,
              delivered,
              failed,
              deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0
          });

      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
              <p className="text-sm text-slate-500 mb-1">{title}</p>
              <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
          </div>
          <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
              <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
          </div>
      </div>
  );

  const BarChart = ({ label, value, total, color }) => (
      <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-slate-700">{label}</span>
              <span className="text-slate-500">{value} ({total > 0 ? Math.round((value/total)*100) : 0}%)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${total > 0 ? (value/total)*100 : 0}%` }}></div>
          </div>
      </div>
  );

  return (
    <>
      <Helmet>
        <title>SMS ანგარიშები - Invoiso</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-8">SMS სტატისტიკა</h1>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="სულ გაგზავნილი" value={stats.total} icon={Activity} color="bg-blue-500" />
              <StatCard title="წარმატებით მიღებული" value={stats.delivered} icon={CheckCircle} color="bg-green-500" />
              <StatCard title="ვერ გაიგზავნა/მიიღო" value={stats.failed} icon={XCircle} color="bg-red-500" />
              <StatCard title="მიღების მაჩვენებელი" value={`${stats.deliveryRate}%`} icon={Clock} color="bg-indigo-500" />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">სტატუსების განაწილება</h3>
                  <BarChart label="მიღებული (Delivered)" value={stats.delivered} total={stats.total} color="bg-green-500" />
                  <BarChart label="გაგზავნილი (Sent - Pending Delivery)" value={stats.sent} total={stats.total} color="bg-blue-500" />
                  <BarChart label="ჩაიშალა (Failed/Undelivered)" value={stats.failed} total={stats.total} color="bg-red-500" />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                   <h3 className="text-lg font-bold text-slate-900 mb-4">შემაჯამებელი</h3>
                   <div className="relative w-48 h-48 flex items-center justify-center">
                       <svg className="w-full h-full" viewBox="0 0 36 36">
                           <path
                               d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                               fill="none"
                               stroke="#E2E8F0"
                               strokeWidth="3"
                           />
                           <path
                               d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                               fill="none"
                               stroke="#10B981"
                               strokeWidth="3"
                               strokeDasharray={`${stats.deliveryRate}, 100`}
                           />
                       </svg>
                       <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-slate-800">
                           {stats.deliveryRate}%
                       </div>
                   </div>
                   <p className="text-slate-500 mt-4">საერთო წარმატების მაჩვენებელი</p>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SMSReports;