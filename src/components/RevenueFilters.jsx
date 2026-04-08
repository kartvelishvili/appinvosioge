import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Building2, Activity, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RevenueFilters = ({ onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState({
    dateRange: 'year',
    bank: 'all',
    status: 'all'
  });

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 items-end"
    >
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {/* Date Range */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase px-1">პერიოდი</label>
          <Select 
            value={localFilters.dateRange} 
            onValueChange={(val) => setLocalFilters(prev => ({...prev, dateRange: val}))}
          >
            <SelectTrigger className="w-full bg-slate-50 border-slate-200 focus:ring-indigo-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="აირჩიეთ პერიოდი" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">ბოლო 1 კვირა</SelectItem>
              <SelectItem value="month">ბოლო 1 თვე</SelectItem>
              <SelectItem value="year">ბოლო 1 წელი</SelectItem>
              <SelectItem value="all">სრული ისტორია</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bank Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase px-1">ბანკი</label>
          <Select 
            value={localFilters.bank} 
            onValueChange={(val) => setLocalFilters(prev => ({...prev, bank: val}))}
          >
            <SelectTrigger className="w-full bg-slate-50 border-slate-200 focus:ring-indigo-500">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="აირჩიეთ ბანკი" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა ბანკი</SelectItem>
              <SelectItem value="tbc">TBC ბანკი</SelectItem>
              <SelectItem value="bog">საქართველოს ბანკი</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase px-1">სტატუსი</label>
          <Select 
            value={localFilters.status} 
            onValueChange={(val) => setLocalFilters(prev => ({...prev, status: val}))}
          >
            <SelectTrigger className="w-full bg-slate-50 border-slate-200 focus:ring-indigo-500">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="აირჩიეთ სტატუსი" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა სტატუსი</SelectItem>
              <SelectItem value="paid">გადახდილი</SelectItem>
              <SelectItem value="unpaid">გადაუხდელი</SelectItem>
              <SelectItem value="overdue">ვადაგადაცილებული</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        onClick={handleApply}
        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 h-10 px-8"
      >
        <Filter className="h-4 w-4 mr-2" />
        გაფილტვრა
      </Button>
    </motion.div>
  );
};

export default RevenueFilters;