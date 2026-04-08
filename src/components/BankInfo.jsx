import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const BANK_NAME_MAP = {
    'tbc': 'თიბისი ბანკი',
    'bog': 'საქართველოს ბანკი',
    'liberty': 'Liberty Bank',
    'basis': 'Basis Bank',
    'cartu': 'Cartu Bank',
    'silknet': 'Silknet Bank',
    'credo': 'Credo Bank',
    'tera': 'Tera Bank',
    'galt': 'Galt & Taggart',
    'caucasus': 'Caucasus Bank',
    'other': 'სხვა ბანკი'
};

const BankInfo = ({ account, isPrintable = false }) => {
    const { toast } = useToast();

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({
                title: "დაკოპირდა",
                description: "ანგარიშის ნომერი კოპირებულია.",
                className: "bg-green-50 border-green-200"
            });
        }, (err) => {
            toast({
                variant: "destructive",
                title: "შეცდომა",
                description: "კოპირება ვერ მოხერხდა.",
            });
        });
    };

    const bankName = BANK_NAME_MAP[account.bank_id] || 'უცნობი ბანკი';
    const isLogoDisplay = account.display_type === 'logo';

    return (
        <div className="text-sm text-[#333333] flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-[#0A3858]">
                    {isLogoDisplay ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">{bankName}</span>
                    ) : (
                        <span>{bankName}</span>
                    )}
                </div>
                {account.iban && <span className="text-[#808A9B] font-normal text-xs">IBAN: {account.iban}</span>}
            </div>
            <div className="flex items-center gap-2">
                <p className="font-mono text-sm">{account.account_number}</p>
                {!isPrintable && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => copyToClipboard(account.account_number)}
                    >
                        <Copy className="h-3.5 w-3.5" />
                        <span className="sr-only">Copy account number</span>
                    </Button>
                )}
            </div>
        </div>
    );
};

export default BankInfo;