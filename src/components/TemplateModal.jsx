
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Save } from 'lucide-react';

const TemplateModal = ({ isOpen, onClose, template, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'sms',
    name: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    if (template) {
      setFormData({
        type: template.type || 'sms',
        name: template.name || '',
        subject: template.subject || '',
        body: template.body || ''
      });
    } else {
      setFormData({
        type: 'sms',
        name: '',
        subject: '',
        body: ''
      });
    }
  }, [template, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.body || (formData.type === 'email' && !formData.subject)) {
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: "შეავსეთ ყველა სავალდებულო ველი",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("მომხმარებელი არ არის ავტორიზებული");

      const table = formData.type === 'sms' ? 'sms_templates' : 'email_templates';
      
      const payload = {
        user_id: user.id,
        name: formData.name,
        body: formData.body,
        updated_at: new Date().toISOString()
      };

      if (formData.type === 'email') {
        payload.subject = formData.subject;
      }

      let error;
      if (template) {
        const { error: updateError } = await supabase
          .from(table)
          .update(payload)
          .eq('id', template.id);
        error = updateError;
      } else {
        payload.created_at = new Date().toISOString();
        const { error: insertError } = await supabase
          .from(table)
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "წარმატება",
        description: template ? "შაბლონი განახლდა" : "შაბლონი დაემატა",
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: error.message || "შაბლონის შენახვა ვერ მოხერხდა",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{template ? 'შაბლონის რედაქტირება' : 'ახალი შაბლონი'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {!template && (
            <div className="space-y-2">
              <Label>შაბლონის ტიპი</Label>
              <Select 
                value={formData.type} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="აირჩიეთ ტიპი" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>შაბლონის სახელი (მაგ: დაგვიანების შეხსენება)</Label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="შეიყვანეთ სახელი"
            />
          </div>

          {formData.type === 'email' && (
            <div className="space-y-2">
              <Label>თემა (Subject)</Label>
              <Input 
                value={formData.subject} 
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="ელ-ფოსტის თემა"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>შინაარსი (ტექსტი)</Label>
            <Textarea 
              value={formData.body} 
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              placeholder="შეტყობინების ტექსტი..."
              className="min-h-[150px] resize-none"
            />
            <p className="text-xs text-slate-500">
              შეგიძლიათ გამოიყენოთ ცვლადები: {'{{client_name}}'}, {'{{invoice_number}}'}, {'{{amount}}'}, {'{{due_date}}'}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              გაუქმება
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              შენახვა
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateModal;
