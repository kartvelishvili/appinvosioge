import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const QuickWriteForm = ({ onSuccess, onCancel }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [contracts, setContracts] = useState([]);
    
    const [formData, setFormData] = useState({
        contract_id: '',
        client_id: '',
        contractor_id: '',
        amount: '',
        vat: '18',
        service_period_start: '',
        service_period_end: ''
    });

    // Determine read-only fields for display
    const [selectedContractDetails, setSelectedContractDetails] = useState(null);

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        const { data } = await supabase
            .from('contracts')
            .select('*, clients(company_name), performers(name)')
            .eq('status', 'active');
        setContracts(data || []);
    };

    const handleContractChange = (contractId) => {
        const contract = contracts.find(c => c.id === contractId);
        if (contract) {
            setSelectedContractDetails(contract);
            setFormData(prev => ({
                ...prev,
                contract_id: contract.id,
                client_id: contract.client_id,
                contractor_id: contract.performer_id,
                amount: contract.monthly_fee || '',
                vat: contract.auto_generation_vat?.toString() || '18'
            }));
            
            // Try to auto-calc next date based on contract start if no other info
            // (Simplification: just leave dates empty for user to fill, as "Quick Write" implies manual intervention)
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.contract_id || !formData.amount || !formData.service_period_start || !formData.service_period_end) {
                throw new Error("გთხოვთ შეავსოთ ყველა სავალდებულო ველი");
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("მომხმარებელი არ არის ავტორიზებული");

            const { error } = await supabase.from('auto_invoices').insert([{
                ...formData,
                user_id: user.id,
                status: 'პენდინგი',
                notes: 'Quick Write Generation'
            }]);

            if (error) throw error;

            toast({ title: "წარმატება", description: "ინვოისი დაემატა რიგში" });
            
            // Reset
            setFormData({
                contract_id: '',
                client_id: '',
                contractor_id: '',
                amount: '',
                vat: '18',
                service_period_start: '',
                service_period_end: ''
            });
            setSelectedContractDetails(null);
            
            if (onSuccess) onSuccess();

        } catch (error) {
            toast({ variant: "destructive", title: "შეცდომა", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <Label className="text-slate-600 mb-1.5 block">კონტრაქტი</Label>
                    <Select value={formData.contract_id} onValueChange={handleContractChange}>
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                            <SelectValue placeholder="აირჩიეთ კონტრაქტი..." />
                        </SelectTrigger>
                        <SelectContent>
                            {contracts.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.contract_number} - {c.clients?.company_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-slate-500 text-xs mb-1 block">კლიენტი</Label>
                        <Input disabled value={selectedContractDetails?.clients?.company_name || ''} className="bg-slate-100 border-slate-200 text-slate-500" />
                    </div>
                    <div>
                        <Label className="text-slate-500 text-xs mb-1 block">შემსრულებელი</Label>
                        <Input disabled value={selectedContractDetails?.performers?.name || ''} className="bg-slate-100 border-slate-200 text-slate-500" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-slate-600 mb-1.5 block">თანხა (₾)</Label>
                        <Input 
                            type="number" 
                            value={formData.amount} 
                            onChange={e => setFormData({...formData, amount: e.target.value})}
                            className="bg-white border-slate-200 focus:ring-indigo-500"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <Label className="text-slate-600 mb-1.5 block">დღგ</Label>
                        <Select value={formData.vat} onValueChange={v => setFormData({...formData, vat: v})}>
                            <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="18">18%</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-slate-600 mb-1.5 block">პერიოდი - დასაწყისი</Label>
                        <Input 
                            type="date" 
                            value={formData.service_period_start} 
                            onChange={e => setFormData({...formData, service_period_start: e.target.value})}
                            className="bg-white"
                        />
                    </div>
                    <div>
                        <Label className="text-slate-600 mb-1.5 block">პერიოდი - დასასრული</Label>
                        <Input 
                            type="date" 
                            value={formData.service_period_end} 
                            onChange={e => setFormData({...formData, service_period_end: e.target.value})}
                            className="bg-white"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-4 justify-end">
                <Button type="button" variant="outline" onClick={onCancel}>გაუქმება</Button>
                <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'გენერირება'}
                </Button>
            </div>
        </form>
    );
};

export default QuickWriteForm;