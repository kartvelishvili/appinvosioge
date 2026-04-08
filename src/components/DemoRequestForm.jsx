import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Briefcase, Phone, User } from 'lucide-react';

const DemoRequestForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_id: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name || formData.first_name.length < 2) {
      newErrors.first_name = "სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს.";
    }
    if (!formData.last_name || formData.last_name.length < 2) {
      newErrors.last_name = "გვარი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "ელფოსტის ფორმატი არასწორია.";
    }
    // Simple Georgian phone validation +9955... or 5...
    const phoneRegex = /^(\+995)?\d{9}$/; 
    if (!formData.phone || !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = "ტელეფონის ფორმატი არასწორია (+995 5XX XXX XXX).";
    }
    if (!formData.company_id || formData.company_id.length < 3) {
      newErrors.company_id = "კომპანიის საიდენტიფიკაციო უნდა შეიცავდეს მინიმუმ 3 სიმბოლოს.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const submissionData = {
          ...formData,
          created_at: new Date().toISOString()
      };

      // 1. Insert into database
      const { error: insertError } = await supabase
        .from('demo_requests')
        .insert([submissionData]);

      if (insertError) throw insertError;

      // 2. Call Edge Function to send email
      await supabase.functions.invoke('send-demo-email', {
        body: JSON.stringify(submissionData),
      });

      toast({
        title: "წარმატება",
        description: "დემო მოთხოვნა გაიგზავნა! მალე დაგიკავშირდებით.",
        duration: 4000,
      });
      
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_id: '',
      });
      setErrors({});

    } catch (error) {
      console.error("Demo request submission error:", error);
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: "მოთხოვნის გაგზავნა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <Label htmlFor="first_name" className="block text-sm font-bold text-slate-700 mb-1.5">
              სახელი <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                className={`pl-9 border-slate-300 ${errors.first_name ? 'border-red-500 focus:ring-red-200' : 'focus:ring-blue-100'}`}
                placeholder="თქვენი სახელი"
              />
            </div>
            {errors.first_name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.first_name}</p>}
        </div>
        <div>
            <Label htmlFor="last_name" className="block text-sm font-bold text-slate-700 mb-1.5">
              გვარი <span className="text-red-500">*</span>
            </Label>
             <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                className={`pl-9 border-slate-300 ${errors.last_name ? 'border-red-500 focus:ring-red-200' : 'focus:ring-blue-100'}`}
                placeholder="თქვენი გვარი"
              />
            </div>
            {errors.last_name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.last_name}</p>}
        </div>
      </div>

      <div>
          <Label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">
            ელფოსტა <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`pl-9 border-slate-300 ${errors.email ? 'border-red-500 focus:ring-red-200' : 'focus:ring-blue-100'}`}
              placeholder="example@gmail.com"
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
      </div>

      <div>
          <Label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-1.5">
            ტელეფონი <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className={`pl-9 border-slate-300 ${errors.phone ? 'border-red-500 focus:ring-red-200' : 'focus:ring-blue-100'}`}
              placeholder="+995 5XX XXX XXX"
            />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</p>}
      </div>

      <div>
          <Label htmlFor="company_id" className="block text-sm font-bold text-slate-700 mb-1.5">
            კომპანიის საიდენტიფიკაციო <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="company_id"
              name="company_id"
              type="text"
              value={formData.company_id}
              onChange={handleChange}
              className={`pl-9 border-slate-300 ${errors.company_id ? 'border-red-500 focus:ring-red-200' : 'focus:ring-blue-100'}`}
              placeholder="კომპანიის ს/ნ"
            />
          </div>
          {errors.company_id && <p className="text-red-500 text-xs mt-1 font-medium">{errors.company_id}</p>}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl transition-all mt-4"
      >
        {loading ? (
            <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                იგზავნება...
            </div>
        ) : 'დემო მოთხოვნა'}
      </Button>
    </form>
  );
};

export default DemoRequestForm;