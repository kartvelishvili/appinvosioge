
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const ClientEditModal = ({ isOpen, onClose, client, onUpdate }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    company_id: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        company: client.company || '',
        company_id: client.company_id || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        country: client.country || '',
        postal_code: client.postal_code || '',
      });
    }
  }, [client, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "განახლდა",
        description: "კლიენტის მონაცემები წარმატებით განახლდა",
      });

      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error("Client update error:", error);
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>კლიენტის რედაქტირება</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="name">სახელი (საკონტაქტო)*</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} required /></div>
                <div><Label htmlFor="company">კომპანიის სახელი*</Label><Input id="company" name="company" value={formData.company} onChange={handleChange} required /></div>
                
                <div><Label htmlFor="company_id">კომპანიის ს/ნ</Label><Input id="company_id" name="company_id" value={formData.company_id} onChange={handleChange} /></div>
                <div><Label htmlFor="email">ელ-ფოსტა*</Label><Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required /></div>
                
                <div><Label htmlFor="phone">ტელეფონი</Label><Input id="phone" name="phone" value={formData.phone} onChange={handleChange} /></div>
                <div><Label htmlFor="address">მისამართი</Label><Input id="address" name="address" value={formData.address} onChange={handleChange} /></div>
                
                <div><Label htmlFor="city">ქალაქი</Label><Input id="city" name="city" value={formData.city} onChange={handleChange} /></div>
                <div><Label htmlFor="country">ქვეყანა</Label><Input id="country" name="country" value={formData.country} onChange={handleChange} /></div>
                
                <div><Label htmlFor="postal_code">საფოსტო ინდექსი</Label><Input id="postal_code" name="postal_code" value={formData.postal_code} onChange={handleChange} /></div>
            </div>
            
            <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={onClose}>გაუქმება</Button>
                <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {loading ? 'ინახება...' : 'შენახვა'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientEditModal;
