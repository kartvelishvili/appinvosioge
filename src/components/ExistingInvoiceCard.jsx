import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Repeat, Trash2, Edit, FileText } from 'lucide-react';
import { formatDateDDMMYYYY } from '@/utils/formatDate';
import { useNavigate } from 'react-router-dom';

const ExistingInvoiceCard = ({ invoice, onGenerateNext, onDelete, isBatchMode, isSelected, onToggleSelect }) => {
    const navigate = useNavigate();

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`bg-white rounded-xl border p-4 transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 relative ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-slate-100 shadow-sm'}`}
        >
            {/* Header / Top Row */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    {isBatchMode ? (
                        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} className="mt-0.5" />
                    ) : (
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <FileText className="h-4 w-4" />
                        </div>
                    )}
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">{invoice.invoice_number}</h4>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${invoice.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {invoice.payment_status === 'paid' ? 'გადახდილი' : 'გადაუხდელი'}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-slate-800">{invoice.total_amount} ₾</p>
                    <p className="text-[10px] text-slate-400">დღგ: {invoice.vat_percentage}%</p>
                </div>
            </div>

            {/* Dates */}
            <div className="bg-slate-50 rounded-lg p-2.5 mb-4 flex items-center justify-between text-xs border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>{formatDateDDMMYYYY(invoice.service_period_start)}</span>
                </div>
                <span className="text-slate-300">-</span>
                <div className="flex items-center gap-1.5 text-slate-600">
                    <span>{formatDateDDMMYYYY(invoice.service_period_end)}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => onGenerateNext(invoice)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs shadow-indigo-200 shadow-md"
                >
                    <Repeat className="h-3 w-3 mr-1.5" /> შემდეგი
                </Button>
                
                <div className="flex gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        title="რედაქტირება"
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onDelete(invoice.id)}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="წაშლა"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};

export default ExistingInvoiceCard;