import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/customSupabaseClient';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const EmailLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            const { data } = await supabase.from('email_logs').select('*').order('created_at', { ascending: false });
            setLogs(data || []);
            setLoading(false);
        };
        fetchLogs();
    }, []);

    return (
        <>
            <Helmet><title>Email ლოგები</title></Helmet>
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <h1 className="text-2xl font-bold mb-8">Email ლოგები</h1>
                    <div className="bg-white rounded-lg shadow border overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">თარიღი</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">მიმღები</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">თემა</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">სტატუსი</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ინფო</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(log.created_at).toLocaleString('ka-GE')}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900">{log.recipient_email}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{log.subject}</td>
                                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs ${log.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{log.status}</span></td>
                                        <td className="px-6 py-4">
                                            <Dialog>
                                                <DialogTrigger asChild><Button variant="ghost" size="sm"><Eye className="h-4 w-4"/></Button></DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader><DialogTitle>დეტალები</DialogTitle></DialogHeader>
                                                    <div className="mt-4 text-sm space-y-2">
                                                        <p><strong>ID:</strong> {log.email_id}</p>
                                                        <div className="border p-2 bg-slate-50 rounded overflow-auto max-h-48">
                                                            <pre>{JSON.stringify(log.api_response, null, 2)}</pre>
                                                        </div>
                                                        <p><strong>Message Content:</strong></p>
                                                        <div className="border p-2 bg-slate-50 rounded overflow-auto max-h-48 text-xs">
                                                            {log.message}
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};
export default EmailLogs;