import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight } from 'lucide-react';

const InvoiceTransferModal = ({ isOpen, onClose, invoice, onConfirm }) => {
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        await onConfirm(dueDate);
        setLoading(false);
    };

    if (!invoice) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-green-600" />
                        ინვოისის გააქტიურება
                    </DialogTitle>
                    <DialogDescription>
                        ინვოისი <strong>{invoice.clients?.company_name}</strong>-სთვის გადავა აქტიურ სტატუსში.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="due-date">გადახდის ვადა</Label>
                        <Input 
                            id="due-date" 
                            type="date" 
                            value={dueDate} 
                            onChange={(e) => setDueDate(e.target.value)} 
                        />
                        <p className="text-[10px] text-slate-400">თუ არ მიუთითებთ, ავტომატურად განისაზღვრება +5 დღე</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>გაუქმება</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        გადატანა
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default InvoiceTransferModal;