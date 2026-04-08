
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar as CalendarIcon, Loader2, Save, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/customSupabaseClient';
import { useOneTimeInvoices } from '@/hooks/useOneTimeInvoices';

const OneTimeInvoiceForm = ({ isOpen, onClose, invoiceToEdit = null, onSuccess }) => {
  const [clients, setClients] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const { createOneTimeInvoice, updateOneTimeInvoice, calculateProportionalAmount, loading } = useOneTimeInvoices();
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      client_id: '',
      performer_id: '',
      service_description: '',
      full_amount: '',
      service_period_start: '',
      service_period_end: '',
      calculated_amount: '',
      status: 'unpaid'
    }
  });

  const fullAmount = watch('full_amount');
  const startDate = watch('service_period_start');
  const endDate = watch('service_period_end');

  // Auto-calculate logic
  useEffect(() => {
    if (fullAmount && startDate && endDate) {
      const calculated = calculateProportionalAmount(fullAmount, startDate, endDate);
      setValue('calculated_amount', calculated);
    }
  }, [fullAmount, startDate, endDate, setValue, calculateProportionalAmount]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (invoiceToEdit) {
        reset({
          ...invoiceToEdit,
          performer_id: invoiceToEdit.performer_id || invoiceToEdit.contractor_id || ''
        });
      } else {
        reset({
          client_id: '',
          performer_id: '',
          service_description: '',
          full_amount: '',
          service_period_start: new Date().toISOString().split('T')[0],
          service_period_end: new Date().toISOString().split('T')[0],
          calculated_amount: '',
          status: 'unpaid'
        });
      }
    }
  }, [isOpen, invoiceToEdit, reset]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [clientsRes, performersRes] = await Promise.all([
        supabase.from('clients').select('id, name, company, logo_url').order('company'),
        supabase.from('performers').select('id, name, logo_url').order('name')
      ]);

      setClients(clientsRes.data || []);
      setPerformers(performersRes.data || []);
    } catch (error) {
      console.error('Error fetching form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("მომხმარებელი არ არის ავტორიზებული");

      if (invoiceToEdit) {
        await updateOneTimeInvoice(invoiceToEdit.id, data);
      } else {
        await createOneTimeInvoice({ ...data, user_id: user.id });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
            {invoiceToEdit ? 'რედაქტირება' : 'ახალი ერთჯერადი ინვოისი'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>კლიენტი</Label>
              <Select 
                onValueChange={(val) => setValue('client_id', val)} 
                defaultValue={invoiceToEdit?.client_id}
              >
                <SelectTrigger className={errors.client_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="აირჩიეთ კლიენტი" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        {client.logo_url ? (
                          <img src={client.logo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <Building2 className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{client.company || client.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...register('client_id', { required: true })} />
              {errors.client_id && <span className="text-xs text-red-500">კლიენტი სავალდებულოა</span>}
            </div>

            <div className="space-y-2">
              <Label>შემსრულებელი (კონტრაქტორი)</Label>
              <Select 
                onValueChange={(val) => setValue('performer_id', val)} 
                defaultValue={invoiceToEdit?.performer_id || invoiceToEdit?.contractor_id}
              >
                <SelectTrigger className={errors.performer_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="აირჩიეთ შემსრულებელი" />
                </SelectTrigger>
                <SelectContent>
                  {performers.map(performer => (
                    <SelectItem key={performer.id} value={performer.id}>
                      <div className="flex items-center gap-2">
                        {performer.logo_url ? (
                          <img src={performer.logo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{performer.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...register('performer_id', { required: true })} />
              {errors.performer_id && <span className="text-xs text-red-500">შემსრულებელი სავალდებულოა</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>სერვისის აღწერა</Label>
            <Textarea 
              {...register('service_description', { required: true })}
              placeholder="მაგ: დამატებითი საკონსულტაციო მომსახურება..."
              className={errors.service_description ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.service_description && <span className="text-xs text-red-500">აღწერა სავალდებულოა</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>სერვისის დაწყება</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input 
                  type="date" 
                  {...register('service_period_start', { required: true })}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>სერვისის დასრულება</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input 
                  type="date" 
                  {...register('service_period_end', { required: true })}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>სრული თანხა (₾)</Label>
              <Input 
                type="number" 
                step="0.01"
                {...register('full_amount', { required: true, min: 0 })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-indigo-600">კალკულირებული თანხა (₾)</Label>
              <Input 
                type="number" 
                step="0.01"
                {...register('calculated_amount', { required: true, min: 0 })}
                className="border-indigo-200 bg-indigo-50 font-bold text-indigo-700"
              />
              <p className="text-[10px] text-slate-500">ავტომატურად დათვლილია პერიოდის მიხედვით</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              გაუქმება
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              შენახვა
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OneTimeInvoiceForm;
