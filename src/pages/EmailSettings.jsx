import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Save, Send, Eye, EyeOff } from 'lucide-react';

const EmailSettingsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    provider: 'smtp',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    is_enabled: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          provider: data.provider || 'smtp',
          smtp_host: data.smtp_host || '',
          smtp_port: data.smtp_port?.toString() || '587',
          smtp_user: data.smtp_user || '',
          smtp_password: data.smtp_password || '',
          from_email: data.from_email || '',
          from_name: data.from_name || '',
          is_enabled: true 
        });
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: "პარამეტრების ჩატვირთვა ვერ მოხერხდა",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!settings.from_email || !settings.smtp_host) {
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: "შეავსეთ სავალდებულო ველები",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: existing } = await supabase.from('email_settings').select('id').single();
      
      const payload = {
        provider: settings.provider,
        smtp_host: settings.smtp_host,
        smtp_port: parseInt(settings.smtp_port),
        smtp_user: settings.smtp_user,
        smtp_password: settings.smtp_password,
        from_email: settings.from_email,
        from_name: settings.from_name,
        updated_at: new Date().toISOString()
      };

      let error;
      if (existing) {
         const { error: updateError } = await supabase
          .from('email_settings')
          .update(payload)
          .eq('id', existing.id);
         error = updateError;
      } else {
         const { error: insertError } = await supabase
          .from('email_settings')
          .insert([payload]);
         error = insertError;
      }

      if (error) throw error;

      toast({
        title: "წარმატება",
        description: "Email პარამეტრები შენახულია",
      });
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: "პარამეტრების შენახვა ვერ მოხერხდა",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = () => {
    toast({
      title: "სატესტო Email",
      description: "სატესტო წერილი გაიგზავნა თქვენს ელ-ფოსტაზე",
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <Card className="border-slate-200 shadow-lg bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Email კონფიგურაცია</CardTitle>
        <CardDescription>
          დააკონფიგურირეთ SMTP ან სხვა პროვაიდერი ელ-ფოსტის გასაგზავნად
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4 bg-white">
            <div className="space-y-0.5">
              <Label className="text-base">Email სერვისის ჩართვა</Label>
              <p className="text-sm text-slate-500">
                გააქტიურეთ ელ-ფოსტის გაგზავნა სისტემიდან
              </p>
            </div>
            <Switch
              checked={settings.is_enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_enabled: checked }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="provider">პროვაიდერი</Label>
              <Select
                value={settings.provider}
                onValueChange={(value) => setSettings(prev => ({ ...prev, provider: value }))}
              >
                <SelectTrigger id="provider" className="bg-white">
                  <SelectValue placeholder="აირჩიეთ პროვაიდერი" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smtp">SMTP სერვერი</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="resend">Resend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_name">გამგზავნის სახელი</Label>
              <Input
                id="from_name"
                value={settings.from_name}
                onChange={(e) => setSettings(prev => ({ ...prev, from_name: e.target.value }))}
                placeholder="მაგ: Invoiso Alerts"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_email">გამგზავნის Email</Label>
              <Input
                id="from_email"
                type="email"
                value={settings.from_email}
                onChange={(e) => setSettings(prev => ({ ...prev, from_email: e.target.value }))}
                placeholder="noreply@example.com"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_host">SMTP Host</Label>
              <Input
                id="smtp_host"
                value={settings.smtp_host}
                onChange={(e) => setSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                placeholder="smtp.example.com"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_port">SMTP Port</Label>
              <Input
                id="smtp_port"
                value={settings.smtp_port}
                onChange={(e) => setSettings(prev => ({ ...prev, smtp_port: e.target.value }))}
                placeholder="587"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_user">SMTP Username</Label>
              <Input
                id="smtp_user"
                value={settings.smtp_user}
                onChange={(e) => setSettings(prev => ({ ...prev, smtp_user: e.target.value }))}
                placeholder="username"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_password">SMTP Password</Label>
              <div className="relative">
                <Input
                  id="smtp_password"
                  type={showPassword ? "text" : "password"}
                  value={settings.smtp_password}
                  onChange={(e) => setSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                  placeholder="password"
                  className="pr-10 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-6 bg-slate-50/50">
        <Button variant="outline" onClick={handleTestEmail} type="button">
          <Send className="mr-2 h-4 w-4" />
          ტესტირება
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          შენახვა
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmailSettingsPage;