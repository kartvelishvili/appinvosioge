import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Clock, Mail, MessageSquare, Save, Eye, Zap, Loader2 } from 'lucide-react';
import { normalizePhoneNumber } from '@/utils/sendSMSCampaign';

const FREQUENCIES = [
    { value: '1h', label: 'ყოველ 1 საათში შეხსენება' },
    { value: '6h', label: 'ყოველ 6 საათში შეხსენება' },
    { value: '24h', label: 'ყოველ 24 საათში შეხსენება' },
    { value: '48h', label: 'ყოველ 48 საათში შეხსენება' }
];

const ReminderModal = ({ isOpen, onClose, invoice }) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('email');
    const [loading, setLoading] = useState(false);
    const [sendingNow, setSendingNow] = useState(false);
    
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [smsTemplates, setSmsTemplates] = useState([]);
    
    const [frequency, setFrequency] = useState('24h');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [previewContent, setPreviewContent] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        const [emailRes, smsRes] = await Promise.all([
            supabase.from('email_templates').select('*'),
            supabase.from('sms_templates').select('*')
        ]);
        setEmailTemplates(emailRes.data || []);
        setSmsTemplates(smsRes.data || []);
    };

    const replaceVariables = (content) => {
        if (!content || !invoice) return '';
        const variables = {
            '{invoiceNumber}': invoice.invoice_number || '',
            '{clientName}': invoice.clients?.name || invoice.clients?.company_name || '',
            '{amount}': `${invoice.total_amount} ${invoice.currency}`,
            '{dueDate}': new Date(invoice.due_date).toLocaleDateString('ka-GE'),
            '{providerName}': invoice.performers?.name || '',
            '{paymentLink}': `${window.location.origin}/invoices/${invoice.id}/public`
        };
        
        let processed = content;
        Object.entries(variables).forEach(([key, value]) => {
            processed = processed.replace(new RegExp(key, 'g'), value);
        });
        return processed;
    };

    const handleTemplateChange = (templateId) => {
        setSelectedTemplate(templateId);
        const templates = activeTab === 'email' ? emailTemplates : smsTemplates;
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setPreviewContent(replaceVariables(template.content));
        } else {
            setPreviewContent('');
        }
    };

    const handleTabChange = (value) => {
        setActiveTab(value);
        setSelectedTemplate('');
        setPreviewContent('');
    };

    const handleSendNow = async () => {
        if (!selectedTemplate) {
            toast({ variant: "destructive", title: "შეცდომა", description: "გთხოვთ აირჩიოთ შაბლონი" });
            return;
        }
        
        setSendingNow(true);
        const templates = activeTab === 'email' ? emailTemplates : smsTemplates;
        const template = templates.find(t => t.id === selectedTemplate);
        
        if (!template) {
             setSendingNow(false);
             return;
        }
        
        const content = replaceVariables(template.content);

        try {
            if (activeTab === 'email') {
                 if (!invoice.clients?.email) throw new Error("კლიენტს არ აქვს ელ.ფოსტა");
                 const subject = replaceVariables(template.subject);
                 const htmlContent = `<div style="font-family: sans-serif; line-height: 1.6;">${content.replace(/\n/g, '<br/>')}</div>`;
                 
                 await api.post('/api/send-email', { recipients: [invoice.clients.email], subject, html: htmlContent });
                
                await supabase.from('reminders_log').insert({ 
                    invoice_id: invoice.id, 
                    reminder_type: 'email', 
                    status: 'sent', 
                    sent_at: new Date().toISOString(), 
                    recipient: invoice.clients.email, 
                    template_name: template.name 
                });

            } else {
                 const phone = normalizePhoneNumber(invoice.clients?.phone);
                 if (!phone) throw new Error("კლიენტს არ აქვს ვალიდური ტელეფონი");
                 
                 const smsResult = await api.post('/api/send-sms', { numbers: [phone], message: content });
                 if (!smsResult.success) throw new Error(smsResult.details || smsResult.error || 'SMS service error');

                await supabase.from('reminders_log').insert({ 
                    invoice_id: invoice.id, 
                    reminder_type: 'sms', 
                    status: 'sent', 
                    sent_at: new Date().toISOString(), 
                    recipient: phone, 
                    template_name: template.name 
                });
            }
            
            toast({ title: "შეხსენება გაიგზავნა" });
            onClose();

        } catch (error) {
            toast({ variant: "destructive", title: "შეცდომა", description: error.message });
            // Log failure
            const recipient = activeTab === 'email' ? invoice.clients?.email : normalizePhoneNumber(invoice.clients?.phone);
            await supabase.from('reminders_log').insert({ 
                    invoice_id: invoice.id, 
                    reminder_type: activeTab, 
                    status: 'failed', 
                    sent_at: new Date().toISOString(), 
                    recipient: recipient || 'Unknown', 
                    details: error.message,
                    template_name: template.name 
            });
        } finally {
            setSendingNow(false);
        }
    };

    const handleSaveSchedule = async () => {
        if (!selectedTemplate) {
            toast({ variant: "destructive", title: "შეცდომა", description: "გთხოვთ აირჩიოთ შაბლონი" });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('reminder_schedules').insert({
                invoice_id: invoice.id,
                frequency,
                template_id: selectedTemplate,
                template_type: activeTab,
                status: 'active',
                next_run_at: new Date().toISOString() // Start immediately-ish
            });

            if (error) throw error;

            toast({
                title: "შეხსენება გააქტიურდა",
                description: `სისტემა გააგზავნის შეხსენებას ${FREQUENCIES.find(f => f.value === frequency)?.label.toLowerCase()}.`
            });
            onClose();
        } catch (error) {
            toast({ variant: "destructive", title: "შეცდომა", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-indigo-600" />
                        ავტომატური შეხსენება
                    </DialogTitle>
                    <DialogDescription>
                        დააყენეთ ავტომატური შეხსენების განრიგი ინვოისისთვის № {invoice?.invoice_number}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Invoice Info Snippet */}
                    <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-sm grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-slate-500 block text-xs uppercase">კლიენტი</span>
                            <span className="font-semibold text-slate-800">{invoice?.clients?.company_name || invoice?.clients?.name}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs uppercase">თანხა</span>
                            <span className="font-semibold text-slate-800">{invoice?.total_amount} {invoice?.currency}</span>
                        </div>
                    </div>

                    {/* Frequency Selector */}
                    <div className="space-y-2">
                        <Label>სიხშირე (ავტომატური განრიგისთვის)</Label>
                        <Select value={frequency} onValueChange={setFrequency}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FREQUENCIES.map(f => (
                                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Template System */}
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" /> Email
                            </TabsTrigger>
                            <TabsTrigger value="sms" className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> SMS
                            </TabsTrigger>
                        </TabsList>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>აირჩიეთ შაბლონი</Label>
                                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="აირჩიეთ შაბლონი..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(activeTab === 'email' ? emailTemplates : smsTemplates).map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Preview */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2">
                                        <Eye className="h-3 w-3" /> შეტყობინების "Preview"
                                    </Label>
                                    <span className="text-xs text-slate-400 italic">ცვლადები ავტომატურად შეიცვლება</span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 min-h-[120px] text-sm whitespace-pre-wrap font-mono text-slate-700">
                                    {previewContent || <span className="text-slate-400 italic">აირჩიეთ შაბლონი რომ ნახოთ შედეგი...</span>}
                                </div>
                            </div>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                     <div className="flex-1 flex gap-2">
                        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">გაუქმება</Button>
                        <Button 
                            variant="secondary" 
                            onClick={handleSendNow} 
                            disabled={sendingNow || !selectedTemplate} 
                            className="w-full sm:w-auto text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200"
                        >
                            {sendingNow ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Zap className="h-4 w-4 mr-2" />}
                            ახლავე შეხსენება
                        </Button>
                     </div>
                    <Button onClick={handleSaveSchedule} disabled={loading || !selectedTemplate} className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'აქტიურდება...' : 'განრიგის გააქტიურება'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ReminderModal;