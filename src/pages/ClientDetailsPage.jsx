
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/customSupabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ClientEditModal from '@/components/ClientEditModal';
import { formatDateDDMMYYYY } from '@/utils/formatDate';
import { differenceInDays } from 'date-fns';

// Sub Components
import ClientOverviewTab from '@/components/ClientOverviewTab';
import ClientInvoicesTab from '@/components/ClientInvoicesTab';
import PaymentHistoryTab from '@/components/PaymentHistoryTab';
import ClientContractsTab from '@/components/ClientContractsTab';
import ClientMonthlyTab from '@/components/ClientMonthlyTab';
import PaymentDelaySection from '@/components/PaymentDelaySection';

const ClientDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);

  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (clientError) throw clientError;
      setClient(clientData);

      const { data: invoiceData, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', id)
        .order('issue_date', { ascending: false });

      if (invError) throw invError;
      setInvoices(invoiceData || []);

      const { data: contractData, error: contError } = await supabase
        .from('contracts')
        .select('*')
        .eq('client_id', id)
        .order('contract_date', { ascending: false });

      if (contError) throw contError;
      setContracts(contractData || []);

    } catch (error) {
      console.error('Error fetching client details:', error);
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: "მონაცემების ჩატვირთვა ვერ მოხერხდა",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
     );
  }

  if (!client) return <div>კლიენტი არ მოიძებნა</div>;

  const totalInvoices = invoices.length;
  // Stats calculation based on Paid/Unpaid only
  const totalPaid = invoices.filter(i => i.payment_status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  const totalOutstanding = invoices.filter(i => i.payment_status !== 'paid').reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  
  const stats = {
    totalInvoices,
    totalPaid,
    totalOutstanding,
    averagePaymentTime: 0 // Placeholder
  };

  return (
    <>
      <Helmet>
        <title>{client.company || client.name} - კლიენტის დეტალები</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navbar />
        
        <div className="bg-white border-b border-slate-200 pt-8 pb-12 px-4 sm:px-6 lg:px-8 shadow-sm">
            <div className="max-w-7xl mx-auto">
                <Button 
                    variant="ghost" 
                    className="mb-6 pl-0 hover:pl-2 transition-all text-slate-500 hover:text-indigo-600"
                    onClick={() => navigate('/clients')}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    უკან კლიენტებში
                </Button>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        {client.logo_url ? (
                            <img src={client.logo_url} alt="logo" className="h-20 w-20 rounded-xl object-cover border border-slate-200 shadow-sm" />
                        ) : (
                            <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                                {(client.company || client.name || 'C').charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                {client.company || client.name}
                                {invoices.length === 0 && (
                                    <Button variant="ghost" size="sm" onClick={() => setEditModalOpen(true)} className="text-slate-400 hover:text-indigo-600">
                                        <Edit className="h-5 w-5" />
                                    </Button>
                                )}
                            </h1>
                            <p className="text-slate-500 flex items-center gap-2 mt-1">
                                {client.name} • {client.email}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                         <Button variant="outline" onClick={() => navigate(`/invoices/create?clientId=${client.id}`)}>
                            ახალი ინვოისი
                         </Button>
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
            <Tabs defaultValue="overview" className="space-y-8">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                    <TabsList className="bg-transparent h-auto p-0 gap-1">
                        <TabsTrigger value="overview" className="px-6 py-2.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-lg">მიმოხილვა</TabsTrigger>
                        <TabsTrigger value="invoices" className="px-6 py-2.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-lg">ინვოისები</TabsTrigger>
                        <TabsTrigger value="history" className="px-6 py-2.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-lg">ისტორია</TabsTrigger>
                        <TabsTrigger value="contracts" className="px-6 py-2.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-lg">კონტრაქტები</TabsTrigger>
                        <TabsTrigger value="monthly" className="px-6 py-2.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-lg">ყოველთვიური</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview">
                    <PaymentDelaySection invoices={invoices} />
                    <ClientOverviewTab client={client} stats={stats} />
                </TabsContent>

                <TabsContent value="invoices">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900">ინვოისების სია</h2>
                        <span className="text-slate-500 text-sm">სულ: {invoices.length}</span>
                    </div>
                    <ClientInvoicesTab invoices={invoices} />
                </TabsContent>

                <TabsContent value="history">
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900">სრული ისტორია</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ინვოისი ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">თანხა</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">შექმნის თარიღი</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">გადახდის ვადა</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">სტატუსი</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">გადახდის თარიღი / დაგვიანება</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoices.map((inv) => {
                                        const isPaid = inv.payment_status === 'paid';
                                        const daysOverdue = !isPaid && new Date() > new Date(inv.due_date) 
                                            ? differenceInDays(new Date(), new Date(inv.due_date)) 
                                            : 0;

                                        return (
                                            <tr key={inv.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 text-sm font-mono font-bold text-indigo-600">{inv.invoice_number}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-700">{parseFloat(inv.amount || 0).toLocaleString()} ₾</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{formatDateDDMMYYYY(inv.created_at)}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{formatDateDDMMYYYY(inv.due_date)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${isPaid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                        {isPaid ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                                        {isPaid ? 'გადახდილი' : 'გადასახდელი'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    {isPaid ? (
                                                        <span className="text-green-600 font-medium">{formatDateDDMMYYYY(inv.paid_date)}</span>
                                                    ) : (
                                                        daysOverdue > 0 ? <span className="text-red-600 font-bold">{daysOverdue} დღე გადაცილება</span> : <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {invoices.length === 0 && (
                                        <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">ისტორია ცარიელია</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="contracts">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900">გაფორმებული კონტრაქტები</h2>
                    </div>
                    <ClientContractsTab contracts={contracts} />
                </TabsContent>

                <TabsContent value="monthly">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900">ყოველთვიური რეპორტი</h2>
                    </div>
                    <ClientMonthlyTab invoices={invoices} />
                </TabsContent>
            </Tabs>
        </div>

        <ClientEditModal 
            isOpen={editModalOpen} 
            onClose={() => setEditModalOpen(false)} 
            client={client} 
            onUpdate={fetchClientData} 
        />
      </div>
    </>
  );
};

export default ClientDetailsPage;
