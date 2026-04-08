import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';

const ManualGenerateInvoiceModal = ({ isOpen, onClose, onSubmit, contract = null, initialData = null }) => {
    const [performers, setPerformers] = useState([]);
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({
        contractor_id: '',
        client_id: '',
        amount: '',
        vat: '18',
        service_period_start: '',
        service_period_end: '',
        notes: ''
    });

    useEffect(() => {
        const fetchOptions = async () => {
            const { data: p } = await supabase.from('performers').select('id, name');
            const { data: c } = await supabase.from('clients').select('id, company_name');
            setPerformers(p || []);
            setClients(c || []);
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        if (contract) {
             setFormData(prev => ({
                 ...prev,
                 contractor_id: contract.performer_id,
                 client_id: contract.client_id,
                 amount: contract.default_auto_generation_amount || contract.monthly_fee || '',
                 vat: contract.auto_generation_vat?.toString() || '18',
                 service_period_start: new Date().toISOString().split('T')[0], // Default today
                 contract_id: contract.id
             }));
        } else if (initialData) {
            setFormData({
                contractor_id: initialData.contractor_id,
                client_id: initialData.client_id,
                amount: initialData.amount,
                vat: initialData.vat,
                service_period_start: initialData.service_period_start,
                service_period_end: initialData.service_period_end,
                notes: initialData.notes || '',
                contract_id: initialData.contract_id
            });
        }
    }, [contract, initialData, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{initialData ? 'ინვოისის ჩანაცვლება' : 'ხელით გენერაცია'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>შემსრულებელი</Label>
                            <Select value={formData.contractor_id} onValueChange={(v) => setFormData({...formData, contractor_id: v})}>
                                <SelectTrigger><SelectValue placeholder="აირჩიეთ..." /></SelectTrigger>
                                <SelectContent>
                                    {performers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label>კლიენტი</Label>
                            <Select value={formData.client_id} onValueChange={(v) => setFormData({...formData, client_id: v})}>
                                <SelectTrigger><SelectValue placeholder="აირჩიეთ..." /></SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>თანხა</Label>
                            <Input type="number" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                        </div>
                        <div>
                            <Label>დღგ</Label>
                            <Select value={formData.vat} onValueChange={(v) => setFormData({...formData, vat: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">0%</SelectItem>
                                    <SelectItem value="18">18%</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>პერიოდის დასაწყისი</Label>
                            <Input type="date" required value={formData.service_period_start} onChange={(e) => setFormData({...formData, service_period_start: e.target.value})} />
                        </div>
                        <div>
                            <Label>პერიოდის დასასრული</Label>
                            <Input type="date" required value={formData.service_period_end} onChange={(e) => setFormData({...formData, service_period_end: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <Label>შენიშვნა</Label>
                        <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>გაუქმება</Button>
                        <Button type="submit" className="bg-indigo-600">შენახვა</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ManualGenerateInvoiceModal;