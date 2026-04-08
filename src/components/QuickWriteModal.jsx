import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QuickWriteForm from './QuickWriteForm';
import { PenTool } from 'lucide-react';

const QuickWriteModal = ({ isOpen, onClose, onSuccess }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white rounded-xl shadow-2xl border-0">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <PenTool className="h-5 w-5 text-indigo-600" />
                        </div>
                        სწრაფი წერა
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    <QuickWriteForm onSuccess={onSuccess} onCancel={onClose} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default QuickWriteModal;