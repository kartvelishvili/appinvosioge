
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Calendar, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { generateInvoiceId } from '@/utils/invoiceUtils';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState(false);
  
  const [formData, setFormData] = useState({
    client_id: '',
    performer_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_rate: 18,
    notes: '',
    is_draft: false,
    payment_terms: '',
  });

  const [items, setItems] = useState([
    { description: '', service_description: '', quantity: 1, unit_price: 0, line_total: 0 }
  ]);

  useEffect(() => {
    fetchData();
    handleGenerateId();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, performersRes] = await Promise.all([
        supabase.from('clients').select('*').eq('status', 'active').order('company'),
        supabase.from('performers').select('*').order('name')
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (performersRes.error) throw performersRes.error;

      setClients(clientsRes.data || []);
      setPerformers(performersRes.data || []);
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: error.message });
    }
  };

  const handleGenerateId = async () => {
    setGeneratingId(true);
    try {
      const newId = await generateInvoiceId();
      setFormData(prev => ({ ...prev, invoice_number: newId }));
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: "ინვოისის ნომრის გენერაცია ვერ მოხერხდა" });
    } finally {
      setGeneratingId(false);
    }
  };
  
  const handleInvoiceNumberChange = (value) => {
     let cleanValue = value.replace(/^IN#/, '').replace(/[^0-9]/g, '');
     if (cleanValue.length > 7) cleanValue = cleanValue.slice(0, 7);
     setFormData(prev => ({ ...prev, invoice_number: `IN#${cleanValue}` }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'quantity' || field === 'unit_price') {
       const quantity = parseFloat(newItems[index].quantity) || 0;
       const unitPrice = parseFloat(newItems[index].unit_price) || 0;
       newItems[index].line_total = quantity * unitPrice;
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: '', service_description: '', quantity: 1, unit_price: 0, line_total: 0 }]);
  const removeItem = (index) => items.length > 1 ? setItems(items.filter((_, i) => i !== index)) : toast({variant: "destructive", title: "შეცდომა", description: "მინიმუმ ერთი სერვისი უნდა იყოს დამატებული."});

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.line_total) || 0), 0);
    const tax_amount = subtotal * (parseFloat(formData.tax_rate) / 100);
    const total = subtotal + tax_amount;
    return { subtotal, tax_amount, total };
  };
  
  const totals = calculateTotals();

  const validateForm = async () => {
    if (!formData.client_id || !formData.performer_id) { toast({variant: "destructive", title: "შეცდომა", description: "აირჩიეთ კლიენტი და შემსრულებელი."}); return false; }
    if (!/^IN#\d{7}$/.test(formData.invoice_number)) { toast({variant: "destructive", title: "შეცდომა", description: "არასწორი ინვოისის ნომერი."}); return false; }
    if (!formData.invoice_date || !formData.due_date) { toast({variant: "destructive", title: "შეცდომა", description: "მიუთითეთ თარიღები."}); return false; }
    for(const item of items) {
        if (!item.description.trim()) { toast({variant: "destructive", title: "შეცდომა", description: "შეავსეთ სერვისის ძირითადი დასახელება."}); return false; }
        if (item.quantity <= 0 || item.unit_price < 0) { toast({variant: "destructive", title: "შეცდომა", description: "რაოდენობა და ფასი უნდა იყოს დადებითი."}); return false; }
    }
    return true;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(await validateForm())) return;
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("მომხმარებელი არ არის ავტორიზებული");

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          ...formData,
          user_id: user.id,
          subtotal: totals.subtotal,
          tax_amount: totals.tax_amount,
          total: totals.total,
          amount: totals.total, // Keep for backward compatibility where amount is required
          line_items_count: items.length,
          status: formData.is_draft ? 'draft' : 'pending',
          payment_status: 'unpaid',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;
      
      const invoiceItems = items.map(item => ({ 
          invoice_id: invoice.id, 
          description: item.description, 
          service_description: item.service_description,
          quantity: item.quantity, 
          unit_price: item.unit_price, 
          line_total: item.line_total,
          amount: item.line_total
      }));
      const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems);
      if (itemsError) throw itemsError;

      toast({ title: "ინვოისი შეიქმნა", description: "ინვოისი წარმატებით შეიქმნა." });
      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const displayInvoiceNumber = formData.invoice_number.replace(/^IN#/, '');

  return (
    <>
      <Helmet><title>ინვოისის შექმნა - Invoiso</title></Helmet>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-8">
              <Button onClick={() => navigate('/invoices')} variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" /> უკან</Button>
              <h1 className="text-3xl font-bold text-slate-900">ინვოისის შექმნა</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-bold text-slate-900">ინვოისის დეტალები</h2>
                    <div className="flex items-center gap-2">
                        <Switch id="draft_toggle" checked={formData.is_draft} onCheckedChange={(c) => setFormData({...formData, is_draft: c})} />
                        <Label htmlFor="draft_toggle" className="text-slate-600 font-bold cursor-pointer">შენახვა დრაფტად</Label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>შემსრულებელი (თქვენ)</Label>
                    <select value={formData.performer_id} onChange={(e) => setFormData({...formData, performer_id: e.target.value})} required className="w-full mt-1.5 px-3 py-2.5 bg-white border border-slate-200 rounded-lg">
                      <option value="">აირჩიეთ...</option>
                      {performers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>დამკვეთი (კლიენტი)</Label>
                    <select value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value})} required className="w-full mt-1.5 px-3 py-2.5 bg-white border border-slate-200 rounded-lg">
                      <option value="">აირჩიეთ...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <Label>ინვოისი ID</Label>
                    <div className="flex gap-2 mt-1.5 items-center">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold select-none">IN#</span>
                        <Input value={displayInvoiceNumber} onChange={(e) => handleInvoiceNumberChange(e.target.value)} required className="font-mono text-indigo-700 font-bold pl-12" maxLength={7}/>
                      </div>
                      <Button type="button" variant="outline" size="icon" onClick={handleGenerateId} disabled={generatingId}><RefreshCw className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div>
                    <Label>გადასახადის % (Tax Rate)</Label>
                    <Input type="number" value={formData.tax_rate} onChange={(e) => setFormData({...formData, tax_rate: e.target.value})} className="mt-1.5" />
                  </div>
                </div>

                <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-sm font-semibold text-slate-900">თარიღები</h3>
                    </div>
                    <div>
                        <Label className="text-xs text-slate-500">გამოცემის თარიღი*</Label>
                        <Input type="date" required value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} className="mt-1 h-9 bg-white"/>
                    </div>
                    <div>
                        <Label className="text-xs text-slate-500">გადახდის ვადა*</Label>
                        <Input type="date" required value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="mt-1 h-9 bg-white"/>
                    </div>
                </div>
              </div>
              
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">სერვისები/პროდუქტები</h2>
                    <div className="space-y-4">
                    {items.map((item, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                            <div className="md:col-span-6 space-y-3">
                                <div>
                                    <Label className="text-xs font-semibold text-slate-700 mb-1 block">დასახელება</Label>
                                    <Input value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required placeholder="მომსახურების დასახელება" className="bg-white"/>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold text-slate-500 mb-1 block">სერვისის ახსნა (არასავალდებულო)</Label>
                                    <Input value={item.service_description || ''} onChange={(e) => handleItemChange(index, 'service_description', e.target.value)} placeholder="დეტალები..." className="bg-white text-sm text-slate-600"/>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <Label className="text-xs font-semibold text-slate-700 mb-1 block">რაოდ.</Label>
                                <Input type="number" step="0.01" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} required className="bg-white"/>
                            </div>
                            <div className="md:col-span-2">
                                <Label className="text-xs font-semibold text-slate-700 mb-1 block">ერთ. ფასი </Label>
                                <Input type="number" step="0.01" value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} required className="bg-white"/>
                            </div>
                            <div className="md:col-span-2 flex flex-col justify-between h-full">
                                <div>
                                    <Label className="text-xs font-semibold text-slate-700 mb-1 block">სულ</Label>
                                    <div className="px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-mono font-medium text-slate-800 h-10 flex items-center">
                                        {parseFloat(item.line_total).toFixed(2)}
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2">
                                    <Button type="button" onClick={() => removeItem(index)} variant="ghost" size="icon" className="text-red-400 hover:text-red-600 h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                    <Button type="button" onClick={addItem} variant="outline" size="sm" className="mt-4"><Plus className="h-4 w-4 mr-2" />დაამატე მომსახურება</Button>
                </motion.div>

              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 font-sans">
                  <div className="mb-4 pb-4 border-b border-slate-100">
                      <Label>შენიშვნები (Notes)</Label>
                      <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="mt-2" placeholder="დამატებითი ინფორმაცია..." />
                  </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-slate-700">ქვეჯამი:</span><span className="font-medium font-mono">{totals.subtotal.toFixed(2)} ₾</span></div>
                  {formData.tax_rate > 0 && <div className="flex justify-between items-center"><span className="text-slate-700">დღგ ({formData.tax_rate}%):</span><span className="font-medium font-mono">{totals.tax_amount.toFixed(2)} ₾</span></div>}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200"><span className="text-lg font-bold text-slate-900">სულ გადასახდელი:</span><span className="text-2xl font-bold text-indigo-700 font-mono">{totals.total.toFixed(2)} ₾</span></div>
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-4 pb-12">
                <Button type="button" variant="outline" onClick={() => navigate('/invoices')} className="h-12 px-6">გაუქმება</Button>
                <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8">{loading ? 'იქმნება...' : 'ინვოისის შექმნა'}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default CreateInvoice;
