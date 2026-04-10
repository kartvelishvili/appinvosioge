
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileSignature, Download, Edit, Trash2, Calendar, DollarSign, Building, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import ContractForm from '@/components/ContractForm';
import { downloadContractPDF } from '@/utils/pdfUtils';

const statusLabels = {
  draft: { text: 'დრაფტი', cls: 'bg-slate-100 text-slate-600' },
  active: { text: 'აქტიური', cls: 'bg-green-100 text-green-700' },
  signed: { text: 'ხელმოწერილი', cls: 'bg-blue-100 text-blue-700' },
  terminated: { text: 'შეწყვეტილი', cls: 'bg-red-100 text-red-700' },
};

const parseContractMeta = (description) => {
  try {
    return JSON.parse(description || '{}');
  } catch {
    return { terms: description || '' };
  }
};

const Contracts = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, clients(company, name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("ნამდვილად გსურთ წაშლა?")) return;
    try {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "წაიშალა", description: "კონტრაქტი წარმატებით წაიშალა" });
      fetchContracts();
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: error.message });
    }
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingContract(null);
    setIsFormOpen(true);
  };

  const activeCount = contracts.filter(c => c.status === 'active' || c.status === 'signed').length;
  const totalMonthly = contracts.filter(c => c.status === 'active' || c.status === 'signed').reduce((s, c) => s + parseFloat(c.amount || 0), 0);

  return (
    <>
      <Helmet><title>კონტრაქტები - Invoiso</title></Helmet>
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navbar />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <FileSignature className="h-8 w-8 text-indigo-600" />
                  კონტრაქტები
                </h1>
                <p className="text-slate-500 mt-1">მართეთ ხელშეკრულებები კლიენტებთან</p>
              </div>
              <Button 
                onClick={handleCreate} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 h-12 px-6"
              >
                <Plus className="h-5 w-5 mr-2" /> ახალი კონტრაქტი
              </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">სულ კონტრაქტები</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{contracts.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">აქტიური</p>
                <p className="text-2xl font-black text-green-600 mt-1">{activeCount}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">ყოველთვიური შემოსავალი</p>
                <p className="text-2xl font-black text-indigo-600 mt-1">{totalMonthly.toLocaleString()} ₾</p>
              </div>
            </div>

            {loading ? (
               <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <FileSignature className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700 mb-2">კონტრაქტები არ მოიძებნა</h3>
                <p className="text-slate-400 mb-4">შექმენით პირველი კონტრაქტი</p>
                <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" /> ახალი კონტრაქტი
                </Button>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {contracts.map((contract, index) => {
                  const meta = parseContractMeta(contract.description);
                  const statusInfo = statusLabels[contract.status] || statusLabels.draft;
                  const clientName = contract.clients?.company || contract.clients?.name || 'უცნობი';
                  
                  return (
                    <motion.div
                      key={contract.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 overflow-hidden group"
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-indigo-50 text-indigo-700 font-mono font-bold px-3 py-1 rounded-lg text-sm">
                            {contract.contract_number}
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.cls}`}>
                            {statusInfo.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                            {clientName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{clientName}</p>
                            {meta.service_type && <p className="text-xs text-slate-400">{meta.service_type}</p>}
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">ვადა</p>
                            <p className="text-xs font-mono text-slate-700">{contract.start_date}</p>
                            {contract.end_date && <p className="text-xs font-mono text-slate-500">— {contract.end_date}</p>}
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">ყოველთვიური</p>
                            <p className="text-lg font-black text-indigo-600">{parseFloat(contract.amount || 0).toLocaleString()} <span className="text-xs">{meta.currency || '₾'}</span></p>
                          </div>
                        </div>

                        {meta.auto_generate && (
                          <div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg mb-4">
                            <RefreshCw className="h-3 w-3" />
                            <span className="font-medium">ავტო-გენერაცია ჩართულია</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-100">
                        <Button variant="ghost" size="sm" onClick={() => downloadContractPDF(contract, clientName)} className="text-slate-500 hover:text-indigo-600 h-8 px-2">
                          <Download className="h-3.5 w-3.5 mr-1.5" /> PDF
                        </Button>
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(contract)} className="text-slate-400 hover:text-blue-600 h-8 w-8">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(contract.id)} className="text-slate-400 hover:text-red-600 h-8 w-8">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            )}
          </motion.div>
        </div>

        <ContractForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          contractToEdit={editingContract} 
          onSuccess={fetchContracts} 
        />
      </div>
    </>
  );
};

export default Contracts;
