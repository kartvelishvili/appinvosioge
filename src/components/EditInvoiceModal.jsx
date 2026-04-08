
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const EditInvoiceModal = ({ isOpen, onClose, invoice, onSave }) => {
    const { toast } = useToast();
    const [clients, setClients] = useState([]);
    const [performers, setPerformers] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({});
    const [items, setItems] = useState([]);

    const isPaid = invoice?.payment_status === 'paid';

    useEffect(() => {
        if (isOpen) fetchInitialData();
    }, [isOpen]);

    const fetchInitialData = async () => {
        if (!invoice) return;
        setLoading(true);
        try {
            const [clientsRes, performersRes, itemsRes] = await Promise.all([
                supabase.from('clients').select('*').eq('status', 'active'),
                supabase.from('performers').select('*'),
                supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id)
            ]);

            setClients(clientsRes.data || []);
            setPerformers(performersRes.data || []);
            setItems(itemsRes.data || []);
            
            setFormData({
                ...invoice,
                due_date: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '',
                invoice_date: invoice.invoice_date ? new Date(invoice.invoice_date).toISOString().split('T')[0] : '',
                tax_rate: invoice.tax_rate || 0,
                notes: invoice.notes || '',
            });
        } catch (error) {
            toast({ variant: "destructive", title: "შეცდომა", description: "მონაცემების ჩატვირთვა ვერ მოხერხდა" });
        } finally {
            setLoading(false);
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
        const quantity = parseFloat(newItems[index].quantity) || 0;
        const unitPrice = parseFloat(newItems[index].unit_price) || 0;
        newItems[index].line_total = quantity * unitPrice;
        newItems[index].amount = quantity * unitPrice;
        setItems(newItems);
    };

    const addItem = () => setItems([...items, { invoice_id: invoice.id, description: '', quantity: 1, unit_price: 0, line_total: 0, amount: 0 }]);

    const removeItem = (index) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== index));
        else toast({ variant: "destructive", title: "შეცდომა", description: "მინიმუმ ერთი სერვისი აუცილებელია" });
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.line_total) || 0), 0);
        const tax_amount = subtotal * (parseFloat(formData.tax_rate || 0) / 100);
        const total = subtotal + tax_amount;
        return { subtotal, tax_amount, total };
    };

    const validate = async () => {
        if (!isPaid) {
            const idRegex = /^IN#\d{7}$/;
            if (!idRegex.test(formData.invoice_number)) {
                toast({variant: "destructive", title: "შეცდომა", description: "ინვოისის ნომერი არასწორია. ფორმატი: IN# + 7 ციფრი."});
                return false;
            }
            if (formData.invoice_number !== invoice.invoice_number) {
                 const { data } = await supabase.from('invoices').select('id').eq('invoice_number', formData.invoice_number).maybeSingle();
                 if (data) {
                    toast({variant: "destructive", title: "შეცდომა", description: "ინვოისის ნომერი უკვე არსებობს."});
                    return false;
                 }
            }
            for(const item of items) {
                if(!item.description) {
                    toast({ variant: "destructive", title: "ვალიდაციის შეცდომა", description: "სერვისის აღწერა აუცილებელია" });
                    return false;
                }
                if(parseFloat(item.quantity) <= 0 || parseFloat(item.unit_price) < 0) {
                    toast({ variant: "destructive", title: "ვალიდაციის შეცდომა", description: "რაოდენობა და ფასი უნდა იყოს დადებითი რიცხვი" });
                    return false;
                }
            }
        }
        return true;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isValid = await validate();
        if (!isValid) return;
        setLoading(true);

        const { subtotal, tax_amount, total } = calculateTotals();

        try {
            const updatePayload = {
                due_date: formData.due_date,
                invoice_date: formData.invoice_date,
                updated_at: new Date().toISOString(),
                notes: formData.notes
            };

            if (!isPaid) {
                updatePayload.client_id = formData.client_id;
                updatePayload.performer_id = formData.performer_id;
                updatePayload.invoice_number = formData.invoice_number;
                updatePayload.tax_rate = formData.tax_rate;
                updatePayload.subtotal = subtotal;
                updatePayload.tax_amount = tax_amount;
                updatePayload.total = total;
                updatePayload.amount = total;
                updatePayload.line_items_count = items.length;
            }

            const { error: invoiceError } = await supabase.from('invoices').update(updatePayload).eq('id', invoice.id);
            if (invoiceError) throw invoiceError;

            if (!isPaid) {
                await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);
                if (items.length > 0) {
                    const newItemsData = items.map(item => ({ 
                        invoice_id: invoice.id, 
                        description: item.description, 
                        quantity: item.quantity, 
                        unit_price: item.unit_price, 
                        line_total: item.line_total,
                        amount: item.line_total
                    }));
                    const { error: itemsError } = await supabase.from('invoice_items').insert(newItemsData);
                    if (itemsError) throw itemsError;
                }
            }

            toast({ title: "განახლდა", description: "ინვოისი წარმატებით განახლდა" });
            onSave();
            onClose();
        } catch (error) {
            toast({ variant: "destructive", title: "შეცდომა", description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    if (!isOpen || !invoice) return null;
    
    const { subtotal, tax_amount, total } = calculateTotals();
    const displayInvoiceNumber = formData.invoice_number ? formData.invoice_number.replace(/^IN#/, '') : '';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        რედაქტირება: {invoice.invoice_number}
                        {isPaid && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">გადახდილია - შეზღუდული რედაქტირება</span>}
                    </DialogTitle>
                </DialogHeader>
                {loading ? <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div> :
                <form onSubmit={handleSubmit} className="space-y-6">
                    {isPaid && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center gap-3 mb-4">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <p className="text-sm text-yellow-800">
                                ინვოისი გადახდილია. ფინანსური დეტალების შეცვლა შეუძლებელია.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="performer">შემსრულებელი</Label>
                            <select id="performer" value={formData.performer_id} onChange={(e) => setFormData({ ...formData, performer_id: e.target.value })} disabled={isPaid} required className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500">
                                {performers.map(p => <option key={p.id} value={p.id}>{p.name || p.legal_name}</option>)}
                            </select>
                        </div>
                         <div>
                            <Label htmlFor="client">კლიენტი</Label>
                            <select id="client" value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} disabled={isPaid} required className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500">
                                {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="invoice_number">ინვოისი ID</Label>
                            <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold select-none">IN#</span>
                                <Input value={displayInvoiceNumber} onChange={(e) => handleInvoiceNumberChange(e.target.value)} disabled={isPaid} required className="font-mono pl-12 disabled:bg-slate-100" maxLength={7} placeholder="0000000"/>
                                {isPaid && <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />}
                            </div>
                        </div>
                        <div>
                            <Label>გადასახადის % (Tax Rate)</Label>
                            <Input type="number" value={formData.tax_rate} onChange={(e) => setFormData({...formData, tax_rate: e.target.value})} disabled={isPaid} className="mt-1 disabled:bg-slate-100" />
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 gap-4 col-span-2">
                             <div>
                                <Label className="text-xs text-slate-500">გამოცემის თარიღი</Label>
                                <Input type="date" value={formData.invoice_date} onChange={(e) => setFormData({...formData, invoice_date: e.target.value})} className="w-full mt-1 bg-white"/>
                             </div>
                             <div>
                                <Label className="text-xs text-slate-500">გადახდის ვადა</Label>
                                <Input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} className="w-full mt-1 bg-white"/>
                             </div>
                        </div>
                    </div>

                    {!isPaid && (
                        <div className="space-y-4">
                            <h3 className="font-bold">სერვისები</h3>
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-5"><Input type="text" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required placeholder="აღწერა"/></div>
                                    <div className="col-span-2"><Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} required placeholder="რაოდ."/></div>
                                    <div className="col-span-2"><Input type="number" step="0.01" value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} required placeholder="ფასი"/></div>
                                    <div className="col-span-2"><Input type="text" readOnly value={parseFloat(item.line_total).toFixed(2)} className="bg-slate-100"/></div>
                                    <div className="col-span-1"><Button type="button" onClick={() => removeItem(index)} variant="ghost" size="sm" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></div>
                                </div>
                            ))}
                            <Button type="button" onClick={addItem} variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" />დაამატე მომსახურება</Button>
                        </div>
                    )}
                    
                    <div>
                        <Label>შენიშვნები (Notes)</Label>
                        <Textarea value={formData.notes || ''} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="mt-1" />
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex justify-between items-center"><span className="text-slate-700">ქვეჯამი:</span><span className="font-medium">{subtotal.toFixed(2)} ₾</span></div>
                      <div className="flex justify-between items-center pt-3 border-t"><span className="text-lg font-bold font-heading">სულ:</span><span className="text-lg font-bold">{total.toFixed(2)} ₾</span></div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>გაუქმება</Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {loading ? 'ინახება...' : 'შენახვა'}
                        </Button>
                    </DialogFooter>
                </form>
                }
            </DialogContent>
        </Dialog>
    );
};

export default EditInvoiceModal;
