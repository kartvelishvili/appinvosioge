import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCompanyBoost } from '@/hooks/useCompanyBoost';

const OutstandingBalanceSection = ({ invoices }) => {
  const { boostEnabled } = useCompanyBoost();
  const now = new Date();
  
  // Calculations
  const totalOutstanding = invoices.reduce((sum, inv) => {
    const total = parseFloat(inv.total_amount);
    const paid = parseFloat(inv.paid_amount || 0);
    
    if (boostEnabled) {
        return sum + (total - paid);
    } else {
        // Without boost, treat partial as unpaid or ignore paid_amount if not fully paid
        return sum + (paid >= total ? 0 : total);
    }
  }, 0);

  const overdueAmount = invoices.reduce((sum, inv) => {
    const dueDate = new Date(inv.due_date);
    const total = parseFloat(inv.total_amount);
    const paid = parseFloat(inv.paid_amount || 0);
    let remaining = 0;

    if (boostEnabled) {
        remaining = total - paid;
    } else {
        remaining = paid >= total ? 0 : total;
    }

    if (remaining > 0 && dueDate < now) {
      return sum + remaining;
    }
    return sum;
  }, 0);

  const dueSoonAmount = invoices.reduce((sum, inv) => {
    const dueDate = new Date(inv.due_date);
    const total = parseFloat(inv.total_amount);
    const paid = parseFloat(inv.paid_amount || 0);
    let remaining = 0;

    if (boostEnabled) {
        remaining = total - paid;
    } else {
        remaining = paid >= total ? 0 : total;
    }

    const diffTime = Math.abs(dueDate - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Consider "Soon" as within next 7 days and NOT overdue
    if (remaining > 0 && dueDate >= now && diffDays <= 7) {
      return sum + remaining;
    }
    return sum;
  }, 0);

  if (totalOutstanding === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-white border-red-100 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-sm font-semibold text-red-800">სულ დავალიანება</h3>
            </div>
            <p className="text-2xl font-bold text-red-700">
              {totalOutstanding.toLocaleString()} ₾
            </p>
            <p className="text-xs text-red-500 mt-1">
              ჯამური გადასახდელი თანხა
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <h3 className="text-sm font-semibold text-orange-800">ვადაგადაცილებული</h3>
            </div>
            <p className="text-2xl font-bold text-orange-700">
              {overdueAmount.toLocaleString()} ₾
            </p>
            <p className="text-xs text-orange-500 mt-1">
              თანხა, რომლის გადახდის ვადა გავიდა
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-800">უახლოეს 7 დღეში</h3>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {dueSoonAmount.toLocaleString()} ₾
            </p>
            <p className="text-xs text-blue-500 mt-1">
              მომავალი ვალდებულებები
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default OutstandingBalanceSection;