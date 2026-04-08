
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Plus, Search, Filter, MoreHorizontal, Calendar, 
  CheckCircle, Clock, Trash2, Edit, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOneTimeInvoices } from '@/hooks/useOneTimeInvoices';
import OneTimeInvoiceForm from '@/components/OneTimeInvoiceForm';
import { formatDateDDMMYYYY } from '@/utils/formatDate';
import { useToast } from '@/components/ui/use-toast';

const OneTimeInvoices = () => {
  const navigate = useNavigate();
  const { fetchOneTimeInvoices, deleteOneTimeInvoice, markAsPaid, loading } = useOneTimeInvoices();
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    const data = await fetchOneTimeInvoices();
    setInvoices(data || []);
  };

  const handleDelete = async (id) => {
    if (window.confirm('ნამდვილად გსურთ წაშლა?')) {
      await deleteOneTimeInvoice(id);
      loadInvoices();
    }
  };

  const handleMarkAsPaid = async (id, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? false : true;
    await markAsPaid(id, newStatus);
    loadInvoices();
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.clients?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.performers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.service_description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Helmet>
        <title>ერთჯერადი ინვოისები - Invoiso</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navbar />
        
        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 pb-24 pt-12 px-4 sm:px-6 lg:px-8 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Zap className="h-6 w-6 text-yellow-300" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">ერთჯერადი ინვოისები</h1>
              </div>
              <p className="text-purple-100 text-lg">მართეთ არასტანდარტული და დამატებითი მომსახურების ინვოისები</p>
            </div>
            <Button 
              onClick={() => {
                setEditingInvoice(null);
                setIsFormOpen(true);
              }} 
              className="bg-white text-violet-600 hover:bg-purple-50 hover:text-violet-700 shadow-xl border-0 font-semibold px-6 py-6 text-base transition-all transform hover:-translate-y-1"
            >
              <Plus className="h-5 w-5 mr-2" />
              ახალი ინვოისი
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="ძებნა (კლიენტი, შემსრულებელი, აღწერა)..." 
                  className="pl-10 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-slate-200">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <SelectValue placeholder="სტატუსი" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ყველა სტატუსი</SelectItem>
                  <SelectItem value="paid">გადახდილი</SelectItem>
                  <SelectItem value="unpaid">გადასახდელი</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
            {loading && invoices.length === 0 ? (
               <div className="flex items-center justify-center h-64">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
               </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">ინვოისები არ მოიძებნა</h3>
                <p className="text-slate-500 mt-1 max-w-sm">
                  მითითებული ფილტრებით ერთჯერადი ინვოისები ვერ მოიძებნა.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">კლიენტი</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">შემსრულებელი</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">პერიოდი</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">თანხა</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">სტატუსი</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">მოქმედება</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    <AnimatePresence>
                      {filteredInvoices.map((invoice) => (
                        <motion.tr 
                          key={invoice.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/one-time-invoices/${invoice.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {invoice.clients?.logo_url ? (
                                <img src={invoice.clients.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold">
                                  {(invoice.clients?.company || invoice.clients?.name)?.[0] || 'C'}
                                </div>
                              )}
                              <span className="font-medium text-slate-900">{invoice.clients?.company || invoice.clients?.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {invoice.performers ? (
                              <div className="flex items-center gap-2">
                                {invoice.performers.logo_url ? (
                                  <img src={invoice.performers.logo_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                    <User className="h-3 w-3" />
                                  </div>
                                )}
                                <span className="text-sm text-slate-700">{invoice.performers.name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDateDDMMYYYY(invoice.service_period_start)} - {formatDateDDMMYYYY(invoice.service_period_end)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{parseFloat(invoice.calculated_amount).toLocaleString()} ₾</p>
                              {parseFloat(invoice.calculated_amount) !== parseFloat(invoice.full_amount) && (
                                <p className="text-xs text-slate-400 line-through">{parseFloat(invoice.full_amount).toLocaleString()} ₾</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              invoice.status === 'paid' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {invoice.status === 'paid' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              {invoice.status === 'paid' ? 'გადახდილი' : 'გადასახდელი'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setEditingInvoice(invoice);
                                  setIsFormOpen(true);
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  რედაქტირება
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id, invoice.status)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {invoice.status === 'paid' ? 'გადასახდელად მონიშვნა' : 'გადახდილად მონიშვნა'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(invoice.id)}
                                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  წაშლა
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <OneTimeInvoiceForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)}
          invoiceToEdit={editingInvoice}
          onSuccess={loadInvoices}
        />
      </div>
    </>
  );
};

export default OneTimeInvoices;
