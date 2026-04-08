
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, MapPin, Globe, CreditCard, Edit } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';
import PerformerForm from '@/components/PerformerForm';

const PerformerDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [performer, setPerformer] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: perfData, error: perfError } = await supabase.from('performers').select('*').eq('id', id).single();
      if (perfError) throw perfError;
      setPerformer(perfData);

      const { data: contData } = await supabase.from('contracts').select('*, clients(company)').eq('performer_id', id);
      setContracts(contData || []);

      const { data: invData } = await supabase.from('invoices').select('*, clients(company)').eq('performer_id', id);
      setInvoices(invData || []);

    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!performer) return <div>არ მოიძებნა</div>;

  return (
    <>
      <Helmet><title>{performer.name} - Invoiso</title></Helmet>
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navbar />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button variant="ghost" onClick={() => navigate('/performers')} className="mb-6 pl-0 hover:pl-2 transition-all">
                <ArrowLeft className="h-4 w-4 mr-2" /> უკან სიაში
            </Button>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mb-8">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end gap-6">
                             <div className="w-32 h-32 bg-white rounded-2xl p-1 shadow-lg">
                                <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100">
                                    {performer.logo_url ? <img src={performer.logo_url} className="w-full h-full object-contain" /> : <Building2 className="h-12 w-12 text-slate-300"/>}
                                </div>
                             </div>
                             <div className="mb-2">
                                 <h1 className="text-3xl font-black text-slate-900">{performer.name}</h1>
                                 <p className="text-slate-500 font-medium">{performer.legal_name}</p>
                             </div>
                        </div>
                        <Button onClick={() => setIsEditOpen(true)} className="mb-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                            <Edit className="h-4 w-4 mr-2" /> რედაქტირება
                        </Button>
                    </div>

                    <Tabs defaultValue="overview">
                        <TabsList className="bg-slate-100 p-1 rounded-lg mb-8">
                            <TabsTrigger value="overview" className="px-6 py-2">მიმოხილვა</TabsTrigger>
                            <TabsTrigger value="contracts" className="px-6 py-2">კონტრაქტები ({contracts.length})</TabsTrigger>
                            <TabsTrigger value="invoices" className="px-6 py-2">ინვოისები ({invoices.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-indigo-500"/> მისამართი</h3>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-600"><span className="font-semibold w-24 inline-block">მისამართი:</span> {performer.address}</p>
                                        <p className="text-sm text-slate-600"><span className="font-semibold w-24 inline-block">ქალაქი:</span> {performer.city}, {performer.postal_code}</p>
                                        <p className="text-sm text-slate-600"><span className="font-semibold w-24 inline-block">ქვეყანა:</span> {performer.country}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-indigo-500"/> საბანკო დეტალები</h3>
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-600"><span className="font-semibold w-24 inline-block">ს/კ:</span> {performer.tax_id}</p>
                                        <p className="text-sm text-slate-600"><span className="font-semibold w-24 inline-block">ანგარიში:</span> {performer.bank_account}</p>
                                        <p className="text-sm text-slate-600"><span className="font-semibold w-24 inline-block">დირექტორი:</span> {performer.director_name}</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="contracts">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">კლიენტი</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">თანხა</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">სტატუსი</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {contracts.map(c => (
                                            <tr key={c.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 text-sm font-bold text-indigo-600">{c.contract_number}</td>
                                                <td className="px-6 py-4 text-sm text-slate-700">{c.clients?.company}</td>
                                                <td className="px-6 py-4 text-sm font-bold">{c.monthly_fee} {c.currency}</td>
                                                <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold uppercase">{c.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>

                         <TabsContent value="invoices">
                             <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ინვოისი</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">კლიენტი</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">თანხა</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">სტატუსი</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {invoices.map(inv => (
                                            <tr key={inv.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 text-sm font-bold text-indigo-600">{inv.invoice_number}</td>
                                                <td className="px-6 py-4 text-sm text-slate-700">{inv.clients?.company}</td>
                                                <td className="px-6 py-4 text-sm font-bold">{inv.total_amount}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${inv.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {inv.payment_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>

        <PerformerForm isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} performerToEdit={performer} onSuccess={fetchData} />
      </div>
    </>
  );
};

export default PerformerDetailsPage;
