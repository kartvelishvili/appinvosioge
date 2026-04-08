import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const TransferInvoiceModal = ({ isOpen, onClose, invoice, onConfirm }) => {
    const [dueDate, setDueDate] = useState('');

    const handleConfirm = () => {
        if(!dueDate) return;
        onConfirm(dueDate);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>ინვოისის გადატანა</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-slate-600">
                        ინვოისი გადავა ძირითად ბაზაში სტატუსით "აქტიური" (Active / Unpaid).
                        გთხოვთ მიუთითოთ გადახდის ვადა.
                    </p>
                    <div>
                        <Label>გადახდის ვადა</Label>
                        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>გაუქმება</Button>
                    <Button onClick={handleConfirm} disabled={!dueDate} className="bg-green-600 hover:bg-green-700">დადასტურება</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TransferInvoiceModal;