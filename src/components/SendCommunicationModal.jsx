import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Mail, MessageSquare, Send, Loader2 } from 'lucide-react';
import { normalizePhoneNumber, countSmsSegments } from '@/utils/sendSMSCampaign';

const SendCommunicationModal = ({ isOpen, onClose, invoice, onSent }) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('email');
    const [loading, setLoading] = useState(false);
    
    // Templates
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [smsTemplates, setSmsTemplates] = useState([]);

    // Email state
    const [selectedEmailTemplate, setSelectedEmailTemplate] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');

    // SMS state
    const [selectedSmsTemplate, setSelectedSmsTemplate] = useState('');
    const [smsBody, setSmsBody] = useState('');
    const [smsInfo, setSmsInfo] = useState({ count: 0, segments: 0 });

    useEffect(() => {
        if(isOpen) {
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
        
        // Set default payment request template if available
        const defaultEmailTpl = emailRes.data?.find(t => t.name === 'Payment Request Email');
        if (defaultEmailTpl) {
            handleEmailTemplateChange(defaultEmailTpl.id);
        }

        const defaultSmsTpl = smsRes.data?.find(t => t.name === 'Payment Reminder SMS');
        if (defaultSmsTpl) {
            handleSmsTemplateChange(defaultSmsTpl.id);
        }
    };

    const replaceVariables = (text) => {
        if (!text || !invoice) return '';
        const variables = {
            '{client_name}': invoice.clients?.name || '',
            '{invoice_number}': invoice.invoice_number || '',
            '{amount}': `${Math.round(invoice.total_amount)} GEL`,
            '{due_date}': new Date(invoice.due_date).toLocaleDateString('ka-GE'),
            '{performer_name}': invoice.performers?.name || '',
            '{payment_link}': `${window.location.origin}/invoices/${invoice.id}/public`,
        };
        let processedText = text;
        for (const [key, value] of Object.entries(variables)) {
            processedText = processedText.replace(new RegExp(key, 'g'), value);
        }
        return processedText;
    };

    const handleEmailTemplateChange = (templateId) => {
        setSelectedEmailTemplate(templateId);
        const template = emailTemplates.find(t => t.id === templateId);
        if (template) {
            setEmailSubject(replaceVariables(template.subject));
            setEmailBody(replaceVariables(template.content));
        }
    };
    
    const handleSmsTemplateChange = (templateId) => {
        setSelectedSmsTemplate(templateId);
        const template = smsTemplates.find(t => t.id === templateId);
        if (template) {
            const newBody = replaceVariables(template.content);
            setSmsBody(newBody);
            setSmsInfo(countSmsSegments(newBody));
        }
    };

    useEffect(() => {
        setSmsInfo(countSmsSegments(smsBody));
    }, [smsBody]);

    const handleSend = async () => {
        setLoading(true);
        if (activeTab === 'email') {
            await handleSendEmail();
        } else {
            await handleSendSms();
        }
        setLoading(false);
    };

    const handleSendEmail = async () => {
        if (!invoice.clients?.email) {
            toast({ variant: 'destructive', title: 'კლიენტს არ აქვს მეილი მითითებული' });
            return;
        }
        const htmlContent = `<div style="font-family: sans-serif; line-height: 1.6;">${emailBody.replace(/\n/g, '<br/>')}</div>`;
        try {
            await api.post('/api/send-email', { recipients: [invoice.clients.email], subject: emailSubject, html: htmlContent });
            await supabase.from('reminders_log').insert({ invoice_id: invoice.id, reminder_type: 'email', status: 'sent', sent_at: new Date().toISOString(), recipient: invoice.clients.email, template_name: emailTemplates.find(t=>t.id===selectedEmailTemplate)?.name || 'Custom' });
            toast({ title: 'Email წარმატებით გაიგზავნა' });
            onSent();
            onClose();
        } catch (e) {
            await supabase.from('reminders_log').insert({ invoice_id: invoice.id, reminder_type: 'email', status: 'failed', sent_at: new Date().toISOString(), details: e.message, recipient: invoice.clients.email, template_name: emailTemplates.find(t=>t.id===selectedEmailTemplate)?.name || 'Custom' });
            toast({ variant: 'destructive', title: 'Email-ის გაგზავნა ვერ მოხერხდა', description: e.message });
        }
    };

    const handleSendSms = async () => {
        const phone = normalizePhoneNumber(invoice.clients?.phone);
        if (!phone) {
            toast({ variant: 'destructive', title: 'კლიენტს არ აქვს ვალიდური ნომერი' });
            return;
        }
        try {
            const smsResult = await api.post('/api/send-sms', { numbers: [phone], message: smsBody });
            if (!smsResult.success) throw new Error(smsResult.details || smsResult.error || 'SMS service error');
            
            await supabase.from('reminders_log').insert({ invoice_id: invoice.id, reminder_type: 'sms', status: 'sent', sent_at: new Date().toISOString(), recipient: phone, template_name: smsTemplates.find(t=>t.id===selectedSmsTemplate)?.name || 'Custom' });
            toast({ title: 'SMS წარმატებით გაიგზავნა' });
            onSent();
            onClose();
        } catch (e) {
            await supabase.from('reminders_log').insert({ invoice_id: invoice.id, reminder_type: 'sms', status: 'failed', sent_at: new Date().toISOString(), details: e.message, recipient: phone, template_name: smsTemplates.find(t=>t.id===selectedSmsTemplate)?.name || 'Custom' });
            toast({ variant: 'destructive', title: 'SMS-ის გაგზავნა ვერ მოხერხდა', description: e.message });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>შეტყობინების გაგზავნა (Quick Transfer)</DialogTitle>
                    <DialogDescription>
                        აირჩიეთ არხი და გაუგზავნეთ ინვოისი კლიენტს.
                    </DialogDescription>
                </DialogHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2"/>Email</TabsTrigger>
                        <TabsTrigger value="sms"><MessageSquare className="h-4 w-4 mr-2"/>SMS</TabsTrigger>
                    </TabsList>
                    <TabsContent value="email" className="space-y-4 pt-4">
                        <div>
                            <Label htmlFor="email-recipient">მიმღები</Label>
                            <Input id="email-recipient" value={invoice?.clients?.email || 'N/A'} readOnly />
                        </div>
                        <div>
                            <Label htmlFor="email-template">შაბლონი</Label>
                            <Select value={selectedEmailTemplate} onValueChange={handleEmailTemplateChange}>
                                <SelectTrigger><SelectValue placeholder="აირჩიეთ Email შაბლონი" /></SelectTrigger>
                                <SelectContent>
                                    {emailTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="email-subject">Subject</Label>
                            <Input id="email-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="email-body">Content</Label>
                            <Textarea id="email-body" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={8} />
                        </div>
                    </TabsContent>
                    <TabsContent value="sms" className="space-y-4 pt-4">
                        <div>
                            <Label htmlFor="sms-recipient">მიმღები</Label>
                            <Input id="sms-recipient" value={invoice?.clients?.phone || 'N/A'} readOnly />
                        </div>
                        <div>
                            <Label htmlFor="sms-template">შაბლონი</Label>
                             <Select value={selectedSmsTemplate} onValueChange={handleSmsTemplateChange}>
                                <SelectTrigger><SelectValue placeholder="აირჩიეთ SMS შაბლონი" /></SelectTrigger>
                                <SelectContent>
                                    {smsTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label htmlFor="sms-body">Content</Label>
                            <Textarea id="sms-body" value={smsBody} onChange={(e) => setSmsBody(e.target.value)} rows={5} />
                            <p className="text-xs text-slate-500 mt-1 text-right">სიმბოლო: {smsInfo.count} / სეგმენტი: {smsInfo.segments}</p>
                        </div>
                    </TabsContent>
                </Tabs>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>გაუქმება</Button>
                    <Button onClick={handleSend} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4 mr-2" />}
                        გაგზავნა
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SendCommunicationModal;