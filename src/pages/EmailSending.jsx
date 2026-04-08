import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Send, Mail } from 'lucide-react';
import { sendEmailCampaign } from '@/utils/sendEmailCampaign';

const EmailSending = () => {
    const { toast } = useToast();
    const [sending, setSending] = useState(false);
    const [recipients, setRecipients] = useState('');
    const [subject, setSubject] = useState('');
    const [html, setHtml] = useState('');
    
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        const fetchTpls = async () => {
            const { data } = await supabase.from('email_templates').select('*');
            setTemplates(data || []);
        };
        fetchTpls();
    }, []);

    const handleTemplateSelect = (e) => {
        const tpl = templates.find(t => t.id === e.target.value);
        if (tpl) {
            setSubject(tpl.subject);
            setHtml(tpl.content);
        }
    };

    const handleSend = async () => {
        const emailList = recipients.split('\n').map(e => e.trim()).filter(e => e);
        if (emailList.length === 0) return toast({variant: "destructive", title: "შეცდომა", description: "მიუთითეთ ადრესატები"});
        if (!subject || !html) return toast({variant: "destructive", title: "შეცდომა", description: "შეავსეთ თემა და შინაარსი"});

        setSending(true);
        try {
            // Convert plain newlines to BR if user typed manually and it's not HTML
            let finalHtml = html;
            if (!finalHtml.trim().startsWith('<') && finalHtml.includes('\n')) {
                 finalHtml = `<div style="font-family:sans-serif">${finalHtml.replace(/\n/g, '<br/>')}</div>`;
            }

            const result = await sendEmailCampaign(emailList, subject, finalHtml);
            
            if (result.success) {
                // Check for individual failures
                const failed = result.results?.filter(r => !r.success);
                if (failed && failed.length > 0) {
                     toast({ 
                        variant: "warning", 
                        title: "ნაწილობრივი წარმატება", 
                        description: `${failed.length} მეილი ვერ გაიგზავნა. შეამოწმეთ ლოგები.` 
                     });
                } else {
                     toast({ title: "წარმატება", description: "ყველა მეილი გაიგზავნა" });
                     setRecipients('');
                     setSubject('');
                     setHtml('');
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({variant: "destructive", title: "შეცდომა", description: error.message});
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <Helmet><title>Email გაგზავნა</title></Helmet>
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <h1 className="text-2xl font-bold mb-8">Email გაგზავნა</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-4 bg-white p-6 rounded-lg border">
                            <div>
                                <label className="text-sm font-medium mb-2 block">მიმღები Emails (თითო ხაზზე)</label>
                                <Textarea value={recipients} onChange={e => setRecipients(e.target.value)} placeholder="client@example.com" className="h-32" />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">შაბლონი</label>
                                <select className="w-full p-2 border rounded" onChange={handleTemplateSelect}>
                                    <option value="">აირჩიეთ შაბლონი...</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">თემა</label>
                                <Input value={subject} onChange={e => setSubject(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">შინაარსი (HTML)</label>
                                <Textarea value={html} onChange={e => setHtml(e.target.value)} className="h-48 font-mono" />
                            </div>
                            <Button onClick={handleSend} disabled={sending} className="w-full">
                                <Send className="mr-2 h-4 w-4" /> {sending ? 'იგზავნება...' : 'გაგზავნა'}
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded border border-blue-100 text-sm text-blue-800">
                                <h4 className="font-bold mb-2 flex items-center gap-2"><Mail className="h-4 w-4"/> ინსტრუქცია</h4>
                                <p>შეიყვანეთ ელ-ფოსტები სათითაოდ ახალ ხაზზე. მხარდაჭერილია HTML ფორმატირება.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
export default EmailSending;