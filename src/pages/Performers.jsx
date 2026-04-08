import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Building2, Phone, Mail, Edit, Trash2, Eye, Upload } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import PerformerForm from '@/components/PerformerForm';

const Performers = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerformer, setEditingPerformer] = useState(null);

  useEffect(() => {
    fetchPerformers();
  }, []);

  const fetchPerformers = async () => {
    setLoading(true);
    try {
      // Note: Supabase aggregation (contracts(count)) works if foreign keys set up correctly.
      // If not, we might need a separate query or RPC. Assuming simple relation for now.
      const { data, error } = await supabase
        .from('performers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPerformers(data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("ნამდვილად გსურთ წაშლა?")) return;
    try {
      const { error } = await supabase.from('performers').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "წაიშალა", description: "შემსრულებელი წაიშალა" });
      fetchPerformers();
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: error.message });
    }
  };

  const handleEdit = (performer, e) => {
    e.stopPropagation();
    setEditingPerformer(performer);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingPerformer(null);
    setIsFormOpen(true);
  };

  return (
    <>
      <Helmet><title>შემსრულებლები - Invoiso</title></Helmet>
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navbar />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-indigo-600" />
                  შემსრულებლები
                </h1>
                <p className="text-slate-500 mt-1 text-lg">თქვენი კომპანიები და რეკვიზიტები</p>
              </div>
              <Button 
                onClick={handleCreate} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 h-12 px-6"
              >
                <Plus className="h-5 w-5 mr-2" /> ახალი შემსრულებელი
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {performers.map((performer, idx) => (
                  <motion.div
                    key={performer.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => navigate(`/performers/${performer.id}`)}
                    className="bg-white rounded-xl shadow-lg border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer p-6 flex flex-col group"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center border border-indigo-100 overflow-hidden">
                        {performer.logo_url ? (
                          <img src={performer.logo_url} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Building2 className="h-8 w-8 text-indigo-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 line-clamp-1">{performer.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{performer.city || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{performer.email || '-'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{performer.phone || '-'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                       <Button variant="ghost" size="sm" className="text-indigo-600 font-medium p-0 hover:bg-transparent">
                          დეტალები <Eye className="h-4 w-4 ml-1" />
                       </Button>
                       <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={(e) => handleEdit(performer, e)} className="h-8 w-8 text-slate-400 hover:text-blue-600">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => handleDelete(performer.id, e)} className="h-8 w-8 text-slate-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {performers.length === 0 && !loading && (
               <div className="text-center py-20">
                  <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-700">შემსრულებლები არ არის</h3>
               </div>
            )}
          </motion.div>
        </div>
        
        <PerformerForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          performerToEdit={editingPerformer} 
          onSuccess={fetchPerformers} 
        />
      </div>
    </>
  );
};

export default Performers;