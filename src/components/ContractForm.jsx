
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch'; 

const ContractForm = ({ isOpen, onClose, contractToEdit, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [performers, setPerformers] = useState([]);

  const [formData, setFormData] = useState({
    contract_number: '',
    client_id: '',
    start_date: '',
    end_date: '',
    amount: '',
    description: '',
    status: 'draft'
  });

  // Extra metadata stored in description as JSON
  const [metaData, setMetaData] = useState({
    performer_id: '',
    currency: 'GEL',
    service_type: '',
    auto_generate: false,
    payment_day: '1',
    terms: ''
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (contractToEdit) {
      setFormData({
        contract_number: contractToEdit.contract_number,
        client_id: contractToEdit.client_id,
        start_date: contractToEdit.start_date ? new Date(contractToEdit.start_date).toISOString().split('T')[0] : '',
        end_date: contractToEdit.end_date ? new Date(contractToEdit.end_date).toISOString().split('T')[0] : '',
        amount: contractToEdit.amount || '',
        description: '',
        status: contractToEdit.status || 'draft',
      });
      // Parse metadata from description
      try {
        const parsed = JSON.parse(contractToEdit.description || '{}');
        setMetaData({
          performer_id: parsed.performer_id || '',
          currency: parsed.currency || 'GEL',
          service_type: parsed.service_type || '',
          auto_generate: parsed.auto_generate || false,
          payment_day: parsed.payment_day || '1',
          terms: parsed.terms || ''
        });
      } catch {
        setMetaData(prev => ({ ...prev, terms: contractToEdit.description || '' }));
      }
    } else {
      setFormData({
        contract_number: `CNT-${Date.now().toString().slice(-6)}`,
        client_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        amount: '',
        description: '',
        status: 'draft'
      });
      setMetaData({
        performer_id: '', currency: 'GEL', service_type: '',
        auto_generate: false, payment_day: '1', terms: ''
      });
    }
  }, [contractToEdit, isOpen]);

  const fetchOptions = async () => {
    const [clientsRes, performersRes] = await Promise.all([
      supabase.from('clients').select('id, company, name'),
      supabase.from('performers').select('id, name, legal_name')
    ]);
    setClients(clientsRes.data || []);
    setPerformers(performersRes.data || []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.client_id || !formData.start_date || !formData.amount) {
        throw new Error("ყველა სავალდებულო ველი უნდა იყოს შევსებული");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("მომხმარებელი არ არის ავტორიზებული");

      // Store metadata in description as JSON
      const descriptionJson = JSON.stringify(metaData);

      const payload = { 
        contract_number: formData.contract_number,
        client_id: formData.client_id,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        amount: parseFloat(formData.amount),
        description: descriptionJson,
        status: formData.status,
        user_id: user.id,
        updated_at: new Date().toISOString() 
      };

      let error;
      if (contractToEdit) {
        const { error: updateError } = await supabase
          .from('contracts')
          .update(payload)
          .eq('id', contractToEdit.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('contracts')
          .insert([{ ...payload, created_at: new Date().toISOString(), contract_date: new Date().toISOString() }]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "წარმატება",
        description: contractToEdit ? "კონტრაქტი განახლდა" : "კონტრაქტი შეიქმნა",
      });
      onSuccess();
      onClose();
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

  const selectedClient = clients.find(c => c.id === formData.client_id);
  const selectedPerformer = performers.find(p => p.id === metaData.performer_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{contractToEdit ? 'კონტრაქტის რედაქტირება' : 'ახალი კონტრაქტი'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>კონტრაქტის ნომერი</Label>
              <Input name="contract_number" value={formData.contract_number} onChange={handleChange} required className="font-mono" />
            </div>
            <div>
              <Label>სტატუსი</Label>
              <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)}>
                <SelectTrigger><SelectValue placeholder="სტატუსი" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">დრაფტი</SelectItem>
                  <SelectItem value="active">აქტიური</SelectItem>
                  <SelectItem value="signed">ხელმოწერილი</SelectItem>
                  <SelectItem value="terminated">შეწყვეტილი</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ვალუტა</Label>
              <Select value={metaData.currency} onValueChange={(val) => setMetaData(prev => ({...prev, currency: val}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GEL">₾ GEL</SelectItem>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="EUR">€ EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <Label className="text-xs font-bold text-slate-500 uppercase">მხარე 1 — შემსრულებელი</Label>
              <Select value={metaData.performer_id} onValueChange={(val) => setMetaData(prev => ({...prev, performer_id: val}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="აირჩიეთ შემსრულებელი" /></SelectTrigger>
                <SelectContent>
                  {performers.map(p => <SelectItem key={p.id} value={p.id}>{p.legal_name || p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-500 uppercase">მხარე 2 — დამკვეთი</Label>
              <Select value={formData.client_id} onValueChange={(val) => handleSelectChange('client_id', val)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="აირჩიეთ კლიენტი" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company || c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>დაწყების თარიღი *</Label>
              <Input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
            </div>
            <div>
              <Label>დასრულების თარიღი</Label>
              <Input type="date" name="end_date" value={formData.end_date} onChange={handleChange} />
            </div>
            <div>
              <Label>ყოველთვიური ღირებულება *</Label>
              <Input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} required placeholder="0.00" />
            </div>
          </div>

          {/* Service Type */}
          <div>
            <Label>მომსახურების ტიპი</Label>
            <Input 
              value={metaData.service_type} 
              onChange={(e) => setMetaData(prev => ({...prev, service_type: e.target.value}))} 
              placeholder="მაგ: რეკლამის მართვა, ვებ-დეველოპმენტი..."
              className="mt-1"
            />
          </div>

          {/* Auto-generate invoices */}
          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div>
              <p className="font-bold text-sm text-slate-800">ინვოისების ავტომატური გენერაცია</p>
              <p className="text-xs text-slate-500 mt-0.5">ყოველი თვე ავტომატურად შეიქმნას ინვოისი ამ კონტრაქტის საფუძველზე</p>
            </div>
            <Switch checked={metaData.auto_generate} onCheckedChange={(val) => setMetaData(prev => ({...prev, auto_generate: val}))} />
          </div>

          {metaData.auto_generate && (
            <div>
              <Label>გადახდის დღე (თვეში)</Label>
              <Select value={metaData.payment_day} onValueChange={(val) => setMetaData(prev => ({...prev, payment_day: val}))}>
                <SelectTrigger className="mt-1 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,5,10,15,20,25].map(d => <SelectItem key={d} value={d.toString()}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Terms */}
          <div>
            <Label>პირობები / შენიშვნა</Label>
            <Textarea 
              value={metaData.terms} 
              onChange={(e) => setMetaData(prev => ({...prev, terms: e.target.value}))} 
              className="h-24 mt-1"
              placeholder="დამატებითი პირობები..."
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>გაუქმება</Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? 'ინახება...' : 'შენახვა'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContractForm;
