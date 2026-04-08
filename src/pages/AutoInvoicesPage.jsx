import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Zap, PenTool, History, Settings, Layers, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { useAutoInvoices } from '@/hooks/useAutoInvoices';
import { useExistingInvoices } from '@/hooks/useExistingInvoices';
import ContractAutoGenerationSection from '@/components/ContractAutoGenerationSection';
import GeneratedInvoicesSection from '@/components/GeneratedInvoicesSection';
import ExistingInvoicesSection from '@/components/ExistingInvoicesSection';
import PreviousMonthInvoicesSection from '@/components/PreviousMonthInvoicesSection';
import QuickWriteModal from '@/components/QuickWriteModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AutoInvoicesPage = () => {
  // Hooks for Pending/Auto Logic
  const { 
      loading: autoLoading, 
      contracts, 
      invoices: generatedInvoices, 
      fetchContracts, 
      fetchGeneratedInvoices, 
      generateInvoice, 
      transferInvoice,
      deleteInvoice: deleteGenerated,
      replaceInvoice,
      toggleAutoGeneration
  } = useAutoInvoices();

  // Hooks for History/Existing Logic
  const {
      loading: existingLoading,
      groupedInvoices,
      fetchExistingInvoices,
      deleteInvoice: deleteExisting
  } = useExistingInvoices();

  const [quickWriteOpen, setQuickWriteOpen] = useState(false);

  useEffect(() => {
      refreshAll();
  }, []);

  const refreshAll = () => {
      fetchContracts();
      fetchGeneratedInvoices();
      fetchExistingInvoices();
  };

  return (
    <>
      <Helmet><title>აუტო ინვოისები - Invoiso</title></Helmet>
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navbar />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 rounded-xl shadow-sm">
                            <Zap className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">აუტო ინვოისები</h1>
                            <p className="text-slate-500 text-lg">მართეთ გენერაცია და ისტორია</p>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={() => setQuickWriteOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 h-12 px-6 rounded-xl"
                    >
                        <PenTool className="h-5 w-5 mr-2" /> სწრაფი წერა
                    </Button>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="contracts" className="space-y-8">
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 inline-flex flex-wrap">
                        <TabsTrigger value="contracts" className="px-4 py-2 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 flex items-center gap-2">
                             <Settings className="h-4 w-4" /> კონტრაქტები
                        </TabsTrigger>
                        <TabsTrigger value="previous" className="px-4 py-2 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 flex items-center gap-2">
                             <History className="h-4 w-4" /> წინა თვე
                        </TabsTrigger>
                        <TabsTrigger value="generated" className="px-4 py-2 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 flex items-center gap-2">
                             <Clock className="h-4 w-4" /> გენერირებული <span className="ml-1 bg-yellow-100 text-yellow-700 px-1.5 rounded-full text-[10px]">{generatedInvoices.filter(i=>i.status==='პენდინგი').length}</span>
                        </TabsTrigger>
                        <TabsTrigger value="existing" className="px-4 py-2 rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 flex items-center gap-2">
                             <Layers className="h-4 w-4" /> ყველა (ისტორია)
                        </TabsTrigger>
                    </div>

                    <TabsContent value="contracts" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <ContractAutoGenerationSection 
                            contracts={contracts} 
                            onToggleAuto={toggleAutoGeneration}
                            onManualGenerate={(data) => {
                                generateInvoice(data);
                                setTimeout(refreshAll, 500); 
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="previous" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <PreviousMonthInvoicesSection />
                    </TabsContent>

                    <TabsContent value="generated" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <GeneratedInvoicesSection 
                            invoices={generatedInvoices}
                            onDelete={deleteGenerated}
                            onTransfer={async (inv, date) => {
                                await transferInvoice(inv, date);
                                refreshAll();
                            }}
                            onReplace={async (id, data) => {
                                await replaceInvoice(id, data);
                                refreshAll();
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="existing" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ExistingInvoicesSection 
                            groupedInvoices={groupedInvoices}
                            loading={existingLoading}
                            refreshData={refreshAll}
                            onDelete={deleteExisting}
                        />
                    </TabsContent>
                </Tabs>

            </motion.div>
        </div>

        <QuickWriteModal 
            isOpen={quickWriteOpen} 
            onClose={() => setQuickWriteOpen(false)}
            onSuccess={() => {
                setQuickWriteOpen(false);
                refreshAll();
            }}
        />
      </div>
    </>
  );
};

export default AutoInvoicesPage;