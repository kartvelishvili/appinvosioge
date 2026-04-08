import { supabase } from '@/lib/customSupabaseClient';

export const generateInvoiceId = async () => {
  // Format: IN# + 7 random digits
  const length = 7;
  let isUnique = false;
  let newId = '';

  // Safety break counter
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    attempts++;
    let randomDigits = '';
    for (let i = 0; i < length; i++) {
      randomDigits += Math.floor(Math.random() * 10).toString();
    }
    newId = `IN#${randomDigits}`;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('invoice_number', newId)
        .maybeSingle();

      if (error) {
        console.error('Error checking invoice ID uniqueness:', error);
        break; 
      }

      if (!data) {
        isUnique = true;
      }
    } catch (err) {
      console.error('Unexpected error checking invoice ID:', err);
      break;
    }
  }

  if (!isUnique) {
    // Fallback if loop fails, though unlikely with 7 digits
    const timestamp = Date.now().toString().slice(-7);
    return `IN#${timestamp}`;
  }

  return newId;
};

export const isBoostInvoice = (invoice) => {
  return !!(invoice?.boost_data);
};

export const getBoostSectionAmount = (boostData) => {
  // Extract "გაწეული სამუშაოს ანაზღაურება" (Work Compensation)
  return parseFloat(boostData?.workCompensation || 0);
};

export const getRevenueAmount = (invoice) => {
  if (isBoostInvoice(invoice)) {
    return getBoostSectionAmount(invoice.boost_data);
  }
  return parseFloat(invoice.total_amount || 0);
};