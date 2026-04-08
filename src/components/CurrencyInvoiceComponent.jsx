
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CurrencyInvoiceComponent = ({ value, onChange, clientCurrency }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    enabled,
    rate_source,
    rate_date,
    applied_rate,
    custom_rate,
  } = value;
  
  const targetCurrency = clientCurrency || 'USD';

  const handleUpdate = (updates) => {
    onChange({ ...value, ...updates });
  };

  const fetchNbgRate = async (date, currency) => {
    setIsLoading(true);
    setError(null);
    try {
      const jsonUrl = `https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/ka/json/?date=${date}`;
      const jsonRes = await fetch(jsonUrl);
      if (jsonRes.ok) {
        const data = await jsonRes.json();
        if (data && data.length > 0 && data[0].currencies) {
          const rateData = data[0].currencies.find((c) => c.code === currency);
          if (rateData) {
            const calculatedRate = rateData.rate / rateData.quantity;
            handleUpdate({ applied_rate: calculatedRate, feed_type: 'json', fetched_at: new Date().toISOString() });
            setIsLoading(false);
            return;
          }
        }
      }
      throw new Error(`ვერ მოიძებნა კურსი ${currency}-თვის მითითებულ თარიღზე.`);
    } catch (err) {
      setError(err.message || "კურსის მიღება ვერ მოხერხდა.");
      handleUpdate({ applied_rate: '' });
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: err.message || "ეროვნული ბანკიდან კურსის მიღება ვერ მოხერხდა."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (enabled && rate_source === 'nbg' && targetCurrency && rate_date) {
      fetchNbgRate(rate_date, targetCurrency);
    }
  }, [enabled, rate_source, targetCurrency, rate_date]);

  if (!enabled) return null;

  return (
    <div className="bg-white rounded-lg shadow-md border border-indigo-100 p-5 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-bold text-indigo-900">ვალუტა ინვოისის პარამეტრები ({targetCurrency})</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-semibold text-slate-700 mb-2 block">კურსის წყარო</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rate_source"
                value="nbg"
                checked={rate_source === 'nbg'}
                onChange={(e) => handleUpdate({ rate_source: e.target.value, applied_rate: '' })}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm">ეროვნული ბანკი (NBG)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rate_source"
                value="commercial"
                checked={rate_source === 'commercial'}
                onChange={(e) => handleUpdate({ rate_source: e.target.value, applied_rate: custom_rate })}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm">კომერციული ბანკი (ხელით)</span>
            </label>
          </div>
        </div>

        {rate_source === 'nbg' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md border border-slate-100">
            <div>
              <Label htmlFor="rate_date" className="text-xs text-slate-500">თარიღი</Label>
              <Input
                type="date"
                id="rate_date"
                value={rate_date}
                onChange={(e) => handleUpdate({ rate_date: e.target.value })}
                className="mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">ფიქსირებული კურსი</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-700 font-mono text-sm flex items-center h-10">
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                  ) : applied_rate ? (
                    Number(applied_rate).toFixed(4)
                  ) : (
                    <span className="text-slate-400">არ მოიძებნა</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fetchNbgRate(rate_date, targetCurrency)}
                  className="p-2 border border-slate-200 rounded-md hover:bg-slate-100"
                  title="განახლება"
                >
                  <RefreshCw className={`h-4 w-4 text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {rate_source === 'commercial' && (
          <div className="bg-slate-50 p-4 rounded-md border border-slate-100">
            <Label htmlFor="custom_rate" className="text-xs text-slate-500">ხელით მისათითებელი კურსი (მაგ: 2.6500)</Label>
            <Input
              type="number"
              step="0.0001"
              id="custom_rate"
              value={custom_rate}
              onChange={(e) => {
                const val = e.target.value;
                handleUpdate({ custom_rate: val, applied_rate: val });
              }}
              placeholder="0.0000"
              className="mt-1 bg-white max-w-xs"
            />
          </div>
        )}
        
        {error && (
            <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {error}
            </p>
        )}
      </div>
    </div>
  );
};

export default CurrencyInvoiceComponent;
