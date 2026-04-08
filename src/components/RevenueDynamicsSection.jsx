import React, { useState } from 'react';
import { useRevenueData } from '@/hooks/useRevenueData';
import RevenueMetricsSection from './RevenueMetricsSection';
import RevenueFilters from './RevenueFilters';
import RevenueCharts from './RevenueCharts';
import DetailedBreakdownModal from './DetailedBreakdownModal';
import { Loader2 } from 'lucide-react';

const RevenueDynamicsSection = () => {
  const [filters, setFilters] = useState({
    dateRange: 'year',
    bank: 'all',
    status: 'all'
  });

  const { metrics, chartData, pieData, loading, error } = useRevenueData(filters);
  const [selectedPeriodData, setSelectedPeriodData] = useState(null);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleChartClick = (data) => {
    setSelectedPeriodData(data);
  };

  if (error) {
    return (
      <div className="py-16 text-center text-red-500 bg-red-50 rounded-2xl border border-red-100 my-8">
        შეცდომა მონაცემების ჩატვირთვისას: {error}
      </div>
    );
  }

  return (
    <section className="py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">შემოსავლების დინამიკა</h2>
        <p className="text-slate-500 mt-1 text-sm">დეტალური ფინანსური ანალიტიკა და გრაფიკები</p>
      </div>

      <RevenueFilters onApplyFilters={handleApplyFilters} />

      {loading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">მონაცემები იტვირთება...</p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <p className="text-lg font-medium">მონაცემი არ მოიძებნა</p>
          <p className="text-sm mt-1">შეცვალეთ ფილტრები სხვა პერიოდის სანახავად</p>
        </div>
      ) : (
        <>
          <RevenueMetricsSection metrics={metrics} />
          <RevenueCharts 
            chartData={chartData} 
            pieData={pieData} 
            onChartClick={handleChartClick} 
          />
        </>
      )}

      <DetailedBreakdownModal 
        isOpen={!!selectedPeriodData} 
        onClose={() => setSelectedPeriodData(null)}
        data={selectedPeriodData}
      />
    </section>
  );
};

export default RevenueDynamicsSection;