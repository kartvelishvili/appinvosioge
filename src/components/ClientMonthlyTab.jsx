import React from 'react';
import { getMonthColor } from '@/utils/dateUtils';
import { Card, CardContent } from '@/components/ui/card';
import { useCompanyBoost } from '@/hooks/useCompanyBoost';

const ClientMonthlyTab = ({ invoices }) => {
  const { boostEnabled } = useCompanyBoost();

  // Group invoices by Month Year
  const monthlyData = invoices.reduce((acc, invoice) => {
    const date = new Date(invoice.invoice_date || invoice.created_at);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!acc[key]) {
      acc[key] = {
        date: date,
        monthIndex: date.getMonth() + 1,
        totalAmount: 0,
        paidAmount: 0,
        count: 0,
        invoices: []
      };
    }
    
    const amount = parseFloat(invoice.total_amount);
    const paid = parseFloat(invoice.paid_amount || 0);

    acc[key].totalAmount += amount;
    
    // Only count paidAmount if boost enabled or fully paid if not
    if (boostEnabled) {
        acc[key].paidAmount += paid;
    } else {
        if (paid >= amount) acc[key].paidAmount += amount;
    }

    acc[key].count += 1;
    acc[key].invoices.push(invoice);
    
    return acc;
  }, {});

  const sortedKeys = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a)); // Newest first

  if (sortedKeys.length === 0) {
     return <div className="text-center py-12 text-slate-500">მონაცემები არ მოიძებნა</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {sortedKeys.map(key => {
            const data = monthlyData[key];
            const monthName = data.date.toLocaleString('default', { month: 'long', year: 'numeric' });
            const isFullyPaid = data.paidAmount >= data.totalAmount;
            const progress = data.totalAmount > 0 ? (data.paidAmount / data.totalAmount) * 100 : 0;
            const color = getMonthColor(data.monthIndex);
            
            return (
                <Card key={key} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div 
                        className="h-2 w-full"
                        style={{ backgroundColor: color }}
                    />
                    <CardContent className="pt-5">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold capitalize text-slate-800">
                                {monthName}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                isFullyPaid ? 'bg-green-100 text-green-800' : 
                                (boostEnabled && progress > 0) ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {isFullyPaid ? 'დაფარული' : (boostEnabled && progress > 0) ? 'ნაწილობრივ' : 'გადასახდელი'}
                            </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">სულ დარიცხული:</span>
                                <span className="font-bold text-slate-900">{data.totalAmount.toLocaleString()} ₾</span>
                            </div>
                            
                            {boostEnabled && (
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-2">
                                    <div className="bg-green-500 h-full" style={{ width: `${progress}%` }}></div>
                                </div>
                            )}

                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">გადახდილი:</span>
                                <span className="font-medium text-green-600">{data.paidAmount.toLocaleString()} ₾</span>
                            </div>
                            
                            {!isFullyPaid && boostEnabled && (
                                <div className="flex justify-between text-sm border-t border-slate-100 pt-2 mt-2">
                                    <span className="text-slate-500">დავალიანება:</span>
                                    <span className="font-bold text-red-600">{(data.totalAmount - data.paidAmount).toLocaleString()} ₾</span>
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-slate-400">
                            {data.count} ინვოისი
                        </div>
                    </CardContent>
                </Card>
            );
         })}
      </div>
    </div>
  );
};

export default ClientMonthlyTab;