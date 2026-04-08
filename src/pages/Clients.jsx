
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Users, Phone, Mail, Edit, ArrowUpDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import ClientEditModal from '@/components/ClientEditModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Clients = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  // Create Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Edit Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState(null);

  const initialFormData = {
    name: '',
    company: '',
    company_id: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    default_currency: 'GEL',
    status: 'active',
    logo_url: '',
    custom_fields: [],
    field_visibility: {
      name: true,
      company_id: true,
      email: false,
      phone: false,
      address: false,
      city: false,
      country: false,
      postal_code: false,
      custom_fields: []
    }
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select(`
            *,
            invoices (
                id,
                amount,
                payment_status
            )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const clientsWithStats = data.map(client => {
          const totalInvoices = client.invoices?.length || 0;
          const totalAmount = client.invoices?.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0) || 0;
          const paidAmount = client.invoices?.filter(i => i.payment_status === 'paid').reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0) || 0;
          const unpaidAmount = totalAmount - paidAmount;
          return { ...client, totalInvoices, totalAmount, paidAmount, unpaidAmount };
      });

      setClients(clientsWithStats || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const sortClients = (a, b) => {
    switch(sortBy) {
        case 'name_asc':
            return (a.company || a.name || '').localeCompare(b.company || b.name || '');
        case 'amount_desc':
            return b.totalAmount - a.totalAmount;
        case 'active':
            return (a.status === 'active' === b.status === 'active') ? 0 : a.status === 'active' ? -1 : 1;
        default:
            return 0;
    }
  };

  const filteredClients = clients
    .filter(client => 
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort(sortClients);

  const handleOpenModal = () => {
    setFormData(initialFormData);
    setIsModalOpen(true);
  };
  
  const handleEditClick = (e, client) => {
    e.stopPropagation();
    setSelectedClientForEdit(client);
    setEditModalOpen(true);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `client-logo-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('client-logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: data.publicUrl }));
      toast({
        title: "წარმატება",
        description: "ლოგო აიტვირთა",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("მომხმარებელი არ არის ავტორიზებული");

      const submissionData = {
          ...formData,
          user_id: user.id,
          updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('clients')
        .insert([submissionData]);

      if (error) throw error;

      toast({
        title: "დაემატა",
        description: "ახალი კლიენტი დაემატა",
      });

      setIsModalOpen(false);
      fetchClients();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>კლიენტები - Invoiso</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 py-12 px-4 sm:px-6 lg:px-8 shadow-sm">
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Users className="h-8 w-8 text-indigo-600" />
                        კლიენტები
                    </h1>
                    <p className="mt-2 text-slate-500 text-lg">მართეთ თქვენი კლიენტების ბაზა და მათი ისტორია</p>
                </div>
                <Button
                    onClick={handleOpenModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 px-6 py-6 text-lg"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    ახალი კლიენტი
                </Button>
            </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                    placeholder="ძებნა (სახელი, კომპანია, ელ-ფოსტა)..." 
                    className="pl-12 h-12 text-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Sorting */}
                <div className="w-full md:w-64">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-12 bg-white">
                            <SelectValue placeholder="სორტირება" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name_asc">სახელი (A-Z)</SelectItem>
                            <SelectItem value="amount_desc">თანხა (მაღლიდან დაბლა)</SelectItem>
                            <SelectItem value="active">აქტიური კლიენტები</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                    {filteredClients.map((client, idx) => (
                        <motion.div
                            key={client.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ scale: 1.01, y: -5 }}
                            className="bg-white rounded-xl shadow-lg border border-slate-100 p-0 cursor-pointer hover:shadow-2xl hover:border-indigo-100 transition-all duration-300 group overflow-hidden flex flex-col h-full"
                            onClick={() => navigate(`/clients/${client.id}`)}
                        >
                            <div className="p-6 flex-1 bg-gradient-to-b from-white to-slate-50/30">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {client.logo_url ? (
                                            <img src={client.logo_url} alt="ლოგო" className="h-12 w-12 rounded-lg object-cover border border-slate-100 shadow-sm group-hover:shadow-md transition-all" />
                                        ) : (
                                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                                {(client.company || client.name || 'C').charAt(0)}
                                            </div>
                                        )}
                                        {/* Edit Button - Only if no invoices */}
                                        {client.totalInvoices === 0 && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={(e) => handleEditClick(e, client)} 
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                                                title="რედაქტირება"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                        client.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                                    }`}>
                                        {client.status === 'active' ? 'აქტიური' : 'არააქტიური'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                    {client.company || client.name}
                                </h3>
                                <p className="text-slate-500 text-sm mb-4 line-clamp-1">{client.name}</p>

                                <div className="space-y-1.5 mb-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="truncate">{client.email}</span>
                                    </div>
                                    {client.phone && (
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                                            <span>{client.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Stats Footer */}
                            <div className="bg-slate-50 p-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">გადახდილი</p>
                                    <p className="text-sm font-bold text-green-600">{client.paidAmount.toLocaleString()} ₾</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-slate-400 font-bold">გადასახდელი</p>
                                    <p className="text-sm font-bold text-red-500">{client.unpaidAmount.toLocaleString()} ₾</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredClients.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">კლიენტები არ მოიძებნა</h3>
                    <p className="text-slate-500 mt-2">სცადეთ შეცვალოთ საძიებო სიტყვა ან დაამატეთ ახალი კლიენტი</p>
                </div>
            )}
        </div>

        {/* Create Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-white max-h-[90vh] overflow-y-auto w-full max-w-3xl">
            <DialogHeader>
              <DialogTitle>ახალი კლიენტი</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 p-1">
                 <div><Label htmlFor="name">სახელი*</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="საკონტაქტო პირი" /></div>
                <div><Label htmlFor="company">კომპანიის სახელი*</Label><Input id="company" name="company" value={formData.company} onChange={handleChange} required placeholder="შპს მაგალითი" /></div>
                <div><Label htmlFor="company_id">კომპანიის ს/ნ</Label><Input id="company_id" name="company_id" value={formData.company_id} onChange={handleChange} placeholder="123456789" /></div>
                <div><Label htmlFor="email">ელ-ფოსტა*</Label><Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="contact@example.com" /></div>
                <div><Label htmlFor="phone">ტელეფონი</Label><Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+995 555 00 00 00" /></div>
                <div><Label htmlFor="address">მისამართი</Label><Input id="address" name="address" value={formData.address} onChange={handleChange} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="city">ქალაქი</Label><Input id="city" name="city" value={formData.city} onChange={handleChange} /></div>
                    <div><Label htmlFor="country">ქვეყანა</Label><Input id="country" name="country" value={formData.country} onChange={handleChange} /></div>
                </div>
                 <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                    {formData.logo_url && <img src={formData.logo_url} alt="ლოგო" className="h-12 w-12 rounded-full object-cover"/>}
                    <div className="flex-1">
                        <Label>კომპანიის ლოგო</Label>
                        <Input type="file" onChange={handleFileUpload} disabled={uploading} className="mt-1" />
                    </div>
                    {uploading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>}
                </div>
                 <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>გაუქმება</Button>
                    <Button type="submit" disabled={uploading} className="bg-indigo-600 hover:bg-indigo-700">დამატება</Button>
                </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <ClientEditModal 
            isOpen={editModalOpen} 
            onClose={() => setEditModalOpen(false)} 
            client={selectedClientForEdit} 
            onUpdate={fetchClients} 
        />
      </div>
    </>
  );
};

export default Clients;
