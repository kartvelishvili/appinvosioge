import React from 'react';
import ManualGenerateInvoiceModal from './ManualGenerateInvoiceModal';

const ReplaceInvoiceModal = ({ isOpen, onClose, invoice, onSubmit }) => {
    return (
        <ManualGenerateInvoiceModal 
            isOpen={isOpen} 
            onClose={onClose} 
            initialData={invoice} // Pass existing data to prefill form
            onSubmit={onSubmit}
        />
    );
};

export default ReplaceInvoiceModal;