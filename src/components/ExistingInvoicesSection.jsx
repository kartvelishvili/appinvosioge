import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Layers, ChevronDown, ChevronUp, CheckSquare } from 'lucide-react';
import ExistingInvoiceCard from './ExistingInvoiceCard';
import BatchGenerateModal from './BatchGenerateModal';
import { useGenerateFromExisting } from '@/hooks/useGenerateFromExisting';

const ExistingInvoicesSection = ({ groupedInvoices, loading, refreshData, onDelete }) => {
    const { generateFromExisting, batchGenerate, generating } = useGenerateFromExisting(refreshData);
    
    // Batch Mode State
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [batchModalOpen, setBatchModalOpen] = useState(false);

    // Accordion State for groups (Default all open)
    const [openGroups, setOpenGroups] = useState(Object.keys(groupedInvoices).reduce((acc, key) => ({...acc, [key]: true}), {}));

    const toggleGroup = (key) => {
        setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleSelect = (invoice) => {
        setSelectedIds(prev => prev.includes(invoice.id) ? prev.filter(id => id !== invoice.id) : [...prev, invoice.id]);
    };

    const handleSelectAll = () => {
        if (selectedIds.length > 0) {
            setSelectedIds([]);
        } else {
            const allIds = Object.values(groupedInvoices).flatMap(group => group.invoices.slice(0, 1).map(i => i.id)); // Select most recent from each group? Or all? 
            // Better UX: Select MOST RECENT from each contract group, as usually you generate next month from the last one.
            const mostRecentIds = Object.values(groupedInvoices).map(g => g.invoices[0].id);
            setSelectedIds(mostRecentIds);
        }
    };

    const handleBatchConfirm = async () => {
        // Gather full invoice objects
        const allInvoices = Object.values(groupedInvoices).flatMap(g => g.invoices);
        const selectedInvoices = allInvoices.filter(inv => selectedIds.includes(inv.id));
        
        await batchGenerate(selectedInvoices);
        setBatchModalOpen(false);
        setSelectedIds([]);
        setIsBatchMode(false);
    };
    
    const handleDeleteWrapper = async (id) => {
        if (window.confirm("ნამდვილად გსურთ წაშლა?")) {
            await onDelete(id);
        }
    }

    if (loading) return <div className="py-10 text-center text-slate-400">იტვირთება ისტორია...</div>;

    const groupKeys = Object.keys(groupedInvoices);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="h-5 w-5 text-indigo-600" />
                        არსებული ინვოისები (ისტორია)
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">დააგენერირეთ ახალი ინვოისები ძველების საფუძველზე</p>
                </div>

                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <Switch id="batch-mode" checked={isBatchMode} onCheckedChange={setIsBatchMode} />
                        <Label htmlFor="batch-mode" className="text-sm cursor-pointer select-none">მასიური მონიშვნა</Label>
                    </div>
                    {isBatchMode && selectedIds.length > 0 && (
                        <Button size="sm" onClick={() => setBatchModalOpen(true)} className="bg-indigo-600 text-white animate-in fade-in zoom-in">
                            გენერირება ({selectedIds.length})
                        </Button>
                    )}
                </div>
            </div>

            {isBatchMode && (
                <div className="flex justify-end px-2">
                    <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-indigo-600 text-xs">
                        <CheckSquare className="h-3 w-3 mr-1" /> მონიშნე ბოლო ინვოისები (ყველა კონტრაქტიდან)
                    </Button>
                </div>
            )}

            <div className="space-y-8">
                {groupKeys.map(key => {
                    const group = groupedInvoices[key];
                    const isOpen = openGroups[key] !== false; // Default true

                    return (
                        <div key={key} className="space-y-3">
                            {/* Group Header */}
                            <div 
                                onClick={() => toggleGroup(key)}
                                className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors select-none group"
                            >
                                <div className={`p-1 rounded bg-slate-100 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-700 text-sm">{group.clientName} <span className="text-slate-300 mx-2">/</span> {group.performerName}</h3>
                                    <p className="text-[10px] text-slate-400 font-mono">{group.contractNumber}</p>
                                </div>
                                <div className="ml-auto">
                                    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{group.invoices.length}</span>
                                </div>
                            </div>

                            {/* Cards Grid */}
                            {isOpen && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pl-2 border-l-2 border-slate-100"
                                >
                                    {group.invoices.map((invoice) => (
                                        <ExistingInvoiceCard 
                                            key={invoice.id}
                                            invoice={invoice}
                                            onGenerateNext={generateFromExisting}
                                            onDelete={handleDeleteWrapper}
                                            isBatchMode={isBatchMode}
                                            isSelected={selectedIds.includes(invoice.id)}
                                            onToggleSelect={() => toggleSelect(invoice)}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    );
                })}
            </div>

            {groupKeys.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400">ისტორია ცარიელია</p>
                </div>
            )}

            <BatchGenerateModal 
                isOpen={batchModalOpen} 
                onClose={() => setBatchModalOpen(false)}
                selectedCount={selectedIds.length}
                onConfirm={handleBatchConfirm}
                generating={generating}
            />
        </div>
    );
};

export default ExistingInvoicesSection;