
import React from 'react';
import { FileText, Phone } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { formatDateDDMMYYYY } from '@/utils/formatDate';
import BankDetailsSection from '@/components/BankDetailsSection';
import ContractorFooterSection from '@/components/ContractorFooterSection';

const InvoiceTemplate = ({
  invoice,
  items,
  innerRef,
  showClientPhone,
  showSignature
}) => {
  if (!invoice) return null;
  const {
    clients: client,
    performers: performer,
    contracts: contract,
    subtotal,
    tax_amount,
    total,
    tax_rate
  } = invoice;

  const signatureUrl = contract?.performer_signature_url || performer?.signature_url;
  const formattedTotalAmount = (total || 0).toFixed(2);
  const issueDate = invoice.invoice_date || invoice.created_at;
  const dueDate = invoice.due_date;

  const formatDateGE = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const publicInvoiceUrl = `${window.location.origin}/invoices/${invoice.id}/public`;
  
  // Use performer bank account string if settings JSON isn't available
  const bankAccounts = performer?.bank_account ? [{ bank_id: 'ბანკი', account_number: performer.bank_account }] : [];

  return (
    <div 
      ref={innerRef} 
      className="bg-white max-w-[210mm] mx-auto text-[#1e293b] font-sans shadow-none flex flex-col relative invoice-template-container print:m-0 print:border-none print:shadow-none" 
      style={{ minHeight: '297mm', position: 'relative' }} 
    >
      <div className="bg-[#f0f9ff] border-b-2 border-[#2563eb] px-8 py-5 print:bg-[#f0f9ff] print:border-[#2563eb]" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
          <div className="flex justify-between items-center">
              <div className="w-1/3 flex justify-start">
                   <div className="w-[80px] h-[80px] rounded-full border-2 border-white bg-white shadow-sm flex items-center justify-center overflow-hidden p-1">
                        {performer?.logo_url ? (
                            <img src={performer.logo_url} alt="Logo" className="w-full h-full object-cover rounded-full mix-blend-multiply" crossOrigin="anonymous" />
                        ) : (
                            <span className="text-[#2563eb] font-bold text-xs">LOGO</span>
                        )}
                   </div>
              </div>
              <div className="w-1/3 flex flex-col items-center justify-center">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-blue-100">
                      <QRCodeCanvas value={publicInvoiceUrl} size={84} level="H" fgColor="#1e3a8a" bgColor="#ffffff" />
                  </div>
              </div>
              <div className="w-1/3 flex flex-col items-end text-right">
                   <h2 className="font-bold text-[#1e3a8a] text-lg uppercase leading-tight mb-1">{performer?.name}</h2>
                   {performer?.tax_id && (
                       <p className="text-xs text-slate-500 font-mono mb-1">
                           <span className="font-semibold text-blue-900/60 mr-1">ს/ნ:</span>
                           {performer.tax_id}
                       </p>
                   )}
                   <div className="text-[10px] text-slate-600 space-y-0.5">
                       {performer?.phone && <p>{performer.phone}</p>}
                       {performer?.email && <p>{performer.email}</p>}
                   </div>
              </div>
          </div>
      </div>

      <div className="px-8 py-6 flex-grow flex flex-col h-full">
        <div className="flex justify-between items-end mb-8 border-b border-dashed border-slate-200 pb-4">
             <div>
                 <h1 className="text-4xl font-black text-[#1e3a8a] uppercase tracking-tighter leading-none mb-1">ინვოისი</h1>
                 <p className="text-slate-400 font-mono text-sm font-medium pl-0.5">#{invoice.invoice_number}</p>
             </div>
             <div className="flex gap-6">
                 <div className="flex flex-col items-end">
                     <span className="text-[10px] uppercase font-bold text-blue-400 mb-0.5">გამოცემის თარიღი</span>
                     <span className="font-bold text-[#1e293b] font-mono">{formatDateGE(issueDate)}</span>
                 </div>
                 <div className="flex flex-col items-end">
                     <span className="text-[10px] uppercase font-bold text-blue-400 mb-0.5">გადახდის ვადა</span>
                     <span className="font-bold text-[#1e293b] font-mono">{formatDateGE(dueDate)}</span>
                 </div>
             </div>
        </div>

        <div className="mb-6">
             <h3 className="text-[#2563eb] font-bold uppercase text-[11px] mb-2 tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#2563eb] rounded-full inline-block"></span>
                მიმღები (დამკვეთი)
             </h3>
             <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex justify-between items-start" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                  <div>
                      <p className="font-bold text-[#1e3a8a] text-lg mb-1">{client?.company || client?.name}</p>
                      <p className="text-xs text-slate-600 max-w-[300px] leading-relaxed">{client?.address}</p>
                  </div>
                  <div className="text-right text-xs space-y-1">
                      <p><span className="text-slate-400 uppercase font-bold mr-2">ს/ნ</span> {client?.company_id || client?.tax_id || 'N/A'}</p>
                      {showClientPhone && client?.phone && (
                          <p className="flex items-center justify-end gap-1.5 text-slate-600">
                             <Phone className="h-3 w-3 text-blue-400" /> {client.phone}
                          </p>
                      )}
                  </div>
             </div>
        </div>

        {contract && (
             <div className="mb-6 flex items-center gap-2 text-xs text-slate-500 bg-[#f0f9ff] px-3 py-1.5 rounded border border-blue-100 w-fit" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                 <FileText className="h-3.5 w-3.5 text-[#2563eb]" />
                 <span>ხელშეკრულება № <strong className="text-[#1e3a8a]">{contract.contract_number}</strong></span>
             </div>
        )}

        <div className="mb-6">
            <div className="overflow-hidden rounded-lg border border-[#bfdbfe]" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                <table className="w-full">
                    <thead className="bg-[#2563eb]" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                        <tr>
                            <th className="py-2.5 px-4 text-left text-[11px] font-bold text-white uppercase tracking-wider w-[50%]">დასახელება</th>
                            <th className="py-2.5 px-4 text-right text-[11px] font-bold text-white uppercase tracking-wider">რაოდენობა</th>
                            <th className="py-2.5 px-4 text-right text-[11px] font-bold text-white uppercase tracking-wider">ფასი</th>
                            <th className="py-2.5 px-4 text-right text-[11px] font-bold text-white uppercase tracking-wider">სულ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50 bg-white">
                        {items?.length > 0 ? items.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'} style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                                <td className="py-3 px-4">
                                    <p className="text-xs text-slate-800 font-semibold">{item.description}</p>
                                    {item.service_description && (
                                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed max-w-[90%]">
                                            {item.service_description}
                                        </p>
                                    )}
                                </td>
                                <td className="py-3 px-4 text-right text-xs text-slate-600 font-mono align-top">{item.quantity}</td>
                                <td className="py-3 px-4 text-right text-xs text-slate-600 font-mono align-top">{Number(item.unit_price).toFixed(2)}</td>
                                <td className="py-3 px-4 text-right text-xs text-slate-900 font-bold font-mono align-top">{Number(item.line_total || item.amount || 0).toFixed(2)}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="py-6 text-center text-xs text-slate-400 italic">მომსახურება არ არის დამატებული</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-8 items-stretch mb-4 break-inside-avoid print:break-inside-avoid">
             <div className="h-full">
                 {bankAccounts.length > 0 && (
                     <BankDetailsSection bankAccounts={bankAccounts} className="bg-transparent h-full" />
                 )}
                 {invoice.notes && (
                     <div className="mt-4 text-xs text-slate-600 p-3 bg-slate-50 rounded border border-slate-100">
                         <strong>შენიშვნა:</strong> {invoice.notes}
                     </div>
                 )}
             </div>

             <div className="flex flex-col justify-end h-full pt-6">
                <div className="bg-[#f0f9ff] rounded-lg p-5 border border-blue-200 mt-auto" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-600">
                            <span className="font-medium">ქვეჯამი ₾</span>
                            <span className="font-mono">{Number(subtotal || 0).toFixed(2)}</span>
                        </div>
                        {Number(tax_rate) > 0 && (
                            <div className="flex justify-between text-xs text-slate-600">
                                <span className="font-medium">დღგ ({tax_rate}%) ₾</span>
                                <span className="font-mono">{Number(tax_amount || 0).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="border-t border-blue-200 pt-3 mt-2 flex justify-between items-center">
                             <span className="text-sm font-bold text-[#1e3a8a] uppercase">სულ გადასახდელი</span>
                             <span className="text-xl font-bold text-[#2563eb] font-mono">{formattedTotalAmount} ₾</span>
                        </div>
                    </div>
                </div>
                
                {showSignature && (
                    <div className="mt-6 flex flex-col items-end px-2">
                        {signatureUrl ? (
                            <img src={signatureUrl} alt="Signature" className="h-12 object-contain mix-blend-multiply mb-1" crossOrigin="anonymous" />
                        ) : (
                            <div className="h-12 mb-1"></div>
                        )}
                        <div className="border-t border-slate-300 w-40 text-center pt-1">
                             <p className="text-[10px] font-bold text-slate-400 uppercase">ხელმოწერა</p>
                        </div>
                    </div>
                )}
             </div>
        </div>

        <div className="flex-grow"></div>
      </div>
      <ContractorFooterSection performer={performer} />
    </div>
  );
};

export default InvoiceTemplate;
