import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import RevenueDynamicsSection from '@/components/RevenueDynamicsSection';
import EnhancedMonthlyRevenueChart from '@/components/EnhancedMonthlyRevenueChart';
import AnalyticsOverview from '@/components/AnalyticsOverview';
import ErrorBoundary from '@/components/ErrorBoundary';

const AnalyticsPage = () => {
  return (
    <>
      <Helmet>
        <title>ანალიტიკა - Invoiso</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navbar />
        
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">ანალიტიკა</h1>
              <p className="text-slate-500 mt-1">ფინანსური მაჩვენებლები და დეტალური სტატისტიკა</p>
            </div>

            <div className="space-y-8">
              {/* Overview Section */}
              <ErrorBoundary>
                <AnalyticsOverview />
              </ErrorBoundary>

              <ErrorBoundary>
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                    <RevenueDynamicsSection />
                </div>
              </ErrorBoundary>
              
              <ErrorBoundary>
                <div className="grid grid-cols-1 gap-8">
                   <EnhancedMonthlyRevenueChart />
                </div>
              </ErrorBoundary>
            </div>

          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsPage;