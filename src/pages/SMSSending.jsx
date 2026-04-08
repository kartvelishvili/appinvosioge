import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { sendSMSCampaign, normalizePhoneNumber, countSmsSegments } from '@/utils/sendSMSCampaign';
import { supabase } from '@/lib/customSupabaseClient';
import { Send, Calculator } from 'lucide-react';

const SMSSending = () => {
  const { toast } = useToast();
  const [numbers, setNumbers] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sending, setSending] = useState(false);
  const [segments, setSegments] = useState({ count: 0, segments: 0, encoding: 'UCS-2' });
  
  // Template State
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  useEffect(() => {
      const { encoding, count, segments } = countSmsSegments(message);
      setSegments({ encoding, count, segments });
  }, [message]);

  useEffect(() => {
      fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
      const { data } = await supabase.from('sms_templates').select('*').order('name');
      setTemplates(data || []);
  };

  const handleTemplateChange = (tplId) => {
      setSelectedTemplateId(tplId);
      const tpl = templates.find(t => t.id === tplId);
      if (tpl) {
          setMessage(tpl.content);
      }
  };

  const handleSend = async () => {
      const rawNumbers = numbers.split('\n').map(n => n.trim()).filter(n => n.length > 0);
      if (rawNumbers.length === 0) {
          toast({ variant: "destructive", title: "შეცდომა", description: "შეიყვანეთ მინიმუმ ერთი ნომერი" });
          return;
      }
      if (!message.trim()) {
          toast({ variant: "destructive", title: "შეცდომა", description: "შეიყვანეთ შეტყობინების ტექსტი" });
          return;
      }

      const validNumbers = [];
      const invalidNumbers = [];

      rawNumbers.forEach(num => {
          const normalized = normalizePhoneNumber(num);
          if (normalized) validNumbers.push(normalized);
          else invalidNumbers.push(num);
      });

      if (validNumbers.length === 0) {
          toast({ variant: "destructive", title: "შეცდომა", description: "არცერთი ნომერი არ არის ვალიდური" });
          return;
      }

      if (invalidNumbers.length > 0) {
          toast({ 
              variant: "warning", 
              title: "ყურადღება", 
              description: `${invalidNumbers.length} ნომერი არასწორია და გამოირიცხა. იგზავნება ${validNumbers.length} ნომერზე.` 
          });
      }

      setSending(true);
      try {
          // Format schedule date to UTC if present
          // HTML datetime-local is local time. API expects UTC usually or handle offset.
          // For simplicity, we'll send what UI gives or convert if needed.
          // Let's assume user inputs local and we convert to ISO string which carries timezone info or UTC.
          let scheduleISO = null;
          if (scheduledAt) {
             scheduleISO = new Date(scheduledAt).toISOString();
          }

          // Create Campaign Record
          const { data: campaign, error: campError } = await supabase
              .from('sms_campaigns')
              .insert({
                  name: `Campaign ${new Date().toLocaleDateString()}`,
                  numbers_count: validNumbers.length,
                  message: message,
                  scheduled_at: scheduleISO
              })
              .select()
              .single();
          
          if (campError) throw campError;

          // Send API Request
          const result = await sendSMSCampaign(validNumbers, message, scheduleISO);

          // Log results
          const logs = validNumbers.map((num, idx) => ({
              campaign_id: campaign.id,
              phone_number: num,
              message: message,
              status: result.success ? 'sent' : 'failed',
              api_response: result.data || { error: result.error },
              sms_id: result.sms_ids?.[idx] || result.sms_ids?.[0] || null
          }));

          await supabase.from('sms_logs').insert(logs);

          if (result.success) {
              toast({ 
                  title: "წარმატება", 
                  description: `SMS გაიგზავნა ${validNumbers.length} ნომერზე`,
                  className: "bg-green-50 border-green-200"
              });
              setNumbers('');
              setMessage('');
              setScheduledAt('');
          } else {
              toast({ variant: "destructive", title: "შეცდომა", description: result.error || "ვერ გაიგზავნა" });
          }

      } catch (error) {
          console.error(error);
          toast({ variant: "destructive", title: "სისტემური შეცდომა", description: error.message });
      } finally {
          setSending(false);
      }
  };

  return (
    <>
      <Helmet>
        <title>SMS გაგზავნა - Invoiso</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-8">SMS გაგზავნა</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                  
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                          მიმღები ნომრები (თითო ხაზზე თითო ნომერი)
                      </label>
                      <Textarea 
                          value={numbers}
                          onChange={(e) => setNumbers(e.target.value)}
                          placeholder="599123456&#10;577987654"
                          className="h-48 font-mono"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                          ავტომატურად დაკორექტირდება ფორმატზე: 995XXXXXXXXX
                      </p>
                  </div>

                  <div>
                      <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-slate-700">
                              შეტყობინება
                          </label>
                          <div className="w-1/2">
                              <select 
                                  className="w-full p-1 text-xs border border-slate-300 rounded outline-none bg-slate-50"
                                  value={selectedTemplateId}
                                  onChange={(e) => handleTemplateChange(e.target.value)}
                              >
                                  <option value="">შაბლონის არჩევა...</option>
                                  {templates.map(t => (
                                      <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                              </select>
                          </div>
                      </div>
                      <Textarea 
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="აკრიფეთ ტექსტი..."
                          className="h-32"
                      />
                      <div className="flex justify-between items-center mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                          <div className="flex items-center gap-2">
                              <Calculator className="h-3 w-3" />
                              <span>სიმბოლო: {segments.count}</span>
                              <span className="text-slate-300">|</span>
                              <span>SMS რაოდენობა: {segments.segments}</span>
                              <span className="text-slate-300">|</span>
                              <span>Encoding: {segments.encoding}</span>
                          </div>
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                          გაგზავნის დრო (არასავალდებულო)
                      </label>
                      <Input 
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                      />
                  </div>

                  <Button onClick={handleSend} disabled={sending} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      {sending ? 'იგზავნება...' : 'გაგზავნა'}
                  </Button>

              </div>

              <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                      <h4 className="font-bold mb-2">ინსტრუქცია</h4>
                      <ul className="list-disc list-inside space-y-1">
                          <li>ნომრები შეიყვანეთ სათითაოდ ახალ ხაზზე</li>
                          <li>ფორმატი 995-ით ან მის გარეშე</li>
                          <li>ქართული ტექსტი (Unicode) = 70 სიმბოლო/SMS</li>
                          <li>ლათინური (GSM) = 160 სიმბოლო/SMS</li>
                      </ul>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SMSSending;