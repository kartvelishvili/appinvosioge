
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, PenTool, Download, Receipt, MessageSquare, Eye, X, CheckCircle, Link as LinkIcon, Copy, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import html2pdf from 'html2pdf.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { normalizePhoneNumber } from '@/utils/sendSMSCampaign';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const contractRef = useRef(null);
  
  // SMS History State
  const [smsHistory, setSmsHistory] = useState([]);
  const [isSmsHistoryOpen, setIsSmsHistoryOpen] = useState(false);
  const [selectedSms, setSelectedSms] = useState(null);

  useEffect(() => {
    fetchContract();
    fetchSmsHistory();
  }, [id]);

  const fetchContract = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, clients(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      setContract(data);
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: "კონტრაქტი ვერ მოიძებნა" });
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  const fetchSmsHistory = async () => {
    try {
        const { data, error } = await supabase
            .from('sms_history')
            .select('*')
            .eq('contract_id', id)
            .order('sent_at', { ascending: false });
        
        if (error) throw error;
        setSmsHistory(data || []);
    } catch (error) {
        console.error("Error fetching SMS history:", error);
    }
  };

  // Helper function to replace codes with actual data and signature images
  const processContractContent = () => {
    if (!contract) return '';

    let content = contract.description || ''; 
    
    const replacements = {
      '[CLIENT_NAME]': contract.clients?.company || contract.clients?.name || '',
      '[CLIENT_ID]': contract.clients?.company_id || '',
      '[CLIENT_ADDRESS]': contract.clients?.address || '',
      '[CLIENT_PHONE]': contract.clients?.phone || '',

      '[CONTRACT_NUMBER]': contract.contract_number,
      '[START_DATE]': contract.start_date ? new Date(contract.start_date).toLocaleDateString('ka-GE') : '',
      '[END_DATE]': contract.end_date ? new Date(contract.end_date).toLocaleDateString('ka-GE') : 'უვადო',
      '[AMOUNT]': contract.amount || '0',
    };

    // Replace text placeholders
    Object.keys(replacements).forEach(key => {
      content = content.split(key).join(replacements[key]);
    });

    // Replace signatures
    const clientSigHtml = contract.client_signature_url 
      ? `<img src="${contract.client_signature_url}" alt="Client Signature" style="height: 60px; mix-blend-mode: multiply;" />`
      : `<div style="padding: 20px; border: 1px dashed #ccc; color: #999; text-align: center; font-size: 12px;">(დამკვეთის ხელმოწერა)</div>`;

    content = content.split('[CLIENT_SIGNATURE]').join(clientSigHtml);

    return content.replace(/\n/g, '<br/>');
  };

  const handleDownloadPDF = () => {
    const element = contractRef.current;
    if (!element) return;
    const opt = {
      margin: 10,
      filename: `contract_${contract.contract_number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  const handleGenerateInvoice = async () => {
      if(!contract.client_id) return;
      const confirm = window.confirm("გსურთ ინვოისის ავტომატური გენერირება?");
      if(!confirm) return;

      try {
           const { data: lastInv } = await supabase.from('invoices').select('invoice_number').order('created_at', { ascending: false }).limit(1);
           let newNumber = 'INV-AUTO-001';
           if (lastInv && lastInv.length > 0) {
                const lastNum = lastInv[0].invoice_number;
                const numPart = parseInt(lastNum.split('-')[1] || 0) + 1;
                newNumber = `INV-${String(numPart).padStart(4, '0')}`;
           }

           const subtotal = parseFloat(contract.amount || 0);
           const vat = subtotal * 0.18;
           const total = subtotal + vat;

           const { data: { user } } = await supabase.auth.getUser();
           if (!user) throw new Error("მომხმარებელი არ არის ავტორიზებული");

           const { data: invData, error: invError } = await supabase.from('invoices').insert({
               user_id: user.id,
               client_id: contract.client_id,
               invoice_number: newNumber,
               due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
               status: 'pending',
               payment_status: 'pending',
               subtotal: subtotal,
               tax_amount: vat,
               total_amount: total,
               vat_percentage: 18,
               contract_id: contract.id, // Link to contract
               contract_number: contract.contract_number, // Store snapshot
           }).select().single();

           if(invError) throw invError;
           
           await supabase.from('invoice_items').insert({
               invoice_id: invData.id,
               description: `მომსახურების საფასური ხელშეკრულებით ${contract.contract_number}`,
               quantity: 1,
               unit_price: subtotal,
               line_total: subtotal
           });

           toast({ title: "წარმატება", description: "ინვოისი შეიქმნა" });
           navigate(`/invoices/${invData.id}`);
      } catch(e) {
          toast({ variant: "destructive", title: "შეცდომა", description: e.message });
      }
  };

  const getClientLink = () => `${window.location.origin}/contracts/${contract.id}/sign/client?token=${contract.client_signing_token || ''}`;

  const sendNotifications = async () => {
    setSending(true);
    const clientLink = getClientLink();

    try {
        // --- EMAIL SENDING ---
        // Email to Client
        if(contract.clients?.email) {
            await api.post('/api/send-email', { 
                    recipients: [contract.clients.email], 
                    subject: 'ხელშეკრულება ხელმოწერისთვის', 
                    html: `<p>გთხოვთ ხელი მოაწეროთ ხელშეკრულებას ბმულზე: <a href="${clientLink}">ხელმოწერა</a></p>` 
                });
        }
        
        // --- SMS SENDING ---
        const smsPromises = [];
        
        // SMS to Client
        const clientPhone = contract.clients?.phone ? normalizePhoneNumber(contract.clients.phone) : null;
        if(clientPhone) {
            const msg = `გთხოვთ ხელი მოაწეროთ ხელშეკრულებას: ${clientLink}`;
            // Send SMS via Edge Function
            const smsReq = api.post('/api/send-sms', { numbers: [clientPhone], message: msg })
            .then(() => ({ error: null }))
            .catch(e => ({ error: e }))
            .then(async (res) => {
                // Log to History
                await supabase.from('sms_history').insert({
                    contract_id: id,
                    recipient_type: 'client',
                    recipient_phone: clientPhone,
                    recipient_name: contract.clients?.company || contract.clients?.name,
                    message: msg,
                    status: res.error ? 'failed' : 'sent'
                });
            });
            smsPromises.push(smsReq);
        }

        await Promise.all(smsPromises);
        
        // Update contract status if draft
        if(contract.status === 'draft') {
            await supabase.from('contracts').update({ status: 'sent' }).eq('id', id);
            fetchContract();
        }

        fetchSmsHistory(); // Refresh history table
        toast({ title: "გაიგზავნა", description: "შეტყობინებები გაეგზავნა მხარეებს" });
        setIsSendModalOpen(false);
    } catch (e) {
        toast({ variant: "destructive", title: "შეცდომა", description: e.message });
    } finally {
        setSending(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ description: "ლინკი დაკოპირდა" });
  };

  const openSmsHistory = () => {
    setIsSmsHistoryOpen(true);
  };

  const regenerateTokens = async () => {
      const confirm = window.confirm("ლინკების განახლება გააუქმებს ძველ ლინკებს. დარწმუნებული ხართ?");
      if(!confirm) return;
      
      try {
          const { error } = await supabase.from('contracts').update({
              client_signing_token: crypto.randomUUID()
          }).eq('id', id);
          
          if(error) throw error;
          
          toast({ title: "განახლდა", description: "ხელმოწერის ლინკები განახლდა" });
          fetchContract();
      } catch(e) {
          toast({ variant: "destructive", title: "შეცდომა", description: e.message });
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!contract) return null;

  return (
    <>
      <Helmet><title>კონტრაქტი {contract.contract_number} - Invoiso</title></Helmet>
      <div className="min-h-screen bg-slate-50 pb-12">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <Button onClick={() => navigate('/contracts')} variant="ghost" size="sm" className="text-slate-600"><ArrowLeft className="h-4 w-4 mr-2" /> უკან</Button>
                <div className="flex gap-2">
                    <Button onClick={() => setIsLinksModalOpen(true)} variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50">
                        <LinkIcon className="h-4 w-4 mr-2" /> ლინკები
                    </Button>
                     <Button onClick={() => setIsSendModalOpen(true)} variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                        <Send className="h-4 w-4 mr-2" /> გაგზავნა
                    </Button>
                     <Button onClick={openSmsHistory} variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50">
                        <MessageSquare className="h-4 w-4 mr-2" /> SMS ისტორია
                    </Button>
                    <Button onClick={handleDownloadPDF} variant="outline">
                        <Download className="h-4 w-4 mr-2" /> PDF
                    </Button>
                    {contract.status === 'signed' && (
                         <Button onClick={handleGenerateInvoice} className="bg-green-600 hover:bg-green-700 text-white">
                            <Receipt className="h-4 w-4 mr-2" /> ინვოისი
                        </Button>
                    )}
                </div>
            </motion.div>

            <div className="bg-white shadow-lg p-12 min-h-[297mm] mx-auto" ref={contractRef}>
                <div 
                    className="prose max-w-none font-sans text-sm leading-relaxed text-justify"
                    dangerouslySetInnerHTML={{ __html: processContractContent() }}
                />
            </div>
        </div>

        {/* Send Modal */}
        <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>კონტრაქტის გაგზავნა</DialogTitle>
                    <DialogDescription>
                        ეს ქმედება გაუგზავნის ხელმოწერის ბმულს კლიენტს ({contract.clients?.email}) Email-ით და SMS-ით.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSendModalOpen(false)}>გაუქმება</Button>
                    <Button onClick={sendNotifications} disabled={sending}>{sending ? 'იგზავნება...' : 'გაგზავნა'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* Links Modal */}
        <Dialog open={isLinksModalOpen} onOpenChange={setIsLinksModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>ხელმოწერის ლინკები</DialogTitle>
                    <DialogDescription>
                        მუდმივი ლინკები ხელშეკრულების ხელმოსაწერად.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>დამკვეთის ლინკი</Label>
                        <div className="flex gap-2">
                            <Input readOnly value={getClientLink()} />
                            <Button size="icon" variant="outline" onClick={() => copyToClipboard(getClientLink())}><Copy className="h-4 w-4"/></Button>
                        </div>
                    </div>
                    <div className="pt-2">
                        <Button variant="ghost" size="sm" onClick={regenerateTokens} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <RefreshCw className="h-3 w-3 mr-2"/> ლინკების განახლება (ძველები გაუქმდება)
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => setIsLinksModalOpen(false)}>დახურვა</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* SMS History Modal */}
        <Dialog open={isSmsHistoryOpen} onOpenChange={setIsSmsHistoryOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>SMS ისტორია</DialogTitle>
                    <DialogDescription>ამ კონტრაქტთან დაკავშირებული ყველა SMS შეტყობინება</DialogDescription>
                </DialogHeader>
                
                <div className="mt-4 max-h-[400px] overflow-y-auto">
                    {smsHistory.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">ისტორია ცარიელია</div>
                    ) : (
                        <div className="space-y-4">
                            {smsHistory.map((sms) => (
                                <div key={sms.id} className="border rounded-lg p-4 bg-slate-50 hover:bg-white transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${sms.recipient_type === 'client' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {sms.recipient_type === 'client' ? 'დამკვეთი' : 'შემსრულებელი'}
                                            </span>
                                            <span className="text-sm font-semibold text-slate-900">{sms.recipient_name}</span>
                                            <span className="text-xs text-slate-500 ml-2">({sms.recipient_phone})</span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${sms.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {sms.status === 'sent' ? 'გაგზავნილია' : 'ვერ გაიგზავნა'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2">{sms.message}</p>
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="text-xs text-slate-400">{new Date(sms.sent_at).toLocaleString('ka-GE')}</span>
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedSms(sms)} className="h-6 text-xs text-indigo-600">
                                            <Eye className="h-3 w-3 mr-1"/> სრულად
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>

        {/* Full Message View Modal (Nested or separate) */}
        {selectedSms && (
             <Dialog open={!!selectedSms} onOpenChange={() => setSelectedSms(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>შეტყობინების დეტალები</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-slate-500">მიმღები:</span> <div className="font-medium">{selectedSms.recipient_name}</div></div>
                            <div><span className="text-slate-500">ტელეფონი:</span> <div className="font-medium">{selectedSms.recipient_phone}</div></div>
                            <div><span className="text-slate-500">დრო:</span> <div className="font-medium">{new Date(selectedSms.sent_at).toLocaleString('ka-GE')}</div></div>
                            <div><span className="text-slate-500">სტატუსი:</span> <div className="font-medium">{selectedSms.status}</div></div>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-md border text-sm text-slate-800 whitespace-pre-wrap">
                            {selectedSms.message}
                         </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setSelectedSms(null)}>დახურვა</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </div>
    </>
  );
};

export default ContractDetail;
