
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw, FileX } from 'lucide-react';
import Navbar from '@/components/Navbar';
import InvoiceCard from '@/components/InvoiceCard';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { downloadInvoicePDF } from '@/utils/pdfUtils';

const InvoiceLibrary = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateSort, setDateSort] = useState('newest');
  const [pdfData, setPdfData] = useState({ invoice: null, items: null });
  const [downloadingId, setDownloadingId] = useState(null);
  const pdfRef = useRef(null);

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.from('invoices').select('*, clients (*), performers (*)').order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setInvoices(data || []);
    } catch (err) {
      setError(err.message);
      toast({ variant: "destructive", title: "შეცდომა", description: "ბიბლიოთეკის ჩატვირთვა ვერ მოხერხდა" });
    } finally { setLoading(false); }
  };

  const handleDownloadPDF = async (invoice) => {
    setDownloadingId(invoice.id);
    try {
      const { data: items, error: itemsError } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id);
      if (itemsError) throw itemsError;
      setPdfData({ invoice, items: items || [] });
      setTimeout(async () => {
         if (pdfRef.current) await downloadInvoicePDF(pdfRef.current, invoice.invoice_number);
         setPdfData({ invoice: null, items: null });
         setDownloadingId(null);
      }, 800);
    } catch (err) {
       toast({ variant: "destructive", title: "შეცდომა", description: "PDF-ის გადმოწერა ვერ მოხერხდა." });
       setDownloadingId(null); setPdfData({ invoice: null, items: null });
    }
  };

  const filteredInvoices = useMemo(() => {
    let result = [...invoices];
    if (searchTerm) result = result.filter(inv => inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter !== 'all') {
        if (statusFilter === 'paid') result = result.filter(inv => inv.payment_status === 'paid');
        else if (statusFilter === 'unpaid') result = result.filter(inv => inv.payment_status !== 'paid');
    }
    result.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateSort === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return result;
  }, [invoices, searchTerm, statusFilter, dateSort]);

  return (
    <>
      <Helmet><title>ბიბლიოთეკა - ინვოისები</title></Helmet>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
           {pdfData.invoice && <InvoiceTemplate innerRef={pdfRef} invoice={pdfData.invoice} items={pdfData.items} showClientPhone={true} showSignature={true} />}
        </div>
        <main className="flex-grow max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8"><h1 className="text-3xl font-bold text-slate-900 tracking-tight">ინვოისების ბიბლიოთეკა</h1></div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="ძებნა..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger><div className="flex items-center gap-2"><Filter className="h-4 w-4 text-slate-400" /><SelectValue placeholder="სტატუსი" /></div></SelectTrigger>
                        <SelectContent><SelectItem value="all">ყველა სტატუსი</SelectItem><SelectItem value="paid">გადახდილი</SelectItem><SelectItem value="unpaid">გადაუხდელი</SelectItem></SelectContent>
                    </Select>
                    <Select value={dateSort} onValueChange={setDateSort}>
                        <SelectTrigger><SelectValue placeholder="თარიღი" /></SelectTrigger>
                        <SelectContent><SelectItem value="newest">ახალი პირველად</SelectItem><SelectItem value="oldest">ძველი პირველად</SelectItem></SelectContent>
                    </Select>
                </div>
            </div>
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>)}</div>
            ) : error ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><p className="text-red-500 mb-4">{error}</p><Button onClick={fetchInvoices} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />თავიდან ცდა</Button></div>
            ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-2xl border border-slate-200"><FileX className="h-10 w-10 mx-auto text-slate-300 mb-6" /><h3 className="text-2xl font-bold">ინვოისი არ მოიძებნა</h3></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {filteredInvoices.map((invoice, index) => (
                            <motion.div key={invoice.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.05 }}>
                                <InvoiceCard invoice={invoice} onDownload={handleDownloadPDF} isDownloading={downloadingId === invoice.id} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </main>
      </div>
    </>
  );
};

export default InvoiceLibrary;
