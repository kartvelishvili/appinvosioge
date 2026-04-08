
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Camera, Loader2, Save, AlertTriangle, RefreshCw, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import Navbar from '@/components/Navbar';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import ErrorBoundary from '@/components/ErrorBoundary';

const ProfileForm = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fetchProfile = useCallback(async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    return data || {};
  }, [user]);

  const { data: initialProfile, loading, error, retry } = useSupabaseQuery(fetchProfile, [user], { immediate: true });

  const [profile, setProfile] = useState({
    full_name: '', 
    company_name: '', 
    phone: '', 
    address: '', 
    city: '', 
    country: '', 
    postal_code: '', 
    bio: '', 
    avatar_url: '',
    boost_enabled: false
  });

  useEffect(() => {
    if (initialProfile && Object.keys(initialProfile).length > 0) {
      setProfile({
        full_name: initialProfile.full_name || '',
        company_name: initialProfile.company_name || '',
        phone: initialProfile.phone || '',
        address: initialProfile.address || '',
        city: initialProfile.city || '',
        country: initialProfile.country || '',
        postal_code: initialProfile.postal_code || '',
        bio: initialProfile.bio || '',
        avatar_url: initialProfile.avatar_url || '',
        boost_enabled: initialProfile.boost_enabled || false
      });
    }
  }, [initialProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked) => {
    setProfile(prev => ({ ...prev, boost_enabled: checked }));
  };

  const handleImageUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: "სურათი აიტვირთა", description: "პროფილის სურათი წარმატებით განახლდა" });
    } catch (err) {
      toast({ variant: "destructive", title: "შეცდომა", description: "სურათის ატვირთვა ვერ მოხერხდა" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = { 
        user_id: user.id, 
        ...profile, 
        updated_at: new Date().toISOString() 
      };
      
      const { error } = await supabase
        .from('user_profiles')
        .upsert(updates, { onConflict: 'user_id' });
        
      if (error) throw error;
      
      toast({ title: "წარმატება", description: "პროფილი წარმატებით შენახულია" });
      if (refreshProfile) refreshProfile();
    } catch (err) {
      toast({ variant: "destructive", title: "შეცდომა", description: "პროფილის განახლება ვერ მოხერხდა" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  if (error) {
     return (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-red-100">
           <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
           <p className="text-red-500 mb-4">{error}</p>
           <Button onClick={retry}><RefreshCw className="w-4 h-4 mr-2"/> თავიდან ცდა</Button>
        </div>
     );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-10 text-white relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-6">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 overflow-hidden flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-white" />
              )}
            </div>
            <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
            </label>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{profile.full_name || 'მომხმარებელი'}</h1>
            <p className="text-blue-100 flex items-center gap-2 mt-1"><Mail className="h-4 w-4" /> {user?.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        
        {/* Boost Mode Settings */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5 mb-6 flex items-center justify-between">
            <div>
                <h3 className="text-indigo-900 font-bold flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-indigo-600" />
                    Boost Mode
                </h3>
                <p className="text-sm text-indigo-700 mt-1">
                    ჩართეთ ბუსტის რეჟიმი სპეციალური ინვოისების და დეტალური ანალიტიკის გასააქტიურებლად.
                </p>
            </div>
            <Switch 
                checked={profile.boost_enabled} 
                onCheckedChange={handleSwitchChange} 
                className="data-[state=checked]:bg-indigo-600"
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>სრული სახელი</Label>
              <Input name="full_name" value={profile.full_name} onChange={handleInputChange} placeholder="გიორგი გიორგაძე" />
            </div>
            <div className="space-y-2">
              <Label>კომპანიის სახელი</Label>
              <Input name="company_name" value={profile.company_name} onChange={handleInputChange} placeholder="შპს მაგალითი" />
            </div>
            <div className="space-y-2">
              <Label>ტელეფონი</Label>
              <Input name="phone" value={profile.phone} onChange={handleInputChange} placeholder="+995 555 12 34 56" />
            </div>
            <div className="space-y-2">
              <Label>მისამართი</Label>
              <Input name="address" value={profile.address} onChange={handleInputChange} placeholder="რუსთაველის გამზ. 1" />
            </div>
            <div className="space-y-2">
              <Label>ქალაქი</Label>
              <Input name="city" value={profile.city} onChange={handleInputChange} placeholder="თბილისი" />
            </div>
            <div className="space-y-2">
              <Label>ქვეყანა</Label>
              <Input name="country" value={profile.country} onChange={handleInputChange} placeholder="საქართველო" />
            </div>
            <div className="space-y-2">
              <Label>საფოსტო ინდექსი</Label>
              <Input name="postal_code" value={profile.postal_code} onChange={handleInputChange} placeholder="0108" />
            </div>
        </div>
        
        <div className="space-y-2">
          <Label>ბიოგრაფია / აღწერა</Label>
          <Textarea 
            name="bio" 
            value={profile.bio} 
            onChange={handleInputChange} 
            placeholder="მოკლე ინფორმაცია თქვენს ან თქვენი კომპანიის შესახებ..."
            className="min-h-[100px]"
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> ინახება...</> : <><Save className="mr-2 h-4 w-4" /> შენახვა</>}
          </Button>
        </div>
      </form>
    </div>
  );
};

const Profile = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
           <ErrorBoundary>
              <ProfileForm />
           </ErrorBoundary>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
