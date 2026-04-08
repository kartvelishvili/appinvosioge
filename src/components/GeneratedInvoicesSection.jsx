import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArrowRight, Edit, Trash2, Repeat, CheckSquare, Square, Clock, Archive } from 'lucide-react';
import { formatDateDDMMYYYY } from '@/utils/formatDate';
import InvoiceTransferModal from './InvoiceTransferModal';
import ReplaceInvoiceModal from './ReplaceInvoiceModal';

const GeneratedInvoicesSection = ({ invoices, onDelete, onTransfer, onReplace }) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [replaceModalOpen, setReplaceModalOpen] = useState(false);
    const [selectedInvoiceForAction, setSelectedInvoiceForAction] = useState(null);

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === activeInvoices.length) setSelectedIds([]);
        else setSelectedIds(activeInvoices.map(i => i.id));
    };

    const handleTransferClick = (invoice) => {
        setSelectedInvoiceForAction(invoice);
        setTransferModalOpen(true);
    };

    const handleReplaceClick = (invoice) => {
        setSelectedInvoiceForAction(invoice);
        setReplaceModalOpen(true);
    };

    const activeInvoices = invoices.filter(i => i.status === 'პენდინგი');
    const transferredInvoices = invoices.filter(i => i.status !== 'პენდინგი');

    return (
        <div className="space-y-6 mt-8">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div>
                     <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        გენერირებული ინვოისები (Pending)
                     </h2>
                     <p className="text-xs text-slate-500 mt-1">ეს ინვოისები ელოდება საბოლოო გააქტიურებას</p>
                </div>
                {selectedIds.length > 0 && (
                     <Button variant="default" className="bg-green-600 hover:bg-green-700 animate-in fade-in">
                        <ArrowRight className="h-4 w-4 mr-2"/> გადატანა ({selectedIds.length})
                     </Button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <div onClick={toggleSelectAll} className="cursor-pointer">
                                        {selectedIds.length === activeInvoices.length && activeInvoices.length > 0 ? <CheckSquare className="h-4 w-4 text-indigo-600"/> : <Square className="h-4 w-4 text-slate-300"/>}
                                    </div>
                                </th>
                                <th className="px-6 py-4">კლიენტი</th>
                                <th className="px-6 py-4">თანხა</th>
                                <th className="px-6 py-4">პერიოდი</th>
                                <th className="px-6 py-4">სტატუსი</th>
                                <th className="px-6 py-4 text-right">მოქმედება</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence>
                                {activeInvoices.map((inv) => (
                                    <motion.tr 
                                        key={inv.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-slate-50 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div onClick={() => toggleSelect(inv.id)} className="cursor-pointer">
                                                {selectedIds.includes(inv.id) ? <CheckSquare className="h-4 w-4 text-indigo-600"/> : <Square className="h-4 w-4 text-slate-300"/>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-900 block">{inv.clients?.company_name}</span>
                                            <span className="text-xs text-slate-400">{inv.notes}</span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-700">{inv.amount} ₾</td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                {formatDateDDMMYYYY(inv.service_period_start)} - {formatDateDDMMYYYY(inv.service_period_end)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold border border-yellow-200 inline-flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" onClick={() => handleTransferClick(inv)} title="აქტივაცია" className="text-green-600 hover:bg-green-50 h-8 w-8"><ArrowRight className="h-4 w-4"/></Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleReplaceClick(inv)} title="ჩანაცვლება" className="text-blue-600 hover:bg-blue-50 h-8 w-8"><Repeat className="h-4 w-4"/></Button>
                                                <Button size="icon" variant="ghost" onClick={() => onDelete(inv.id)} title="წაშლა" className="text-red-500 hover:bg-red-50 h-8 w-8"><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {activeInvoices.length === 0 && (
                                    <tr><td colSpan="6" className="text-center py-12 text-slate-400">ახალი ინვოისები არ არის გენერირებული</td></tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {transferredInvoices.length > 0 && (
                 <div className="mt-12">
                    <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        ისტორია (ბოლო 5 გადატანილი)
                    </h3>
                     <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                        <table className="w-full text-sm text-left">
                             <tbody className="divide-y divide-slate-200">
                                {transferredInvoices.slice(0, 5).map(inv => (
                                     <tr key={inv.id}>
                                         <td className="px-6 py-3 text-slate-600 font-medium">{inv.clients?.company_name}</td>
                                         <td className="px-6 py-3 font-bold text-slate-700">{inv.amount} ₾</td>
                                         <td className="px-6 py-3 text-right text-xs text-slate-400">
                                            გადატანილია: {inv.transferred_at ? new Date(inv.transferred_at).toLocaleDateString('ka-GE') : '-'}
                                         </td>
                                     </tr>
                                ))}
                             </tbody>
                        </table>
                     </div>
                 </div>
            )}

            <InvoiceTransferModal 
                isOpen={transferModalOpen} 
                onClose={() => setTransferModalOpen(false)} 
                invoice={selectedInvoiceForAction}
                onConfirm={(dueDate) => {
                    onTransfer(selectedInvoiceForAction, dueDate);
                    setTransferModalOpen(false);
                }}
            />

            <ReplaceInvoiceModal
                isOpen={replaceModalOpen}
                onClose={() => setReplaceModalOpen(false)}
                invoice={selectedInvoiceForAction}
                onSubmit={(newData) => {
                    onReplace(selectedInvoiceForAction.id, newData);
                    setReplaceModalOpen(false);
                }}
            />
        </div>
    );
};

export default GeneratedInvoicesSection;