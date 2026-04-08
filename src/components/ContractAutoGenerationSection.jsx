import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Settings, RefreshCw, Calendar, CheckCircle } from 'lucide-react';
import ManualGenerateInvoiceModal from './ManualGenerateInvoiceModal';

const ContractAutoGenerationSection = ({ contracts, onToggleAuto, onManualGenerate }) => {
    const [selectedContract, setSelectedContract] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleManualClick = (contract) => {
        setSelectedContract(contract);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-600" />
                კონტრაქტების მართვა
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {contracts.map((contract) => (
                    <motion.div 
                        key={contract.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white rounded-xl shadow-lg border p-6 transition-all ${contract.auto_generation_enabled ? 'border-green-200 shadow-green-50' : 'border-slate-100'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-slate-900">{contract.clients?.company_name}</h3>
                                <p className="text-xs text-slate-500 font-mono mt-1">{contract.contract_number}</p>
                            </div>
                            <Switch 
                                checked={contract.auto_generation_enabled} 
                                onCheckedChange={(checked) => onToggleAuto(contract.id, checked)}
                            />
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">თანხა:</span>
                                <span className="font-bold text-slate-900">{contract.monthly_fee} {contract.currency}</span>
                            </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-slate-500">ვადა:</span>
                                <span className="font-medium text-slate-700">{contract.end_date || 'უვადო'}</span>
                            </div>
                            <div className="flex justify-between text-sm bg-slate-50 p-2 rounded">
                                <span className="text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3"/> შემდეგი გენერაცია:</span>
                                <span className="font-bold text-indigo-600">
                                    {contract.auto_generation_enabled ? '01/XX/XXXX' : 'გამორთულია'}
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            {!contract.auto_generation_enabled && (
                                <Button size="sm" variant="outline" onClick={() => handleManualClick(contract)} className="text-indigo-600 border-indigo-100 hover:bg-indigo-50">
                                    <RefreshCw className="h-3 w-3 mr-2" /> ხელით გენერაცია
                                </Button>
                            )}
                            {contract.auto_generation_enabled && (
                                <div className="text-xs text-green-600 font-bold flex items-center gap-1 px-3 py-2 bg-green-50 rounded-lg ml-auto">
                                    <CheckCircle className="h-3 w-3" /> ავტომატური
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            <ManualGenerateInvoiceModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                contract={selectedContract} 
                onSubmit={onManualGenerate} 
            />
        </div>
    );
};

export default ContractAutoGenerationSection;