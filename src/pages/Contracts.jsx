
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileSignature, Download, Edit, Trash2, Calendar, DollarSign, Building } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import ContractForm from '@/components/ContractForm';
import { downloadContractPDF } from '@/utils/pdfUtils';

const Contracts = () => {
  const { toast } = useToast();
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

  return (
    <>
      <Helmet><title>კონტრაქტები - Invoiso</title></Helmet>
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navbar />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <FileSignature className="h-8 w-8 text-indigo-600" />
                  კონტრაქტები
                </h1>
                <p className="text-slate-500 mt-1 text-lg">მართეთ ხელშეკრულებები</p>
              </div>
              <Button 
                onClick={handleCreate} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 h-12 px-6"
              >
                <Plus className="h-5 w-5 mr-2" /> ახალი კონტრაქტი
              </Button>
            </div>

            {loading ? (
               <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {contracts.map((contract, index) => (
                  <motion.div
                    key={contract.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-300 p-6 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-indigo-50 text-indigo-700 font-mono font-bold px-3 py-1 rounded-lg text-sm">
                        {contract.contract_number}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                        contract.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {contract.status}
                      </span>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <Building className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">დამკვეთი</p>
                          <p className="font-bold text-slate-900 line-clamp-1">{contract.clients?.company || contract.clients?.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 mb-6 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mb-1"><Calendar className="h-3 w-3" /> ვადა</p>
                        <p className="text-sm font-semibold text-slate-700">{contract.start_date}</p>
                        <p className="text-sm font-semibold text-slate-700">{contract.end_date}</p>
                      </div>
                      <div>
                         <p className="text-xs text-slate-400 flex items-center gap-1 mb-1"><DollarSign className="h-3 w-3" /> ღირებულება</p>
                         <p className="text-lg font-black text-indigo-600">{parseFloat(contract.amount).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <Button variant="ghost" size="sm" onClick={() => downloadContractPDF(contract, contract.clients?.company)} className="text-slate-500 hover:text-indigo-600">
                        <Download className="h-4 w-4 mr-2" /> PDF
                      </Button>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(contract)} className="text-slate-400 hover:text-blue-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(contract.id)} className="text-slate-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            )}
            
            {contracts.length === 0 && !loading && (
              <div className="text-center py-20">
                <FileSignature className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700">კონტრაქტები არ მოიძებნა</h3>
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
