import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, History, CheckCircle2 } from 'lucide-react';
import PreviousMonthInvoiceCard from './PreviousMonthInvoiceCard';
import { useAutoInvoiceApproval } from '@/hooks/useAutoInvoiceApproval';

const PreviousMonthInvoicesSection = () => {
  const { loading, candidates, approveInvoice, rejectInvoice, approveAll } = useAutoInvoiceApproval();
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidates.map(c => c.id));
    }
  };

  const handleBulkApprove = async () => {
    await approveAll(selectedIds);
    setSelectedIds([]);
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2"><Loader2 className="animate-spin h-5 w-5"/> იტვირთება...</div>;
  }

  if (candidates.length === 0) {
    return (
      <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">წინა თვის ინვოისები არ მოიძებნა</p>
        <p className="text-xs text-slate-400 mt-1">ყველა ინვოისი დამუშავებულია</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-600" />
            წინა თვის ინვოისები
          </h2>
          <p className="text-xs text-slate-500 mt-1">დაამტკიცეთ და ავტომატურად შექმენით ახალი პერიოდის ინვოისები</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
             <Checkbox 
                id="select-all-prev" 
                checked={selectedIds.length === candidates.length && candidates.length > 0} 
                onCheckedChange={handleSelectAll} 
             />
             <label htmlFor="select-all-prev" className="text-xs font-medium text-slate-600 cursor-pointer select-none">ყველა ({candidates.length})</label>
          </div>
          {selectedIds.length > 0 && (
            <Button size="sm" onClick={handleBulkApprove} className="bg-green-600 hover:bg-green-700 text-white animate-in zoom-in">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                დამტკიცება ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {candidates.map((invoice) => (
          <PreviousMonthInvoiceCard 
            key={invoice.id}
            invoice={invoice}
            isSelected={selectedIds.includes(invoice.id)}
            onToggleSelect={() => toggleSelect(invoice.id)}
            onApprove={approveInvoice}
            onReject={rejectInvoice}
          />
        ))}
      </div>
    </div>
  );
};

export default PreviousMonthInvoicesSection;