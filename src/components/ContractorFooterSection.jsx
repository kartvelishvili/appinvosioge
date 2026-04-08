import React from 'react';
import { Phone, Mail, MapPin, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const ContractorFooterSection = ({ performer, className }) => {
  if (!performer) return null;

  return (
    <div className={cn("bg-[#f0f9ff] border-t-2 border-[#2563eb] py-4 px-8 mt-auto w-full", className)}>
      <div className="flex flex-wrap justify-between items-center gap-4 text-sm text-[#1e293b]">
        {/* Name/ID */}
        <div className="flex flex-col">
           <span className="font-bold text-[#1e3a8a] uppercase tracking-wide text-xs">{performer.legal_name || performer.name}</span>
           {performer.tax_id && (
             <span className="text-[10px] text-slate-500 font-mono">ს/ნ: {performer.tax_id}</span>
           )}
        </div>

        {/* Contact Info Items */}
        <div className="flex items-center gap-6 text-[11px] font-medium">
            {performer.phone && (
                <div className="flex items-center gap-1.5 text-slate-700">
                    <div className="p-1 bg-white rounded-full border border-blue-100 text-[#2563eb]">
                        <Phone size={10} />
                    </div>
                    <span>{performer.phone}</span>
                </div>
            )}

            {performer.email && (
                <div className="flex items-center gap-1.5 text-slate-700">
                    <div className="p-1 bg-white rounded-full border border-blue-100 text-[#2563eb]">
                         <Mail size={10} />
                    </div>
                    <span>{performer.email}</span>
                </div>
            )}

            {performer.address && (
                <div className="flex items-center gap-1.5 text-slate-700 max-w-[200px]">
                    <div className="p-1 bg-white rounded-full border border-blue-100 text-[#2563eb] shrink-0">
                        <MapPin size={10} />
                    </div>
                    <span className="truncate">{performer.address}</span>
                </div>
            )}
             
            {(performer.website) && (
                 <div className="flex items-center gap-1.5 text-slate-700">
                    <div className="p-1 bg-white rounded-full border border-blue-100 text-[#2563eb]">
                        <Globe size={10} />
                    </div>
                    <span>{performer.website}</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ContractorFooterSection;