import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGeorgianMonthName } from '@/utils/georgianMonths';

const CalendarPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState('all'); // 'all', 'paid', 'unpaid'

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

      // Fetch active invoices
      const { data: active, error: activeError } = await supabase
        .from('invoices')
        .select('*, clients(company_name)')
        .or(`service_period_start.gte.${startOfMonth},service_period_end.lte.${endOfMonth}`);

      if (activeError) throw activeError;

      // Fetch pending (auto) invoices
      const { data: pending, error: pendingError } = await supabase
        .from('auto_invoices')
        .select('*, clients(company_name)')
        .eq('status', 'პენდინგი')
        .or(`service_period_start.gte.${startOfMonth},service_period_end.lte.${endOfMonth}`);

      if (pendingError) throw pendingError;

      setInvoices(active || []);
      setPendingInvoices(pending || []);

    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const getEventsForDate = (day) => {
    const targetDateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    
    // Active Invoices matching Service Period Start or End
    const activeMatches = invoices.filter(inv => {
      if (filter === 'paid' && inv.payment_status !== 'paid') return false;
      if (filter === 'unpaid' && inv.payment_status === 'paid') return false;
      return inv.service_period_start === targetDateStr || inv.service_period_end === targetDateStr;
    });

    // Pending Invoices matching Service Period Start or End
    const pendingMatches = pendingInvoices.filter(inv => {
      return inv.service_period_start === targetDateStr || inv.service_period_end === targetDateStr;
    });

    return { active: activeMatches, pending: pendingMatches };
  };

  const renderCalendar = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50/30 border border-slate-100/50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
        const { active, pending } = getEventsForDate(day);
        
        days.push(
            <div key={day} className={`h-32 border border-slate-100 p-2 relative group hover:bg-slate-50 transition-colors ${isToday ? 'bg-indigo-50/30' : 'bg-white'}`}>
                <span className={`text-sm font-bold ${isToday ? 'text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full' : 'text-slate-500'}`}>{day}</span>
                <div className="mt-2 space-y-1 overflow-y-auto max-h-[90px] pr-1 scrollbar-hide">
                    {active.map(inv => (
                        <div 
                            key={`active-${inv.id}`}
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                            className={`text-[10px] p-1 rounded cursor-pointer truncate border-l-2 ${
                                inv.payment_status === 'paid' 
                                ? 'bg-green-50 text-green-700 border-green-500' 
                                : 'bg-blue-50 text-blue-700 border-blue-500'
                            }`}
                        >
                           <span className="font-bold">{inv.service_period_start.endsWith(String(day).padStart(2,'0')) ? 'Start' : 'End'}</span> {inv.clients?.company_name}
                        </div>
                    ))}
                    {pending.map(inv => (
                        <div 
                            key={`pending-${inv.id}`}
                            onClick={() => navigate(`/auto-invoices`)}
                            className="text-[10px] p-1 rounded cursor-pointer truncate border-l-2 bg-yellow-50 text-yellow-700 border-yellow-500"
                        >
                            <span className="flex items-center gap-1"><Clock className="h-2 w-2"/> {inv.service_period_start.endsWith(String(day).padStart(2,'0')) ? 'Start' : 'End'} {inv.clients?.company_name}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return days;
  };

  const weekDays = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'];

  return (
    <>
      <Helmet><title>კალენდარი - Invoiso</title></Helmet>
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navbar />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                            <CalendarIcon className="h-8 w-8 text-indigo-600" />
                            კალენდარი
                        </h1>
                        <div className="flex items-center bg-white rounded-lg shadow-sm border p-1">
                            <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="w-40 text-center font-bold text-lg">{getGeorgianMonthName(currentDate.getMonth())} {currentDate.getFullYear()}</span>
                            <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <Filter className="h-4 w-4 text-slate-400" />
                         <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-40 bg-white">
                                <SelectValue placeholder="ფილტრი" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ყველა</SelectItem>
                                <SelectItem value="paid">გადახდილი</SelectItem>
                                <SelectItem value="unpaid">გადასახდელი</SelectItem>
                            </SelectContent>
                         </Select>
                    </div>
                </div>

                <div className="flex gap-4 mb-4 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> აქტიური (პერიოდი)</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div> გადახდილი</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500 rounded-full"></div> პენდინგი (Auto)</div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                        {weekDays.map(day => (
                            <div key={day} className="py-3 text-center text-sm font-bold text-slate-500 uppercase tracking-wider">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {renderCalendar()}
                    </div>
                </div>
            </motion.div>
        </div>
      </div>
    </>
  );
};

export default CalendarPage;