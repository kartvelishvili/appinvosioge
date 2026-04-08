
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const PerformerForm = ({ isOpen, onClose, performerToEdit, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    tax_id: '',
    bank_account: '',
    director_name: '',
    logo_url: ''
  });

  useEffect(() => {
    if (performerToEdit) {
      setFormData({
        name: performerToEdit.name || '',
        legal_name: performerToEdit.legal_name || '',
        email: performerToEdit.email || '',
        phone: performerToEdit.phone || '',
        address: performerToEdit.address || '',
        city: performerToEdit.city || '',
        country: performerToEdit.country || '',
        postal_code: performerToEdit.postal_code || '',
        tax_id: performerToEdit.tax_id || '',
        bank_account: performerToEdit.bank_account || '',
        director_name: performerToEdit.director_name || '',
        logo_url: performerToEdit.logo_url || ''
      });
    } else {
      setFormData({
        name: '', legal_name: '', email: '', phone: '', address: '', 
        city: '', country: '', postal_code: '', tax_id: '', 
        bank_account: '', director_name: '', logo_url: ''
      });
    }
  }, [performerToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("მომხმარებელი არ არის ავტორიზებული");

      const payload = { 
          ...formData, 
          user_id: user.id, 
          updated_at: new Date().toISOString() 
      };
      
      let error;
      if (performerToEdit) {
        const { error: updateError } = await supabase
          .from('performers')
          .update(payload)
          .eq('id', performerToEdit.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('performers')
          .insert([{ ...payload, created_at: new Date().toISOString() }]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "წარმატება",
        description: performerToEdit ? "შემსრულებელი განახლდა" : "შემსრულებელი დაემატა",
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{performerToEdit ? 'შემსრულებლის რედაქტირება' : 'ახალი შემსრულებელი'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>სახელი (ბრენდი)</Label><Input name="name" value={formData.name} onChange={handleChange} required /></div>
            <div><Label>იურიდიული სახელი</Label><Input name="legal_name" value={formData.legal_name} onChange={handleChange} required /></div>
            
            <div><Label>ელ-ფოსტა</Label><Input name="email" type="email" value={formData.email} onChange={handleChange} /></div>
            <div><Label>ტელეფონი</Label><Input name="phone" value={formData.phone} onChange={handleChange} /></div>
            
            <div><Label>მისამართი</Label><Input name="address" value={formData.address} onChange={handleChange} /></div>
            <div><Label>საიდენტიფიკაციო კოდი</Label><Input name="tax_id" value={formData.tax_id} onChange={handleChange} /></div>
            
            <div><Label>ქალაქი</Label><Input name="city" value={formData.city} onChange={handleChange} /></div>
            <div><Label>ქვეყანა</Label><Input name="country" value={formData.country} onChange={handleChange} /></div>
            
            <div><Label>საფოსტო ინდექსი</Label><Input name="postal_code" value={formData.postal_code} onChange={handleChange} /></div>
            <div><Label>საბანკო ანგარიში</Label><Input name="bank_account" value={formData.bank_account} onChange={handleChange} /></div>
            
            <div><Label>დირექტორის სახელი</Label><Input name="director_name" value={formData.director_name} onChange={handleChange} /></div>
            <div><Label>ლოგოს URL</Label><Input name="logo_url" value={formData.logo_url} onChange={handleChange} placeholder="https://..." /></div>
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

export default PerformerForm;
