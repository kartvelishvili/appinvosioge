
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Building2, User, CheckCircle, Clock, 
  FileText, Trash2, Edit
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useOneTimeInvoices } from '@/hooks/useOneTimeInvoices';
import { formatDateDDMMYYYY } from '@/utils/formatDate';
import OneTimeInvoiceForm from '@/components/OneTimeInvoiceForm';

const OneTimeInvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchOneTimeInvoiceById, deleteOneTimeInvoice, markAsPaid } = useOneTimeInvoices();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    setLoading(true);
    const data = await fetchOneTimeInvoiceById(id);
    if (data) {
      setInvoice(data);
    } else {
      navigate('/one-time-invoices');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm('ნამდვილად გსურთ ამ ინვოისის წაშლა?')) {
      await deleteOneTimeInvoice(id);
      navigate('/one-time-invoices');
    }
  };

  const handleToggleStatus = async () => {
    if (!invoice) return;
    const newStatus = invoice.status === 'paid' ? false : true;
    await markAsPaid(id, newStatus);
    loadInvoice();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <>
      <Helmet>
        <title>ინვოისის დეტალები - Invoiso</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/one-time-invoices')}
            className="mb-6 hover:bg-slate-100 -ml-2 text-slate-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            უკან დაბრუნება
          </Button>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white">
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 opacity-90">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium tracking-wide">ერთჯერადი ინვოისი</span>
                  </div>
                  <h1 className="text-3xl font-bold">{invoice.clients?.company || invoice.clients?.name}</h1>
                  <p className="opacity-80 mt-1">{formatDateDDMMYYYY(invoice.created_at)}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-lg backdrop-blur-md bg-white/20 font-bold border border-white/20 flex items-center gap-2`}>
                    {invoice.status === 'paid' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    {invoice.status === 'paid' ? 'გადახდილი' : 'გადასახდელი'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Main Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left Column */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      კლიენტი
                    </h3>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      {invoice.clients?.logo_url ? (
                        <img src={invoice.clients.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover bg-white shadow-sm" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                          {(invoice.clients?.company || invoice.clients?.name)?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 text-lg">{invoice.clients?.company || invoice.clients?.name}</p>
                        <p className="text-slate-500 text-sm mt-1">{invoice.clients?.name}</p>
                        {invoice.clients?.email && <p className="text-slate-400 text-xs mt-0.5">{invoice.clients.email}</p>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      შემსრულებელი
                    </h3>
                    {invoice.performers ? (
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        {invoice.performers.logo_url ? (
                          <img src={invoice.performers.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover bg-white shadow-sm" />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xl">
                            {invoice.performers.name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 text-lg">{invoice.performers.name}</p>
                          <p className="text-slate-500 text-sm mt-1">კონტრაქტორი</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">შემსრულებელი არ არის მითითებული</p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">ფინანსური დეტალები</h3>
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                        <span className="text-slate-600">სრული თანხა</span>
                        <span className="font-medium text-slate-900">{parseFloat(invoice.full_amount).toLocaleString()} ₾</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                         <span className="text-slate-600 flex items-center gap-2">
                           <Calendar className="h-4 w-4 text-slate-400" />
                           პერიოდი
                         </span>
                         <span className="font-medium text-slate-900 text-sm">
                           {formatDateDDMMYYYY(invoice.service_period_start)} - {formatDateDDMMYYYY(invoice.service_period_end)}
                         </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-bold text-violet-700">გადასახდელი სულ</span>
                        <span className="font-black text-2xl text-violet-700">{parseFloat(invoice.calculated_amount).toLocaleString()} ₾</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">მომსახურების აღწერა</h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-slate-700 leading-relaxed min-h-[100px]">
                      {invoice.service_description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditOpen(true)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  რედაქტირება
                </Button>
                <Button 
                  variant={invoice.status === 'paid' ? "outline" : "default"}
                  onClick={handleToggleStatus}
                  className={`gap-2 ${invoice.status === 'paid' ? 'border-orange-200 text-orange-700 hover:bg-orange-50' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {invoice.status === 'paid' ? (
                    <>
                      <Clock className="h-4 w-4" />
                      გადასახდელად მონიშვნა
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      გადახდილად მონიშვნა
                    </>
                  )}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  წაშლა
                </Button>
              </div>
            </div>
          </div>
        </div>

        <OneTimeInvoiceForm 
          isOpen={isEditOpen} 
          onClose={() => setIsEditOpen(false)} 
          invoiceToEdit={invoice}
          onSuccess={loadInvoice}
        />
      </div>
    </>
  );
};

export default OneTimeInvoiceDetailsPage;
