
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

  const [formData, setFormData] = useState({
    contract_number: '',
    client_id: '',
    start_date: '',
    end_date: '',
    amount: '',
    description: '',
    status: 'draft'
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
        description: contractToEdit.description || '',
        status: contractToEdit.status || 'draft',
      });
    } else {
      setFormData({
        contract_number: `CNT-${Date.now().toString().slice(-6)}`,
        client_id: '',
        start_date: '',
        end_date: '',
        amount: '',
        description: '',
        status: 'draft'
      });
    }
  }, [contractToEdit, isOpen]);

  const fetchOptions = async () => {
    const { data: clientsData } = await supabase.from('clients').select('id, company, name');
    setClients(clientsData || []);
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

      const payload = { 
        contract_number: formData.contract_number,
        client_id: formData.client_id,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        amount: parseFloat(formData.amount),
        description: formData.description,
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
          .insert([{ ...payload, created_at: new Date().toISOString() }]);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contractToEdit ? 'კონტრაქტის რედაქტირება' : 'ახალი კონტრაქტი'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>კონტრაქტის ნომერი</Label>
              <Input name="contract_number" value={formData.contract_number} onChange={handleChange} required />
            </div>
            <div>
              <Label>სტატუსი</Label>
              <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)}>
                <SelectTrigger><SelectValue placeholder="აირჩიეთ სტატუსი" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">დრაფტი</SelectItem>
                  <SelectItem value="active">აქტიური</SelectItem>
                  <SelectItem value="signed">ხელმოწერილი</SelectItem>
                  <SelectItem value="terminated">შეწყვეტილი</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>მხარე 1 (დამკვეთი)</Label>
              <Select value={formData.client_id} onValueChange={(val) => handleSelectChange('client_id', val)}>
                <SelectTrigger><SelectValue placeholder="აირჩიეთ კლიენტი" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company || c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>დაწყების თარიღი</Label>
              <Input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
            </div>
            <div>
              <Label>დასრულების თარიღი</Label>
              <Input type="date" name="end_date" value={formData.end_date} onChange={handleChange} />
            </div>

            <div>
              <Label>ღირებულება (Amount)</Label>
              <Input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <Label>მომსახურების აღწერა</Label>
            <Textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              className="h-24"
              placeholder="დეტალური აღწერა..."
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
