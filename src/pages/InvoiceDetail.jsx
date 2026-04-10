
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Download, MessageSquare, Mail, Printer, Edit, CheckCircle, Trash2, Settings, Eye, EyeOff, Clock, Calendar, AlertTriangle, Save, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { downloadInvoicePDF } from '@/utils/pdfUtils';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import EditInvoiceModal from '@/components/EditInvoiceModal';
import SendCommunicationModal from '@/components/SendCommunicationModal';
import PaymentRecordingModal from '@/components/PaymentRecordingModal';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { formatDateDDMMYYYY } from '@/utils/formatDate';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [remindersLog, setRemindersLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [isEditingId, setIsEditingId] = useState(false);
  const [editedId, setEditedId] = useState('');
  
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editedPeriodStart, setEditedPeriodStart] = useState('');
  const [editedPeriodEnd, setEditedPeriodEnd] = useState('');

  const [settings, setSettings] = useState({ show_phone: true, show_signature: true });
  const invoiceRef = useRef(null);

  useEffect(() => { if (id) fetchInvoiceDetails(); }, [id]);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const { data: invoiceData, error: invoiceError } = await supabase.from('invoices').select('*, clients(*), performers(*)').eq('id', id).maybeSingle();
      if (invoiceError) throw invoiceError;
      if (!invoiceData) { toast({ variant: "destructive", title: "შეცდომა", description: "ინვოისი არ მოიძებნა" }); navigate('/invoices'); return; }

      const [itemsRes, logRes] = await Promise.all([
        supabase.from('invoice_items').select('*').eq('invoice_id', id),
        supabase.from('reminders_log').select('*').eq('invoice_id', id).order('sent_at', { ascending: false }),
      ]);

      setInvoice(invoiceData);
      setEditedId(invoiceData.invoice_number);
      setEditedPeriodStart(invoiceData.invoice_date);
      setEditedPeriodEnd(invoiceData.due_date);
      setItems(itemsRes.data || []);
      setRemindersLog(logRes.data || []);
      
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: "მონაცემების წამოღება ვერ მოხერხდა" });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveInvoiceId = async () => {
      if (!/^IN#\d{7}$/.test(editedId)) { toast({ variant: "destructive", title: "შეცდომა", description: "არასწორი ფორმატი." }); return; }
      if (editedId === invoice.invoice_number) { setIsEditingId(false); return; }
      try {
        const { error } = await supabase.from('invoices').update({ invoice_number: editedId }).eq('id', id);
        if (error) throw error;
        setInvoice(prev => ({ ...prev, invoice_number: editedId }));
        setIsEditingId(false);
        toast({ title: "წარმატება", description: "ინვოისის ნომერი განახლდა." });
      } catch (error) { toast({ variant: "destructive", title: "შეცდომა", description: "ვერ მოხერხდა განახლება." }); }
  };
  
  const handleSaveDates = async () => {
     if (!editedPeriodStart || !editedPeriodEnd) { toast({ variant: "destructive", title: "შეცდომა", description: "მიუთითეთ ორივე თარიღი." }); return; }
     try {
         const updates = { invoice_date: editedPeriodStart, due_date: editedPeriodEnd };
         const { error } = await supabase.from('invoices').update(updates).eq('id', id);
         if (error) throw error;
         setInvoice(prev => ({ ...prev, ...updates }));
         setIsEditingDates(false);
         toast({ title: "წარმატება", description: "თარიღები განახლდა." });
     } catch (error) { toast({ variant: "destructive", title: "შეცდომა", description: "ვერ მოხერხდა განახლება." }); }
  };

  const handleIdChange = (e) => {
      let val = e.target.value.replace(/^IN#/, '').replace(/[^0-9]/g, '');
      setEditedId(`IN#${val.slice(0, 7)}`);
  };

  const handleDeleteInvoice = async () => {
    setLoading(true);
    try {
        await Promise.all([
            supabase.from('invoice_items').delete().eq('invoice_id', id),
            supabase.from('reminders_log').delete().eq('invoice_id', id)
        ]);
        const { error } = await supabase.from('invoices').delete().eq('id', id);
        if (error) throw error;
        toast({ title: 'ინვოისი წაიშალა' });
        navigate('/invoices');
    } catch(error) { toast({ variant: 'destructive', title: 'შეცდომა', description: 'ინვოისის წაშლა ვერ მოხერხდა.' }); setLoading(false); }
  }
  
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || downloading) return;
    setDownloading(true);
    try { await downloadInvoicePDF(invoiceRef.current, invoice.invoice_number); toast({ title: "PDF გადმოწერილია" }); }
    catch (error) { toast({ variant: "destructive", title: "შეცდომა", description: "PDF-ის გადმოწერა ვერ მოხერხდა." }); }
    finally { setDownloading(false); }
  };
  
  if (loading && !invoice) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!invoice) return null;
  
  const isPaid = invoice.payment_status === 'paid';

  return (
    <>
      <Helmet>
        <title>{invoice.invoice_number} - Invoiso</title>
         <style>{`
            @media print {
              @page { size: A4; margin: 0; }
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              body, .print-container { background: white !important; }
              .no-print { display: none !important; }
              .print-container { min-height: unset !important; padding: 0 !important; margin: 0 !important; height: auto !important; background: white !important; }
              .invoice-wrapper { height: 297mm !important; max-height: 297mm !important; overflow: hidden !important; box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; width: 210mm !important; max-width: 210mm !important; }
              .invoice-template-container { height: 297mm !important; max-height: 297mm !important; overflow: hidden !important; }
            }
         `}</style>
      </Helmet>
      <div className="min-h-screen bg-slate-100 pb-10 print-container">
        <div className="no-print"><Navbar /></div>
        
        <div className="max-w-[210mm] mx-auto px-4 py-6 no-print">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4">
            <Button onClick={() => navigate('/invoices')} variant="ghost" size="sm" className="text-slate-600 hover:text-[#0A3858]"><ArrowLeft className="h-4 w-4 mr-2" /> უკან</Button>
            <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => setIsEditModalOpen(true)} variant="outline" size="sm"><Edit className="h-4 w-4 mr-2" /> რედაქტირება</Button>
                <Button onClick={() => setIsCommModalOpen(true)} variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"><Mail className="h-4 w-4 mr-2"/> შეტყობინება</Button>
                {!isPaid && <Button size="sm" onClick={() => setIsPaymentModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="h-4 w-4 mr-2"/>გადახდის დაფიქსირება</Button>}
                 <Button onClick={handleDownloadPDF} variant="outline" size="sm" disabled={downloading} className="text-slate-700"><Download className={`h-4 w-4 mr-2 ${downloading ? 'animate-bounce' : ''}`} /> {downloading ? 'იწერება...' : 'PDF'}</Button>
                 <Button onClick={() => window.print()} variant="ghost" size="icon" title="ამობეჭდვა"><Printer className="h-4 w-4 text-slate-500" /></Button>
                <Button onClick={() => window.open(`${window.location.origin}/invoices/${id}/public`, '_blank')} variant="ghost" size="icon" title="საჯარო ლინკი"><ExternalLink className="h-4 w-4 text-slate-500" /></Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" title="წაშლა"><Trash2 className="h-4 w-4 text-red-500" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>დაადასტურეთ წაშლა</AlertDialogTitle><AlertDialogDescription>დარწმუნებული ხართ, რომ გსურთ წაშლა?</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>გაუქმება</AlertDialogCancel><AlertDialogAction onClick={handleDeleteInvoice} className="bg-red-600 hover:bg-red-700">წაშლა</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 mb-4">
             <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-indigo-500"/><p className="text-xs text-slate-500 uppercase font-bold">თარიღები</p></div>
                    {!isEditingDates && <button onClick={() => setIsEditingDates(true)} className="text-slate-400 hover:text-indigo-600"><Edit className="h-3 w-3" /></button>}
                 </div>
                 {isEditingDates ? (
                     <div className="flex items-center gap-2 mt-1">
                         <Input type="date" value={editedPeriodStart} onChange={(e) => setEditedPeriodStart(e.target.value)} className="h-8 text-xs"/>
                         <span>-</span>
                         <Input type="date" value={editedPeriodEnd} onChange={(e) => setEditedPeriodEnd(e.target.value)} className="h-8 text-xs"/>
                         <Button size="sm" className="h-8 w-8 p-0" onClick={handleSaveDates}><Save className="h-4 w-4"/></Button>
                         <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setIsEditingDates(false); setEditedPeriodStart(invoice.invoice_date); setEditedPeriodEnd(invoice.due_date); }}><X className="h-4 w-4"/></Button>
                     </div>
                 ) : (
                    <p className="font-medium text-slate-800 text-sm">{invoice.invoice_date ? `${formatDateDDMMYYYY(invoice.invoice_date)} - ${formatDateDDMMYYYY(invoice.due_date)}` : '-'}</p>
                 )}
             </div>

             <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between">
                 <div>
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-2"><p className="text-xs text-slate-500 uppercase font-bold">ინვოისის #</p>{!isEditingId && !isPaid && <button onClick={() => setIsEditingId(true)} className="text-slate-400 hover:text-indigo-600"><Edit className="h-3 w-3" /></button>}</div>
                      </div>
                      <div className="flex items-center gap-2">
                          {isEditingId ? (
                              <div className="flex items-center gap-1">
                                  <Input value={editedId.replace(/^IN#/, '')} onChange={handleIdChange} className="h-8 w-32 font-mono font-bold text-sm" autoFocus maxLength={7} />
                                  <span className="absolute ml-2 text-slate-400 text-xs font-mono select-none pointer-events-none">IN#</span>
                                  <Button size="sm" className="h-8 px-2" onClick={handleSaveInvoiceId}><Save className="h-4 w-4"/></Button>
                                  <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setIsEditingId(false); setEditedId(invoice.invoice_number); }}>X</Button>
                              </div>
                          ) : (
                              <h2 className="text-2xl font-black text-indigo-900 font-mono tracking-tight">{invoice.invoice_number}</h2>
                          )}
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                          <span className={`px-3 py-1.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 ${isPaid ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                              {isPaid ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />} {isPaid ? 'გადახდილი' : 'გადასახდელი'}
                          </span>
                      </div>
                 </div>
             </div>
          </div>
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-2 bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100"><Settings className="h-4 w-4 text-slate-500" /><h3 className="font-bold text-slate-700 text-sm uppercase">ინვოისის პარამეტრები</h3></div>
            <div className="flex flex-wrap gap-6 items-center">
                <div className="flex items-center space-x-2"><Switch id="show-client-phone" checked={settings.show_phone} onCheckedChange={(c) => setSettings({...settings, show_phone: c})} /><Label htmlFor="show-client-phone" className="text-sm cursor-pointer flex items-center gap-2">{settings.show_phone ? <Eye className="h-3 w-3"/> : <EyeOff className="h-3 w-3"/>} დამკვეთის ტელეფონის ნომერი</Label></div>
                <div className="flex items-center space-x-2"><Switch id="show-signature" checked={settings.show_signature} onCheckedChange={(c) => setSettings({...settings, show_signature: c})} /><Label htmlFor="show-signature" className="text-sm cursor-pointer flex items-center gap-2">{settings.show_signature ? <Eye className="h-3 w-3"/> : <EyeOff className="h-3 w-3"/>} შემსრულებლის ხელმოწერა</Label></div>
            </div>
          </motion.div>
        </div>

        <div className="max-w-[210mm] mx-auto print-pb-0 print-w-full print-max-w-full overflow-x-auto invoice-wrapper">
           <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
             <InvoiceTemplate invoice={invoice} items={items} innerRef={invoiceRef} showClientPhone={settings.show_phone} showSignature={settings.show_signature} />
           </motion.div>
        </div>
        
        {isEditModalOpen && <EditInvoiceModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} invoice={invoice} onSave={fetchInvoiceDetails} />}
        {isCommModalOpen && <SendCommunicationModal isOpen={isCommModalOpen} onClose={() => setIsCommModalOpen(false)} invoice={invoice} onSent={fetchInvoiceDetails} />}
        {isPaymentModalOpen && <PaymentRecordingModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} invoice={invoice} onPaymentSuccess={fetchInvoiceDetails} />}
      </div>
    </>
  );
};

export default InvoiceDetail;
