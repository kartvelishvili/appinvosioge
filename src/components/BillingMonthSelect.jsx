import React, { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const BillingMonthSelect = ({ value, onChange, required = false, disabled = false, className = "" }) => {
  const months = useMemo(() => {
    const options = [];
    const startYear = 2024;
    const endYear = 2026;
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        options.push(`${monthNames[month]} ${year}`);
      }
    }
    return options;
  }, []);

  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-xs font-semibold text-slate-500 uppercase">
        საანგარიშო თვე {required && <span className="text-red-500">*</span>}
      </Label>
      <Select 
        value={value} 
        onValueChange={onChange} 
        disabled={disabled}
        required={required}
      >
        <SelectTrigger className="w-full bg-white border-slate-200 focus:ring-indigo-500 focus:ring-2">
          <SelectValue placeholder="აირჩიეთ თვე" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {months.map((month) => (
            <SelectItem key={month} value={month}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BillingMonthSelect;