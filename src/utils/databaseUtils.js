
export const calculateInvoiceAmounts = (items, taxRate = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price) || 0), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };
  
  export const generateInvoiceNumber = (userProfile) => {
    const prefix = userProfile?.invoice_prefix || 'INV';
    const counter = userProfile?.invoice_counter || 1000;
    return `${prefix}-${counter}`;
  };
  
  export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  export const calculateDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const now = new Date();
    const due = new Date(dueDate);
    if (now <= due) return 0;
    const diffTime = Math.abs(now - due);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  export const getInvoiceStatus = (invoice) => {
    if (invoice.is_draft) return 'draft';
    if (invoice.payment_status === 'paid') return 'paid';
    
    const daysOverdue = calculateDaysOverdue(invoice.due_date);
    if (daysOverdue > 0) return 'overdue';
    
    if (invoice.sent_date) return 'sent';
    
    return 'pending';
  };
  
  export const validateInvoiceData = (invoiceData) => {
    const errors = [];
    if (!invoiceData.client_id) errors.push('Client is required');
    if (!invoiceData.due_date) errors.push('Due date is required');
    return errors;
  };
  
  export const validateClientData = (clientData) => {
    const errors = [];
    if (!clientData.name && !clientData.company) errors.push('Name or Company is required');
    if (!clientData.email) errors.push('Email is required');
    return errors;
  };
  
  export const validatePerformerData = (performerData) => {
    const errors = [];
    if (!performerData.name) errors.push('Name is required');
    return errors;
  };
  
  export const validateInvoiceItem = (item) => {
    const errors = [];
    if (!item.description) errors.push('Description is required');
    if (parseFloat(item.quantity) <= 0) errors.push('Quantity must be positive');
    if (parseFloat(item.unit_price) < 0) errors.push('Unit price cannot be negative');
    return errors;
  };
