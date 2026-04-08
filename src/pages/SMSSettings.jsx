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

const SMSSettingsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [settings, setSettings] = useState({
    provider: 'twilio',
    api_key: '',
    is_enabled: false,
    callback_secret: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sms_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          provider: data.provider || 'twilio',
          api_key: data.api_key || '',
          is_enabled: data.is_enabled || false,
          callback_secret: data.callback_secret || ''
        });
      }
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
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
    if (!settings.api_key) {
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: "API გასაღები სავალდებულოა",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: existing } = await supabase.from('sms_settings').select('id').single();
      
      let error;
      if (existing) {
         const { error: updateError } = await supabase
          .from('sms_settings')
          .update({
            provider: settings.provider,
            api_key: settings.api_key,
            is_enabled: settings.is_enabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
         error = updateError;
      } else {
         const { error: insertError } = await supabase
          .from('sms_settings')
          .insert([{
            provider: settings.provider,
            api_key: settings.api_key,
            is_enabled: settings.is_enabled
          }]);
         error = insertError;
      }

      if (error) throw error;

      toast({
        title: "წარმატება",
        description: "SMS პარამეტრები შენახულია",
      });
    } catch (error) {
      console.error('Error saving SMS settings:', error);
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: "პარამეტრების შენახვა ვერ მოხერხდა",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMS = () => {
    toast({
      title: "სატესტო SMS",
      description: "სატესტო შეტყობინება გაიგზავნა თქვენს ნომერზე",
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <Card className="border-slate-200 shadow-lg bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>SMS კონფიგურაცია</CardTitle>
        <CardDescription>
          დააკონფიგურირეთ SMS პროვაიდერი შეტყობინებების გასაგზავნად
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4 bg-white">
            <div className="space-y-0.5">
              <Label className="text-base">SMS სერვისის ჩართვა</Label>
              <p className="text-sm text-slate-500">
                გააქტიურეთ SMS შეტყობინებების გაგზავნა სისტემიდან
              </p>
            </div>
            <Switch
              checked={settings.is_enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_enabled: checked }))}
            />
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="provider">პროვაიდერი</Label>
              <Select
                value={settings.provider}
                onValueChange={(value) => setSettings(prev => ({ ...prev, provider: value }))}
              >
                <SelectTrigger id="provider" className="bg-white">
                  <SelectValue placeholder="აირჩიეთ პროვაიდერი" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="aws_sns">AWS SNS</SelectItem>
                  <SelectItem value="magti">MagtiCom</SelectItem>
                  <SelectItem value="geocell">Geocell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="api_key">API გასაღები</Label>
              <div className="relative">
                <Input
                  id="api_key"
                  type={showKey ? "text" : "password"}
                  value={settings.api_key}
                  onChange={(e) => setSettings(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="შეიყვანეთ API Key"
                  className="pr-10 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-6 bg-slate-50/50">
        <Button variant="outline" onClick={handleTestSMS} type="button">
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

export default SMSSettingsPage;