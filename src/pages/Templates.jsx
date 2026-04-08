import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Plus, Edit2, Trash2, Eye, MessageSquare, Mail } from 'lucide-react';
import TemplateModal from '@/components/TemplateModal';
import { format } from 'date-fns';

const TemplatesPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const [smsData, emailData] = await Promise.all([
        supabase.from('sms_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('email_templates').select('*').order('created_at', { ascending: false })
      ]);

      if (smsData.error) throw smsData.error;
      if (emailData.error) throw emailData.error;

      setSmsTemplates(smsData.data || []);
      setEmailTemplates(emailData.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: "შაბლონების ჩატვირთვა ვერ მოხერხდა",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("ნამდვილად გსურთ შაბლონის წაშლა?")) return;

    try {
      const table = type === 'sms' ? 'sms_templates' : 'email_templates';
      const { error } = await supabase.from(table).delete().eq('id', id);

      if (error) throw error;

      toast({
        title: "წარმატება",
        description: "შაბლონი წაიშალა",
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: "შაბლონის წაშლა ვერ მოხერხდა",
      });
    }
  };

  const handleEdit = (template, type) => {
    setEditingTemplate({ ...template, type });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const TemplatesTable = ({ templates, type }) => (
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-slate-100/50 data-[state=selected]:bg-slate-100">
              <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">სახელი</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">შექმნის თარიღი</th>
              <th className="h-12 px-4 text-right align-middle font-medium text-slate-500">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {templates.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-500">
                  შაბლონები არ მოიძებნა
                </td>
              </tr>
            ) : (
              templates.map((template) => (
                <tr key={template.id} className="border-b transition-colors hover:bg-slate-50/50">
                  <td className="p-4 align-middle font-medium">{template.name}</td>
                  <td className="p-4 align-middle text-slate-500">
                    {template.created_at ? format(new Date(template.created_at), 'dd.MM.yyyy') : '-'}
                  </td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template, type)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id, type)}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <>
      <Card className="border-slate-200 shadow-lg bg-white/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>შაბლონები</CardTitle>
            <CardDescription>
              SMS და Email შაბლონების მართვა
            </CardDescription>
          </div>
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            ახალი შაბლონი
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sms" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                SMS შაბლონები
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email შაბლონები
              </TabsTrigger>
            </TabsList>
            <TabsContent value="sms">
              <TemplatesTable templates={smsTemplates} type="sms" />
            </TabsContent>
            <TabsContent value="email">
              <TemplatesTable templates={emailTemplates} type="email" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={editingTemplate}
        onSuccess={fetchTemplates}
      />
    </>
  );
};

export default TemplatesPage;