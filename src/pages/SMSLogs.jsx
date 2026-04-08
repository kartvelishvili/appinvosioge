import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Download, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

const SMSLogs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    fetchLogs();
  }, [filterStatus, dateRange]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
        let query = supabase
            .from('sms_logs')
            .select('*')
            .order('created_at', { ascending: false });

        // Status Filter
        if (filterStatus !== 'all') {
            query = query.eq('status', filterStatus);
        }

        // Date Filter
        const now = new Date();
        if (dateRange === 'today') {
            const start = new Date(now.setHours(0,0,0,0)).toISOString();
            query = query.gte('created_at', start);
        } else if (dateRange === 'week') {
            const start = new Date(now.setDate(now.getDate() - 7)).toISOString();
            query = query.gte('created_at', start);
        }

        const { data, error } = await query.limit(100);

        if (error) throw error;
        setLogs(data || []);

    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "შეცდომა", description: "ლოგების ჩატვირთვა ვერ მოხერხდა" });
    } finally {
        setLoading(false);
    }
  };

  const exportCSV = () => {
      const headers = ['Date', 'Phone', 'Message', 'Status', 'SMS ID'];
      const csvContent = [
          headers.join(','),
          ...logs.map(log => [
              new Date(log.created_at).toISOString(),
              log.phone_number || log.client_phone,
              `"${(log.message || log.message_content || '').replace(/"/g, '""')}"`,
              log.status,
              log.sms_id
          ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sms_logs_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
  };

  const toggleExpand = (id) => {
      setExpandedRow(expandedRow === id ? null : id);
  };

  const getStatusBadge = (status) => {
      const styles = {
          sent: 'bg-blue-100 text-blue-800',
          delivered: 'bg-green-100 text-green-800',
          failed: 'bg-red-100 text-red-800',
          pending: 'bg-yellow-100 text-yellow-800',
          undelivered: 'bg-orange-100 text-orange-800'
      };
      return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
              {status}
          </span>
      );
  };

  return (
    <>
      <Helmet>
        <title>SMS ლოგები - Invoiso</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">SMS ლოგები</h1>
            <Button onClick={exportCSV} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" /> ექსპორტი
            </Button>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4">
              <div>
                  <label className="block text-xs text-slate-500 mb-1">სტატუსი</label>
                  <select 
                      className="p-2 border border-slate-300 rounded-md text-sm outline-none"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                  >
                      <option value="all">ყველა</option>
                      <option value="sent">გაგზავნილი (Sent)</option>
                      <option value="delivered">მიღებული (Delivered)</option>
                      <option value="failed">ჩაიშალა (Failed)</option>
                  </select>
              </div>
              <div>
                  <label className="block text-xs text-slate-500 mb-1">პერიოდი</label>
                  <select 
                      className="p-2 border border-slate-300 rounded-md text-sm outline-none"
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                  >
                      <option value="today">დღეს</option>
                      <option value="week">ბოლო 7 დღე</option>
                      <option value="all">ყველა დროის</option>
                  </select>
              </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">თარიღი</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ნომერი</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">შეტყობინება</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">სტატუსი</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">დეტალები</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                      {logs.map((log) => (
                          <React.Fragment key={log.id}>
                              <tr className="hover:bg-slate-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                      {new Date(log.created_at).toLocaleString('ka-GE')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-700">
                                      {log.phone_number || log.client_phone}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">
                                      {log.message || log.message_content}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                      {getStatusBadge(log.status)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <button 
                                        onClick={() => toggleExpand(log.id)}
                                        className="text-indigo-600 hover:text-indigo-800"
                                      >
                                          {expandedRow === log.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                      </button>
                                  </td>
                              </tr>
                              {expandedRow === log.id && (
                                  <tr className="bg-slate-50">
                                      <td colSpan="5" className="px-6 py-4">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                              <div>
                                                  <h4 className="font-bold text-slate-700 mb-2">სრული შეტყობინება</h4>
                                                  <p className="p-3 bg-white border border-slate-200 rounded-md text-slate-600 whitespace-pre-wrap">
                                                      {log.message || log.message_content}
                                                  </p>
                                              </div>
                                              <div className="space-y-4">
                                                  <div>
                                                      <h4 className="font-bold text-slate-700 mb-2">API პასუხი</h4>
                                                      <pre className="p-3 bg-slate-900 text-green-400 rounded-md overflow-x-auto text-xs">
                                                          {JSON.stringify(log.api_response, null, 2) || 'No Data'}
                                                      </pre>
                                                  </div>
                                                  <div>
                                                      <h4 className="font-bold text-slate-700 mb-2">Delivery Report</h4>
                                                      <pre className="p-3 bg-slate-900 text-blue-400 rounded-md overflow-x-auto text-xs">
                                                          {JSON.stringify(log.delivery_report, null, 2) || 'No Report Yet'}
                                                      </pre>
                                                  </div>
                                              </div>
                                          </div>
                                      </td>
                                  </tr>
                              )}
                          </React.Fragment>
                      ))}
                      {logs.length === 0 && !loading && (
                          <tr>
                              <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                  მონაცემები არ მოიძებნა
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default SMSLogs;