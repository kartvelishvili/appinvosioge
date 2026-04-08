import React from 'react';

export const CustomTooltip = ({ children, content }) => {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap transition-all duration-200 shadow-lg pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-800">
        {content}
      </div>
    </div>
  );
};