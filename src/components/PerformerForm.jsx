
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Landmark, Upload, X, Image, PenTool } from 'lucide-react';

const BANKS = [
  { 
    id: 'tbc', 
    name: 'ს.ს "თიბისი ბანკი"', 
    defaultLogo: 'https://i.postimg.cc/qMC1TTG1/logo-frame-tbc.webp',
    swift: 'TBCBGE22'
  },
  { 
    id: 'bog', 
    name: 'საქართველოს ბანკი', 
    defaultLogo: 'https://i.postimg.cc/JhQ7nSRj/logo-frame.webp',
    swift: 'BAGAGE22'
  },
  { id: 'other', name: 'სხვა ბანკი', defaultLogo: '', swift: '' },
];

const PerformerForm = ({ isOpen, onClose, performerToEdit, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  
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
    logo_url: '',
    signature_url: ''
  });

  // Bank UI state (not saved to DB separately, derived from IBAN)
  const [selectedBank, setSelectedBank] = useState('');

  const detectBankFromIBAN = (iban) => {
    const clean = (iban || '').replace(/\s/g, '').toUpperCase();
    if (clean.length >= 6 && clean.startsWith('GE')) {
      const bankCode = clean.substring(4, 6);
      if (bankCode === 'TB') return 'tbc';
      if (bankCode === 'BG') return 'bog';
    }
    return '';
  };

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
        logo_url: performerToEdit.logo_url || '',
        signature_url: performerToEdit.signature_url || ''
      });
      setSelectedBank(detectBankFromIBAN(performerToEdit.bank_account));
    } else {
      setFormData({
        name: '', legal_name: '', email: '', phone: '', address: '', 
        city: '', country: '', postal_code: '', tax_id: '', 
        bank_account: '', director_name: '', logo_url: '', signature_url: ''
      });
      setSelectedBank('');
    }
  }, [performerToEdit, isOpen]);

  const handleBankSelect = (bankId) => {
    setSelectedBank(bankId);
  };

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
            <div><Label>დირექტორის სახელი</Label><Input name="director_name" value={formData.director_name} onChange={handleChange} /></div>
          </div>

          {/* Bank Section */}
          <div className="border-t border-slate-200 pt-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="h-4 w-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">საბანკო რეკვიზიტები</h3>
            </div>
            
            <div className="flex gap-3 mb-4">
              {BANKS.filter(b => b.id !== 'other').map(bank => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => handleBankSelect(bank.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                    selectedBank === bank.id 
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <img src={bank.defaultLogo} alt={bank.name} className="h-6 w-10 object-contain" />
                  <span className="text-xs font-bold text-slate-700">{bank.name}</span>
                </button>
              ))}
            </div>

            <div>
              <Label>საბანკო ანგარიში (IBAN)</Label>
              <Input 
                name="bank_account" 
                value={formData.bank_account} 
                onChange={(e) => {
                  handleChange(e);
                  setSelectedBank(detectBankFromIBAN(e.target.value));
                }} 
                placeholder="GE00TB0000000000000000" 
                className="font-mono mt-1" 
              />
              {selectedBank && (
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <img src={BANKS.find(b => b.id === selectedBank)?.defaultLogo} alt="" className="h-4 w-6 object-contain" />
                  <span>{BANKS.find(b => b.id === selectedBank)?.name}</span>
                  <span className="text-slate-400">• {BANKS.find(b => b.id === selectedBank)?.swift}</span>
                </div>
              )}
            </div>
          </div>

          {/* Logo Upload */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Image className="h-4 w-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">კომპანიის ლოგო</h3>
            </div>
            {formData.logo_url ? (
              <div className="flex items-center gap-4">
                <img src={formData.logo_url} alt="Logo" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    <Upload className="h-3.5 w-3.5 mr-1" />{uploadingLogo ? 'იტვირთება...' : 'შეცვლა'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(prev => ({...prev, logo_url: ''}))} className="text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
              >
                <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">{uploadingLogo ? 'იტვირთება...' : 'ატვირთეთ ლოგო'}</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP</p>
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingLogo(true);
                try {
                  const ext = file.name.split('.').pop();
                  const fileName = `performer_logo_${Date.now()}.${ext}`;
                  const { error: uploadError } = await supabase.storage.from('public').upload(fileName, file);
                  if (uploadError) throw uploadError;
                  const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(fileName);
                  setFormData(prev => ({...prev, logo_url: publicUrl}));
                } catch (err) {
                  toast({ variant: 'destructive', title: 'შეცდომა', description: 'ლოგოს ატვირთვა ვერ მოხერხდა' });
                } finally {
                  setUploadingLogo(false);
                  e.target.value = '';
                }
              }}
            />
          </div>

          {/* Signature Upload */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <PenTool className="h-4 w-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">ხელმოწერა</h3>
            </div>
            {formData.signature_url ? (
              <div className="flex items-center gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-2">
                  <img src={formData.signature_url} alt="Signature" className="h-12 object-contain mix-blend-multiply" />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => signatureInputRef.current?.click()} disabled={uploadingSignature}>
                    <Upload className="h-3.5 w-3.5 mr-1" />{uploadingSignature ? 'იტვირთება...' : 'შეცვლა'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(prev => ({...prev, signature_url: ''}))} className="text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => signatureInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
              >
                <PenTool className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">{uploadingSignature ? 'იტვირთება...' : 'ატვირთეთ ხელმოწერის სურათი'}</p>
                <p className="text-xs text-slate-400 mt-1">PNG გამჭვირვალე ფონით რეკომენდებულია</p>
              </div>
            )}
            <input
              ref={signatureInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingSignature(true);
                try {
                  const ext = file.name.split('.').pop();
                  const fileName = `performer_sig_${Date.now()}.${ext}`;
                  const { error: uploadError } = await supabase.storage.from('public').upload(fileName, file);
                  if (uploadError) throw uploadError;
                  const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(fileName);
                  setFormData(prev => ({...prev, signature_url: publicUrl}));
                } catch (err) {
                  toast({ variant: 'destructive', title: 'შეცდომა', description: 'ხელმოწერის ატვირთვა ვერ მოხერხდა' });
                } finally {
                  setUploadingSignature(false);
                  e.target.value = '';
                }
              }}
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

export default PerformerForm;
