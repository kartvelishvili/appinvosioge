import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash, Edit2, Save } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const EmailTemplates = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
      name: '',
      subject: '',
      content: '',
  });

  const AVAILABLE_VARIABLES = [
      '[CLIENT_NAME]', '[INVOICE_NUMBER]', '[BANK_ACCOUNT]', 
      '[INVOICE_LINK]', '[AMOUNT]', '[DUE_DATE]', '[COMPANY_NAME]'
  ];

  useEffect(() => {
      fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
      try {
          const { data, error } = await supabase
              .from('email_templates')
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
      if (!formData.name || !formData.content || !formData.subject) {
          toast({ variant: "destructive", title: "შეცდომა", description: "შეავსეთ ყველა ველი" });
          return;
      }

      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("მომხმარებელი არ არის ავტორიზებული");

          const payload = {
              name: formData.name,
              subject: formData.subject,
              content: formData.content,
              variables: AVAILABLE_VARIABLES.join(','),
              user_id: user.id,
              updated_at: new Date().toISOString()
          };

          let error;
          if (editingId) {
              const { error: updateError } = await supabase
                  .from('email_templates')
                  .update(payload)
                  .eq('id', editingId);
              error = updateError;
          } else {
              const { error: insertError } = await supabase
                  .from('email_templates')
                  .insert(payload);
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
      if (!window.confirm('ნამდვილად გსურთ წაშლა?')) return;
      const { error } = await supabase.from('email_templates').delete().eq('id', id);
      if (error) {
        toast({ variant: "destructive", title: "შეცდომა", description: error.message });
      } else {
        toast({ title: "წარმატება", description: "შაბლონი წაიშალა" });
        fetchTemplates();
      }
  };

  const handleEdit = (template) => {
      setEditingId(template.id);
      setFormData({
          name: template.name,
          subject: template.subject,
          content: template.content
      });
      setIsDialogOpen(true);
  };

  const resetForm = () => {
      setEditingId(null);
      setFormData({ name: '', subject: '', content: '' });
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
        <title>Email შაბლონები - Invoiso</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Email შაბლონები</h1>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> ახალი შაბლონი
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'რედაქტირება' : 'ახალი შაბლონი'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">დასახელება</label>
                                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">თემა (Subject)</label>
                                <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">შინაარსი (HTML)</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {AVAILABLE_VARIABLES.map(v => (
                                    <button key={v} onClick={() => insertVariable(v)} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 hover:bg-indigo-100">
                                        {v}
                                    </button>
                                ))}
                            </div>
                            <Textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} rows={10} className="font-mono" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>გაუქმება</Button>
                            <Button onClick={handleSubmit}><Save className="h-4 w-4 mr-2" /> შენახვა</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
          </div>

          {loading ? (
             <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {templates.map(tpl => (
                     <div key={tpl.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                         <div className="flex justify-between mb-2">
                             <h3 className="font-bold text-lg">{tpl.name}</h3>
                             <div className="flex gap-2">
                                 <button onClick={() => handleEdit(tpl)} className="text-slate-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></button>
                                 <button onClick={() => handleDelete(tpl.id)} className="text-slate-400 hover:text-red-600"><Trash className="h-4 w-4" /></button>
                             </div>
                         </div>
                         <p className="text-sm font-medium text-slate-700 mb-2">Subject: {tpl.subject}</p>
                         <div className="bg-slate-50 p-3 rounded border text-xs text-slate-500 h-24 overflow-hidden">
                             {tpl.content}
                         </div>
                     </div>
                 ))}
             </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmailTemplates;