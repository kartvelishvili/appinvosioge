import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/customSupabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const EmailReports = () => {
    const [stats, setStats] = useState({ sent: 0, failed: 0, total: 0 });
    
    useEffect(() => {
        const fetchStats = async () => {
            const { data } = await supabase.from('email_logs').select('status');
            if (data) {
                const sent = data.filter(l => l.status === 'sent').length;
                const failed = data.filter(l => l.status === 'failed').length;
                setStats({ sent, failed, total: data.length });
            }
        };
        fetchStats();
    }, []);

    const data = [
        { name: 'გაგზავნილი', value: stats.sent },
        { name: 'ვერ გაიგზავნა', value: stats.failed },
    ];
    const COLORS = ['#10b981', '#ef4444'];

    return (
        <>
            <Helmet><title>Email ანგარიშები</title></Helmet>
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <h1 className="text-2xl font-bold mb-8">Email ანგარიშები</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded shadow text-center">
                            <h3 className="text-gray-500 text-sm uppercase">სულ გაგზავნილი</h3>
                            <p className="text-3xl font-bold text-indigo-600">{stats.total}</p>
                        </div>
                        <div className="bg-white p-6 rounded shadow text-center">
                            <h3 className="text-gray-500 text-sm uppercase">წარმატებული</h3>
                            <p className="text-3xl font-bold text-green-600">{stats.sent}</p>
                        </div>
                        <div className="bg-white p-6 rounded shadow text-center">
                            <h3 className="text-gray-500 text-sm uppercase">წარუმატებელი</h3>
                            <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded shadow h-96">
                        <h3 className="font-bold mb-4">სტატისტიკა</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#4f46e5" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </>
    );
};
export default EmailReports;