
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Copy, FileText, Eye, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CreateContract = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState("editor");

  const [formData, setFormData] = useState({
    contract_number: '',
    client_id: '',
    amount: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    contract_template: `ხელშეკრულება № [CONTRACT_NUMBER]
ქ. თბილისი
[START_DATE]

[CLIENT_NAME] (ს/ნ [CLIENT_ID]), წარმოდგენილი მისი დირექტორის სახით (შემდგომში - „დამკვეთი“), ვდებთ წინამდებარე ხელშეკრულებას შემდეგზე:

1. ხელშეკრულების საგანი
1.1. დამკვეთი იღებს ვალდებულებას გადაიხადოს მომსახურების ღირებულება.
1.2. მომსახურების ღირებულება შეადგენს [AMOUNT] ლარს თვეში.

2. მხარეთა რეკვიზიტები და ხელმოწერები

დამკვეთი:
[CLIENT_NAME]
მისამართი: [CLIENT_ADDRESS]
ს/ნ: [CLIENT_ID]
ტელ: [CLIENT_PHONE]

[CLIENT_SIGNATURE]`
  });

  const placeholders = {
    client: [
      { code: '[CLIENT_NAME]', label: 'კლიენტის სახელი/კომპანია' },
      { code: '[CLIENT_ID]', label: 'კლიენტის ს/ნ' },
      { code: '[CLIENT_ADDRESS]', label: 'კლიენტის მისამართი' },
      { code: '[CLIENT_PHONE]', label: 'კლიენტის ტელეფონი' },
    ],
    general: [
      { code: '[CONTRACT_NUMBER]', label: 'კონტრაქტის ნომერი' },
      { code: '[START_DATE]', label: 'დაწყების თარიღი' },
      { code: '[END_DATE]', label: 'დასრულების თარიღი' },
      { code: '[AMOUNT]', label: 'თანხა' },
    ],
    signatures: [
      { code: '[CLIENT_SIGNATURE]', label: 'დამკვეთის ხელმოწერა' },
    ]
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, lastContractRes] = await Promise.all([
        supabase.from('clients').select('*').eq('status', 'active'),
        supabase.from('contracts').select('contract_number').order('created_at', { ascending: false }).limit(1)
      ]);
      
      setClients(clientsRes.data || []);

      let nextNum = 'CON-001';
      if (lastContractRes.data && lastContractRes.data.length > 0) {
        const lastNum = lastContractRes.data[0].contract_number;
        const numPart = parseInt(lastNum.split('-')[1]) + 1;
        nextNum = `CON-${String(numPart).padStart(3, '0')}`;
      }
      setFormData(prev => ({ ...prev, contract_number: nextNum }));

    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: "მონაცემების ჩატვირთვა ვერ მოხერხდა" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ description: "კოდი დაკოპირდა", duration: 1500 });
  };

  const getPreviewContent = () => {
    let content = formData.contract_template;
    const selectedClient = clients.find(c => c.id === formData.client_id) || {};

    const replacements = {
      '[CLIENT_NAME]': selectedClient.company || selectedClient.name || '[CLIENT_NAME]',
      '[CLIENT_ID]': selectedClient.company_id || '[CLIENT_ID]',
      '[CLIENT_ADDRESS]': selectedClient.address || '[CLIENT_ADDRESS]',
      '[CLIENT_PHONE]': selectedClient.phone || '[CLIENT_PHONE]',

      '[CONTRACT_NUMBER]': formData.contract_number,
      '[START_DATE]': new Date(formData.start_date).toLocaleDateString('ka-GE'),
      '[END_DATE]': formData.end_date ? new Date(formData.end_date).toLocaleDateString('ka-GE') : 'უვადო',
      '[AMOUNT]': formData.amount || '0',
      
      '[CLIENT_SIGNATURE]': '<div class="p-4 border-2 border-dashed border-slate-300 bg-slate-50 text-center text-slate-400 rounded my-2">დამკვეთის ხელმოწერა</div>',
    };

    Object.keys(replacements).forEach(key => {
      content = content.split(key).join(replacements[key]);
    });

    return content.replace(/\n/g, '<br/>');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.contract_template.includes('[CLIENT_SIGNATURE]')) {
        toast({
            variant: "destructive", 
            title: "ყურადღება", 
            description: "კონტრაქტში აუცილებლად უნდა იყოს ხელმოწერის ადგილები: [CLIENT_SIGNATURE]"
        });
        return;
    }

    setLoading(true);

    try {
      const payload = {
          contract_number: formData.contract_number,
          client_id: formData.client_id,
          amount: parseFloat(formData.amount),
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          description: formData.contract_template,
          status: 'draft'
      };

      const { data, error } = await supabase.from('contracts').insert([payload]).select().single();
      
      if (error) throw error;
      
      toast({ title: "წარმატება", description: "კონტრაქტი შეიქმნა" });
      navigate(`/contracts/${data.id}`);
    } catch (error) {
      toast({ variant: "destructive", title: "შეცდომა", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>ახალი კონტრაქტი - Invoiso</title></Helmet>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-8">
                <Button onClick={() => navigate('/contracts')} variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" /> უკან</Button>
                <h1 className="text-3xl font-bold text-slate-900">ახალი კონტრაქტი</h1>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold mb-4 text-slate-800">ძირითადი ინფორმაცია</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                             <div>
                                <Label htmlFor="contract_number">კონტრაქტის ნომერი</Label>
                                <Input id="contract_number" name="contract_number" value={formData.contract_number} onChange={handleChange} required />
                            </div>
                            <div>
                                <Label htmlFor="client_id">დამკვეთი</Label>
                                <select id="client_id" name="client_id" value={formData.client_id} onChange={handleChange} required className="w-full mt-1 px-3 py-2 border rounded-md">
                                    <option value="">აირჩიეთ...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="start_date">დაწყება (Start Date)</Label>
                                <Input type="date" id="start_date" name="start_date" value={formData.start_date} onChange={handleChange} required />
                            </div>
                            <div>
                                <Label htmlFor="end_date">დასრულება (End Date)</Label>
                                <Input type="date" id="end_date" name="end_date" value={formData.end_date} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="amount">თანხა (Amount)</Label>
                                <Input type="number" step="0.01" id="amount" name="amount" value={formData.amount} onChange={handleChange} placeholder="0.00" required />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                         <Tabs defaultValue="editor" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b">
                                <h2 className="text-lg font-semibold text-slate-800">კონტრაქტის ტექსტი</h2>
                                <TabsList>
                                    <TabsTrigger value="editor" className="flex items-center gap-2"><FileText className="h-4 w-4"/> რედაქტორი</TabsTrigger>
                                    <TabsTrigger value="preview" className="flex items-center gap-2"><Eye className="h-4 w-4"/> წინასწარი ნახვა</TabsTrigger>
                                </TabsList>
                            </div>
                            <TabsContent value="editor" className="p-0 m-0">
                                <Textarea 
                                    className="min-h-[500px] border-0 focus-visible:ring-0 rounded-none p-6 font-mono text-sm leading-relaxed resize-y"
                                    value={formData.contract_template}
                                    onChange={(e) => handleChange({ target: { name: 'contract_template', value: e.target.value } })}
                                    placeholder="ჩაწერეთ კონტრაქტის ტექსტი აქ..."
                                />
                            </TabsContent>
                            <TabsContent value="preview" className="p-6 m-0 bg-white min-h-[500px]">
                                <div 
                                    className="prose max-w-none font-sans text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-24">
                        <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold border-b pb-2">
                            <Copy className="h-4 w-4"/> ხელმისაწვდომი კოდები
                        </div>
                        
                        <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                             <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">მხარეები</h3>
                                <div className="space-y-1">
                                    {placeholders.client.map(item => (
                                        <button key={item.code} type="button" onClick={() => copyToClipboard(item.code)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex justify-between items-center group border border-transparent hover:border-slate-200">
                                            <span className="font-mono text-indigo-600 font-medium">{item.code}</span>
                                            <span className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                             <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">ზოგადი</h3>
                                <div className="space-y-1">
                                    {placeholders.general.map(item => (
                                        <button key={item.code} type="button" onClick={() => copyToClipboard(item.code)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex justify-between items-center group border border-transparent hover:border-slate-200">
                                            <span className="font-mono text-blue-600 font-medium">{item.code}</span>
                                            <span className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1 text-orange-600"><AlertTriangle className="h-3 w-3"/> ხელმოწერები (სავალდებულო)</h3>
                                <div className="space-y-1">
                                    {placeholders.signatures.map(item => (
                                        <button key={item.code} type="button" onClick={() => copyToClipboard(item.code)} className="w-full text-left px-2 py-2 text-xs bg-orange-50 hover:bg-orange-100 rounded flex justify-between items-center group border border-orange-200">
                                            <span className="font-mono text-orange-700 font-bold">{item.code}</span>
                                            <span className="text-orange-600 text-[10px]">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 mt-4 border-t">
                            <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                {loading ? 'იქმნება...' : <><Save className="h-4 w-4 mr-2" /> კონტრაქტის შექმნა</>}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default CreateContract;
