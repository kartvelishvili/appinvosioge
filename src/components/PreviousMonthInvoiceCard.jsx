import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, X, Calendar, DollarSign } from 'lucide-react';

const PreviousMonthInvoiceCard = ({ invoice, isSelected, onToggleSelect, onApprove, onReject }) => {
  const [data, setData] = useState({
    amount: invoice.next_amount,
    vat: invoice.next_vat,
    start: invoice.next_service_start,
    end: invoice.next_service_end
  });

  const handleApprove = () => {
    onApprove(invoice, data);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-lg transition-all duration-300 relative group ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-100'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3">
          <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} className="mt-1" />
          <div>
            <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{invoice.clients?.company_name}</h4>
            <p className="text-xs text-slate-500 mt-0.5">წინა: {invoice.invoice_number}</p>
          </div>
        </div>
        <div className="text-right">
            <div className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">
                {invoice.service_period_start ? `${invoice.service_period_start} / ${invoice.service_period_end}` : 'პერიოდის გარეშე'}
            </div>
        </div>
      </div>

      <div className="space-y-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
        <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-indigo-500 shrink-0"/>
            <div className="flex items-center gap-1 w-full">
                <Input 
                    type="date" 
                    value={data.start} 
                    onChange={e => setData({...data, start: e.target.value})}
                    className="h-7 text-[10px] px-1 bg-white"
                />
                <span className="text-slate-300">-</span>
                <Input 
                    type="date" 
                    value={data.end} 
                    onChange={e => setData({...data, end: e.target.value})}
                    className="h-7 text-[10px] px-1 bg-white"
                />
            </div>
        </div>
        <div className="flex items-center gap-2">
            <DollarSign className="h-3 w-3 text-green-500 shrink-0"/>
            <div className="flex items-center gap-2 w-full">
                <div className="relative w-full">
                    <Input 
                        type="number" 
                        value={data.amount} 
                        onChange={e => setData({...data, amount: e.target.value})}
                        className="h-7 text-xs pr-6 bg-white"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">₾</span>
                </div>
                <div className="w-20 relative">
                     <Input 
                        type="number" 
                        value={data.vat} 
                        onChange={e => setData({...data, vat: e.target.value})}
                        className="h-7 text-xs pr-4 bg-white"
                    />
                    <span className="absolute right-1 top-1.5 text-[10px] text-slate-400">%</span>
                </div>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
        <Button 
            size="sm" 
            onClick={handleApprove}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs"
        >
            <Check className="h-3 w-3 mr-1.5" /> დამტკიცება
        </Button>
        <Button 
            size="sm" 
            variant="outline"
            onClick={() => onReject(invoice.id)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100"
            title="უარყოფა"
        >
            <X className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
};

export default PreviousMonthInvoiceCard;