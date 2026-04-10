
import React from 'react';
import { Eye, Download, Edit, Building2, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatDateDDMMYYYY } from '@/utils/formatDate';

const InvoiceCard = ({ invoice, onDownload, isDownloading }) => {
  const navigate = useNavigate();
  const isPaid = invoice.payment_status === 'paid';
  
  // Extract primary bank for display
  let primaryBank = 'სხვა / უცნობი';
  if (invoice.bank_accounts_settings && invoice.bank_accounts_settings.length > 0) {
      const bankId = invoice.bank_accounts_settings[0].bank_id?.toLowerCase() || '';
      if (bankId.includes('tbc') || bankId.includes('თიბისი')) {
          primaryBank = 'TBC ბანკი';
      } else if (bankId.includes('bog') || bankId.includes('საქართველოს') || bankId.includes('national')) {
          primaryBank = 'საქართველოს ბანკი';
      } else {
          primaryBank = invoice.bank_accounts_settings[0].bank_id || 'სხვა';
      }
  }

  const clientName = invoice.clients?.company || invoice.clients?.name || 'უცნობი კლიენტი';

  return (
    <div className="relative bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl p-5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden group">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="h-4 w-4 text-indigo-500" />
            <h3 className="font-mono font-bold text-lg text-slate-800">{invoice.invoice_number}</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="h-3 w-3" />
            {formatDateDDMMYYYY(invoice.invoice_date || invoice.created_at)}
          </div>
        </div>
        
        {/* Status Badge */}
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border ${
          isPaid 
            ? 'bg-green-100 text-green-700 border-green-200' 
            : 'bg-red-100 text-red-700 border-red-200'
        }`}>
          {isPaid ? 'გადახდილი' : 'გადაუხდელი'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-grow space-y-3 relative z-10">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">კლიენტი</p>
          <p className="text-sm font-medium text-slate-700 truncate">{clientName}</p>
        </div>
        
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">ჯამი</p>
          <p className="text-xl font-bold text-indigo-700 font-mono">
            {Number(invoice.amount).toFixed(2)} <span className="text-sm text-indigo-500 font-sans">{invoice.currency}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-100">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span className="truncate">{primaryBank}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2 mt-5 relative z-10 pt-4 border-t border-slate-100">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200 h-9"
          onClick={() => navigate(`/invoices/${invoice.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" />
          ნახვა
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-slate-600 hover:text-green-600 hover:bg-green-50 border-slate-200 h-9"
          onClick={(e) => {
            e.stopPropagation();
            onDownload(invoice);
          }}
          disabled={isDownloading}
        >
          <Download className={`h-4 w-4 mr-1 ${isDownloading ? 'animate-bounce' : ''}`} />
          PDF
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-slate-600 hover:text-orange-600 hover:bg-orange-50 border-slate-200 h-9"
          onClick={() => navigate(`/invoices/${invoice.id}?edit=true`)}
        >
          <Edit className="h-4 w-4 mr-1" />
          რედაქტირება
        </Button>
      </div>
    </div>
  );
};

export default InvoiceCard;
