import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const BatchGenerateModal = ({ isOpen, onClose, selectedCount, onConfirm, generating }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>მასიური გენერაცია</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-slate-600">
                        ნამდვილად გსურთ <span className="font-bold text-indigo-600">{selectedCount}</span> ინვოისის საფუძველზე ახალი პერიოდის გენერირება?
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                        თითოეული ინვოისისთვის შეიქმნება ახალი ჩანაწერი "აუტო ინვოისებში" მომდევნო თვის პერიოდით.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>გაუქმება</Button>
                    <Button onClick={onConfirm} disabled={generating} className="bg-indigo-600 hover:bg-indigo-700">
                        {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        გენერირება
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BatchGenerateModal;