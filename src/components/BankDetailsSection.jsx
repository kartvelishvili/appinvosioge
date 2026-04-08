import React from 'react';
import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

const BankDetailsSection = ({ bankAccounts, className }) => {
  if (!bankAccounts || bankAccounts.length === 0) return null;

  // Filter out accounts that are hidden
  const visibleAccounts = bankAccounts.filter(b => b.show_in_invoice !== false);

  if (visibleAccounts.length === 0) return null;

  const getBankInfo = (bankId) => {
    const lowerId = (bankId || '').toLowerCase();
    if (lowerId.includes('tbc') || lowerId.includes('თიბისი')) {
      return {
        logo: 'https://i.postimg.cc/qMC1TTG1/logo-frame-tbc.webp',
        name: 'ს.ს "თიბისი ბანკი"',
        code: 'TBCBGE22'
      };
    } else if (lowerId.includes('bog') || lowerId.includes('საქართველოს') || lowerId.includes('national')) {
      return {
        logo: 'https://i.postimg.cc/JhQ7nSRj/logo-frame.webp',
        name: 'საქართველოს ბანკი',
        code: 'BAGAGE22'
      };
    }
    return { logo: null, name: bankId, code: '' };
  };

  return (
    <div className={cn("rounded-lg flex flex-col h-full", className)}>
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-200/60">
        <div className="p-1.5 bg-white rounded-md border border-blue-200 shadow-sm text-[#2563eb]">
            <Landmark className="h-4 w-4" />
        </div>
        <h3 className="text-[#1e3a8a] text-xs font-bold uppercase tracking-wide">საბანკო რეკვიზიტები</h3>
      </div>
      
      <div className="space-y-4 flex-grow flex flex-col">
        {visibleAccounts.map((bank, index) => {
          const info = getBankInfo(bank.bank_id);
          const displayCode = info.code || bank.swift_code || '';

          return (
            <div key={index} className="bg-[#f0f9ff] border-l-4 border-[#2563eb] rounded-r-lg p-3 flex items-center gap-4 shadow-sm print:shadow-none">
              {info.logo ? (
                <div className="w-[80px] flex-shrink-0 flex items-center justify-center bg-white p-1 rounded border border-blue-100 h-[60px]">
                  <img 
                    src={info.logo} 
                    alt={info.name} 
                    className="max-h-full max-w-full object-contain mix-blend-multiply" 
                  />
                </div>
              ) : (
                <div className="w-[80px] flex-shrink-0 flex items-center justify-center bg-white p-1 rounded border border-blue-100 h-[60px]">
                  <Landmark className="h-8 w-8 text-blue-300" />
                </div>
              )}
              
              <div className="flex-grow">
                <div className="text-[11px] text-slate-600 mb-0.5">
                  მიმღები ბანკი: <span className="font-bold text-[#1e3a8a]">{info.name}</span>
                </div>
                {displayCode && (
                  <div className="text-[11px] text-slate-600 mb-1.5">
                    ბანკის კოდი: <span className="font-bold text-[#1e3a8a]">{displayCode}</span>
                  </div>
                )}
                <div>
                  <p className="font-mono text-[#1e293b] text-xs bg-white px-2 py-1 rounded border border-blue-200 w-full font-bold tracking-tight shadow-sm print:shadow-none break-all">
                    {bank.account_number}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BankDetailsSection;