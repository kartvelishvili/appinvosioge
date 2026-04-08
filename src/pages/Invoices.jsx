
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, MoreHorizontal, Bell, ArrowUpDown, FileText, User, CheckCircle, Clock, Send, Download } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import ReminderModal from '@/components/ReminderModal';
import PaymentRecordingModal from '@/components/PaymentRecordingModal';
import SendCommunicationModal from '@/components/SendCommunicationModal';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import { CustomTooltip } from '@/components/ui/custom-tooltip';
import { formatDateDDMMYYYY } from '@/utils/formatDate';
import { downloadInvoicePDF } from '@/utils/pdfUtils';

const Invoices = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [clientSearch, setClientSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [communicationModalOpen, setCommunicationModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [pdfData, setPdfData] = useState({ invoice: null, items: null });
  const [downloadingId, setDownloadingId] = useState(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    if (searchParams.get('status')) setStatusFilter(searchParams.get('status'));
    fetchInvoices();
  }, [searchParams]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('invoices').select('*, clients (*), performers (*)').order('created_at', { ascending: false });
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) { toast({ variant: "destructive", title: "შეცდომა", description: "ჩატვირთვა ვერ მოხერხდა" }); } 
    finally { setLoading(false); }
  };

  const handleDownloadPDF = async (invoice) => {
    setDownloadingId(invoice.id);
    try {
      const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id);
      setPdfData({ invoice, items: items || [] });
      setTimeout(async () => {
         if (pdfRef.current) await downloadInvoicePDF(pdfRef.current, invoice.invoice_number);
         setPdfData({ invoice: null, items: null }); setDownloadingId(null);
      }, 800);
    } catch (error) { setDownloadingId(null); setPdfData({ invoice: null, items: null }); }
  };

  const uniqueClients = useMemo(() => {
    const clients = invoices.map(inv => ({ id: inv.clients?.id, name: inv.clients?.company || inv.clients?.name || 'Unknown' })).filter(c => c.id);
    return Array.from(new Map(clients.map(c => [c.id, c])).values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [invoices]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return uniqueClients;
    return uniqueClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  }, [uniqueClients, clientSearch]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const processedInvoices = useMemo(() => {
    let processed = [...invoices].filter(invoice => {
      const searchMatch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) || invoice.clients?.company?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!searchMatch) return false;
      if (statusFilter !== 'all' && ((statusFilter === 'paid' && invoice.payment_status !== 'paid') || (statusFilter === 'unpaid' && invoice.payment_status === 'paid'))) return false;
      if (clientFilter !== 'all' && invoice.client_id !== clientFilter) return false;
      return true;
    });

    processed.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === 'client_name') { aValue = a.clients?.company || ''; bValue = b.clients?.company || ''; }
      else if (sortConfig.key === 'total') { aValue = parseFloat(a.total || 0); bValue = parseFloat(b.total || 0); }
      else if (sortConfig.key === 'created_at' || sortConfig.key === 'due_date') { aValue = new Date(a[sortConfig.key]).getTime(); bValue = new Date(b[sortConfig.key]).getTime(); }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return processed;
  }, [invoices, searchTerm, statusFilter, clientFilter, sortConfig]);

  const SortableHeader = ({ label, sortKey }) => (
    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer group hover:bg-slate-100" onClick={() => requestSort(sortKey)}>
      <div className="flex items-center gap-1">{label} <ArrowUpDown className={`h-3 w-3 ${sortConfig.key === sortKey ? 'text-indigo-600' : 'opacity-40'}`} /></div>
    </th>
  );

  return (
    <>
      <Helmet><title>ინვოისები - Invoiso</title></Helmet>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
           {pdfData.invoice && <InvoiceTemplate innerRef={pdfRef} invoice={pdfData.invoice} items={pdfData.items} />}
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 pb-24 pt-12 px-4 sm:px-6 lg:px-8 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="text-white"><h1 className="text-3xl font-bold tracking-tight">ინვოისები</h1></div>
            <Button onClick={() => navigate('/invoices/create')} className="bg-white text-indigo-600 hover:bg-blue-50 px-6 py-6 text-base"><Plus className="h-5 w-5 mr-2" />ახალი ინვოისი</Button>
          </div>
        </div>
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-12">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="ძებნა..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="სტატუსი" /></SelectTrigger><SelectContent><SelectItem value="all">ყველა</SelectItem><SelectItem value="paid">გადახდილი</SelectItem><SelectItem value="unpaid">გადასახდელი</SelectItem></SelectContent></Select>
              <DropdownMenu onOpenChange={(open) => !open && setClientSearch('')}>
                <DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-between"><div className="flex items-center gap-2"><User className="h-4 w-4" />{clientFilter === 'all' ? 'კლიენტი' : uniqueClients.find(c => c.id === clientFilter)?.name || 'კლიენტი'}</div></Button></DropdownMenuTrigger>
                <DropdownMenuContent className="w-[300px] p-0"><div className="p-2"><Input placeholder="ძებნა..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} autoFocus /></div><div className="max-h-[200px] overflow-y-auto"><DropdownMenuItem onClick={() => setClientFilter('all')}>ყველა კლიენტი</DropdownMenuItem>{filteredClients.map(c => <DropdownMenuItem key={c.id} onClick={() => setClientFilter(c.id)}>{c.name}</DropdownMenuItem>)}</div></DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
            {loading ? <div className="p-6 space-y-4">{[1,2,3].map(i => <div key={i} className="h-6 bg-slate-200 rounded animate-pulse"></div>)}</div> : processedInvoices.length === 0 ? (
              <div className="text-center py-20"><FileText className="h-8 w-8 mx-auto text-slate-400 mb-4" /><h3 className="text-lg font-medium text-slate-900">ვერ მოიძებნა</h3></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr><SortableHeader label="ID" sortKey="invoice_number" /><SortableHeader label="კლიენტი" sortKey="client_name" /><SortableHeader label="ჯამი" sortKey="total" /><th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">თარიღები</th><SortableHeader label="სტატუსი" sortKey="payment_status" /><th className="px-4 py-3 text-right"></th></tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    <AnimatePresence>
                      {processedInvoices.map((invoice, index) => {
                         const isPaid = invoice.payment_status === 'paid';
                         return (
                          <motion.tr key={invoice.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate(`/invoices/${invoice.id}`)} className="hover:bg-slate-50 cursor-pointer group">
                            <td className="px-4 py-4 text-sm font-bold text-indigo-600 font-mono">{invoice.invoice_number}</td>
                            <td className="px-4 py-4 text-sm font-medium text-slate-900">{invoice.clients?.company || invoice.clients?.name}</td>
                            <td className="px-4 py-4 text-sm font-bold text-slate-700">{(invoice.total || 0).toLocaleString('ka-GE')} ₾</td>
                            <td className="px-4 py-4 text-xs text-slate-600">{formatDateDDMMYYYY(invoice.invoice_date)} - {formatDateDDMMYYYY(invoice.due_date)}</td>
                            <td className="px-4 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isPaid ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>{isPaid ? 'გადახდილი' : 'გადასახდელი'}</span></td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 rounded-full" onClick={(e) => { e.stopPropagation(); handleDownloadPDF(invoice); }}><Download className="h-4 w-4" /></Button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Invoices;
