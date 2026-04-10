import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { FileText, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import html2pdf from 'html2pdf.js';
import InvoiceTemplate from '@/components/InvoiceTemplate';
import { useToast } from '@/components/ui/use-toast';

const PublicInvoice = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const [invoice, setInvoice] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Default Settings
    const [settings, setSettings] = useState({
        show_phone: true,
        show_signature: true
    });

    const invoiceRef = useRef(null);

    useEffect(() => {
        fetchInvoiceDetails();
    }, [id]);

    const fetchInvoiceDetails = async () => {
        setLoading(true);
        try {
            const [invoiceRes, itemsRes] = await Promise.all([
                supabase.from('invoices').select('*, clients(*), performers(*)').eq('id', id).maybeSingle(),
                supabase.from('invoice_items').select('*').eq('invoice_id', id)
            ]);

            if (invoiceRes.error) throw invoiceRes.error;
            if (!invoiceRes.data) throw new Error('not found');
            setInvoice(invoiceRes.data);
            setItems(itemsRes.data || []);

        } catch (error) {
            toast({ variant: "destructive", title: "შეცდომა", description: "ინვოისი ვერ მოიძებნა." });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        const element = invoiceRef.current;
        if (!element) return;

        const scale = 2;
        const canvasW = element.scrollWidth * scale;
        const canvasH = element.scrollHeight * scale;
        const pdfW = canvasW * 25.4 / (96 * scale);
        const pdfH = canvasH * 25.4 / (96 * scale);
      
        const opt = {
          margin: 0,
          filename: `${invoice.invoice_number}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale,
            useCORS: true, 
            logging: false,
            width: element.scrollWidth,
            height: element.scrollHeight,
          },
          jsPDF: { unit: 'mm', format: [pdfW, pdfH], orientation: 'portrait' },
          pagebreak: { mode: [] }
        };
      
        html2pdf().from(element).set(opt).save();
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    }

    if (!invoice) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">ინვოისი ვერ მოიძებნა</h2>
                    <p className="text-slate-600">ლინკი არასწორია ან ინვოისი წაშლილია.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>{invoice.invoice_number} - Invoiso</title>
                <link rel="stylesheet" href="//cdn.web-fonts.ge/fonts/bpg-glaho-web/css/bpg-glaho-web.min.css" />
                <style>{`
                    @media print {
                      @page { size: A4; margin: 0; }
                      body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                      }
                      body, .print-container { background: white !important; }
                      .no-print { display: none !important; }
                      
                      .print-container { min-height: unset !important; padding: 0 !important; margin: 0 !important; height: auto !important; background: white !important; }
                      .invoice-wrapper {
                          height: 297mm !important;
                          max-height: 297mm !important;
                          overflow: hidden !important;
                          box-shadow: none !important;
                          border: none !important;
                          margin: 0 !important;
                          padding: 0 !important;
                          width: 210mm !important;
                          max-width: 210mm !important;
                      }
                      .invoice-template-container { height: 297mm !important; max-height: 297mm !important; overflow: hidden !important; }
                    }
                `}</style>
            </Helmet>
            <div className="min-h-screen bg-slate-100 print-container font-sans">
                {/* Public Header - No Print */}
                <div className="bg-white shadow-sm border-b border-slate-200 py-4 no-print sticky top-0 z-50">
                    <div className="max-w-[210mm] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-8 w-8 text-indigo-600" />
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">Invoiso</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button onClick={handlePrint} variant="outline" size="sm" className="flex items-center gap-2">
                                <Printer className="h-4 w-4" /> ბეჭდვა
                            </Button>
                            <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="flex items-center gap-2">
                                <Download className="h-4 w-4" /> PDF
                            </Button>
                        </div>
                    </div>
                </div>

                {/* NOTE: Client Settings Panel removed as per requirement. Settings are read-only here. */}

                <div className="max-w-[210mm] mx-auto py-8 px-4 sm:px-0 invoice-wrapper">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                       <InvoiceTemplate 
                            invoice={invoice} 
                            items={items} 
                            innerRef={invoiceRef} 
                            showClientPhone={settings.show_phone}
                            showSignature={settings.show_signature}
                        />
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default PublicInvoice;