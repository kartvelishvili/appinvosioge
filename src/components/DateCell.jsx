import React from 'react';
import { getMonthColor } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

const DateCell = ({ date, className, label }) => {
  if (!date) return <span className="text-slate-400">-</span>;

  const dateObj = new Date(date);
  
  // Format as DD/MM/YYYY
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;
  
  // Get color based on month (1-based index)
  const monthIndex = dateObj.getMonth() + 1;
  const color = getMonthColor(monthIndex);
  
  // Create background color with opacity
  const style = {
    color: color,
    backgroundColor: `${color}15`, // ~8% opacity
    borderColor: `${color}30`, // ~20% opacity for border
  };

  return (
    <div className={cn("flex flex-col items-start", className)}>
      {label && <span className="text-xs text-slate-500 mb-1">{label}</span>}
      <div 
        className="inline-flex items-center px-2 py-1.5 rounded-md text-sm font-bold border transition-all duration-200 hover:brightness-95 hover:scale-[1.02]"
        style={style}
      >
        {formattedDate}
      </div>
    </div>
  );
};

export default DateCell;