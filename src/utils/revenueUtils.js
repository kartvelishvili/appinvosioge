
import { differenceInDays, endOfMonth, startOfMonth, eachMonthOfInterval, max, min, format, isSameMonth } from 'date-fns';
import { ka } from 'date-fns/locale';
import { getRevenueAmount } from '@/utils/invoiceUtils';

export const calculateProportionalRevenue = (invoices, oneTimeInvoices = []) => {
  const revenueByMonth = {};

  // Process Regular Invoices
  invoices.forEach(invoice => {
    // Use the revenue calculation helper
    const amount = getRevenueAmount(invoice);
    const isPaid = invoice.payment_status === 'paid';
    
    // Fallback to created_at if service period is missing
    let start = invoice.service_period_start ? new Date(invoice.service_period_start) : new Date(invoice.created_at);
    let end = invoice.service_period_end ? new Date(invoice.service_period_end) : start;

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        start = new Date(invoice.created_at);
        end = start;
    }
    
    // Ensure end is not before start
    if (end < start) end = start;

    const totalDays = differenceInDays(end, start) + 1;
    const months = eachMonthOfInterval({ start, end });

    months.forEach(monthDate => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // Calculate overlap
      const overlapStart = max([start, monthStart]);
      const overlapEnd = min([end, monthEnd]);
      
      const daysInMonth = differenceInDays(overlapEnd, overlapStart) + 1;
      
      if (daysInMonth > 0) {
        // Key format: "MM-YYYY" e.g., "01-2024"
        const monthKey = format(monthDate, 'MM-yyyy'); 
        const proportionalAmount = (daysInMonth / totalDays) * amount;

        if (!revenueByMonth[monthKey]) {
          revenueByMonth[monthKey] = {
            id: monthKey,
            month: monthDate.getMonth(),
            year: monthDate.getFullYear(),
            monthName: format(monthDate, 'LLLL', { locale: ka }),
            totalAmount: 0,
            paidAmount: 0,
            unpaidAmount: 0,
            oneTimeAmount: 0, // Track separately
            recurringAmount: 0, // Track separately
            dateObj: monthDate,
            invoices: [] 
          };
        }

        revenueByMonth[monthKey].totalAmount += proportionalAmount;
        revenueByMonth[monthKey].recurringAmount += proportionalAmount;

        if (isPaid) {
          revenueByMonth[monthKey].paidAmount += proportionalAmount;
        } else {
          revenueByMonth[monthKey].unpaidAmount += proportionalAmount;
        }
        
        revenueByMonth[monthKey].invoices.push({
            ...invoice,
            allocated_amount: proportionalAmount,
            days_in_month: daysInMonth,
            type: 'recurring'
        });
      }
    });
  });

  // Process One-Time Invoices
  oneTimeInvoices.forEach(invoice => {
      const amount = parseFloat(invoice.calculated_amount) || 0;
      const isPaid = invoice.status === 'paid';
      const date = new Date(invoice.created_at); // Use creation date for revenue recognition usually, or start date
      
      if (isNaN(date.getTime())) return;
      
      const monthKey = format(date, 'MM-yyyy');

      if (!revenueByMonth[monthKey]) {
          revenueByMonth[monthKey] = {
            id: monthKey,
            month: date.getMonth(),
            year: date.getFullYear(),
            monthName: format(date, 'LLLL', { locale: ka }),
            totalAmount: 0,
            paidAmount: 0,
            unpaidAmount: 0,
            oneTimeAmount: 0,
            recurringAmount: 0,
            dateObj: date,
            invoices: [] 
          };
      }

      revenueByMonth[monthKey].totalAmount += amount;
      revenueByMonth[monthKey].oneTimeAmount += amount;

      if (isPaid) {
          revenueByMonth[monthKey].paidAmount += amount;
      } else {
          revenueByMonth[monthKey].unpaidAmount += amount;
      }

      revenueByMonth[monthKey].invoices.push({
          ...invoice,
          allocated_amount: amount,
          type: 'one-time'
      });
  });

  return Object.values(revenueByMonth).sort((a, b) => b.dateObj - a.dateObj);
};
