import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash, Edit2, Save, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const SMSTemplates = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
      name: '',
      content: '',
  });

  const AVAILABLE_VARIABLES = [
      '[CLIENT_NAME]', 
      '[INVOICE_NUMBER]', 
      '[BANK_ACCOUNT]', 
      '[INVOICE_LINK]', 
      '[AMOUNT]', 
      '[DUE_DATE]'
  ];

  useEffect(() => {
      fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
      try {
          const { data, error } = await supabase
              .from('sms_templates')
              .select('*')
              .order('created_at', { ascending: false });
          
          if (error) throw error;
          setTemplates(data || []);
      } catch (error) {
          toast({ variant: "destructive", title: "შეცდომა", description: error.message });
      } finally {
          setLoading(false);
      }
  };

  const handleSubmit = async () => {
      if (!formData.name || !formData.content) {
          toast({ variant: "destructive", title: "შეცდომა", description: "გთხოვთ შეავსოთ ყველა ველი" });
          return;
      }

      try {
          let error;
          if (editingId) {
              const { error: updateError } = await supabase
                  .from('sms_templates')
                  .update({
                      name: formData.name,
                      content: formData.content,
                      updated_at: new Date().toISOString()
                  })
                  .eq('id', editingId);
              error = updateError;
          } else {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("მომხმარებელი არ არის ავტორიზებული");
              const { error: insertError } = await supabase
                  .from('sms_templates')
                  .insert({
                      name: formData.name,
                      content: formData.content,
                      variables: AVAILABLE_VARIABLES.join(','),
                      user_id: user.id
                  });
              error = insertError;
          }

          if (error) throw error;

          toast({ title: "წარმატება", description: "შაბლონი შენახულია" });
          setIsDialogOpen(false);
          resetForm();
          fetchTemplates();
      } catch (error) {
          toast({ variant: "destructive", title: "შეცდომა", description: error.message });
      }
  };

  const handleDelete = async (id) => {
      if (!window.confirm('ნამდვილად გსურთ შაბლონის წაშლა?')) return;

      try {
          const { error } = await supabase.from('sms_templates').delete().eq('id', id);
          if (error) throw error;
          toast({ title: "წარმატება", description: "შაბლონი წაიშალა" });
          fetchTemplates();
      } catch (error) {
          toast({ variant: "destructive", title: "შეცდომა", description: error.message });
      }
  };

  const handleEdit = (template) => {
      setEditingId(template.id);
      setFormData({
          name: template.name,
          content: template.content
      });
      setIsDialogOpen(true);
  };

  const resetForm = () => {
      setEditingId(null);
      setFormData({ name: '', content: '' });
  };

  const insertVariable = (variable) => {
      setFormData(prev => ({
          ...prev,
          content: prev.content + (prev.content.endsWith(' ') ? '' : ' ') + variable
      }));
  };

  return (
    <>
      <Helmet>
        <title>SMS შაბლონები - Invoiso</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">SMS შაბლონები</h1>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> ახალი შაბლონი
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'შაბლონის რედაქტირება' : 'ახალი შაბლონი'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">დასახელება</label>
                            <Input 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="მაგ: გადახდის შეხსენება"
                            />
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">შინაარსი</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {AVAILABLE_VARIABLES.map(v => (
                                    <button 
                                        key={v}
                                        onClick={() => insertVariable(v)}
                                        className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors"
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                            <Textarea 
                                value={formData.content}
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                                placeholder="აკრიფეთ ტექსტი..."
                                rows={5}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                დააკლიკეთ ცვლადებს ზემოთ, რომ ჩაამატოთ ტექსტში
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>გაუქმება</Button>
                            <Button onClick={handleSubmit}>
                                <Save className="h-4 w-4 mr-2" /> შენახვა
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
          </div>

          {loading ? (
             <div className="flex justify-center py-12">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {templates.map(template => (
                     <div key={template.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col">
                         <div className="flex justify-between items-start mb-4">
                             <h3 className="font-bold text-lg text-slate-900">{template.name}</h3>
                             <div className="flex gap-2">
                                 <button onClick={() => handleEdit(template)} className="text-slate-400 hover:text-indigo-600 p-1">
                                     <Edit2 className="h-4 w-4" />
                                 </button>
                                 <button onClick={() => handleDelete(template.id)} className="text-slate-400 hover:text-red-600 p-1">
                                     <Trash className="h-4 w-4" />
                                 </button>
                             </div>
                         </div>
                         <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100 mb-4 flex-grow whitespace-pre-wrap">
                             {template.content}
                         </p>
                         <div className="text-xs text-slate-400 mt-auto pt-4 border-t border-slate-100">
                             ბოლო ცვლილება: {new Date(template.updated_at).toLocaleDateString('ka-GE')}
                         </div>
                     </div>
                 ))}
                 {templates.length === 0 && (
                     <div className="col-span-full text-center py-12 text-slate-500">
                         შაბლონები არ მოიძებნა. შექმენით ახალი შაბლონი.
                     </div>
                 )}
             </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SMSTemplates;