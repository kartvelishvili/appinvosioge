import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import DotsTimeline from '@/components/DotsTimeline';
import DotsCountdown from '@/components/DotsCountdown';
import { useDots } from '@/hooks/useDots';

const DotsPage = () => {
  const navigate = useNavigate();
  const { dotsData, loading, formatDotsDisplay } = useDots();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>წერტილების კოლექცია - Invoiso</title>
      </Helmet>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white rounded-full transition-colors text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">წერტილების კოლექცია</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Dots Display - Full Width on Mobile, Left Column on Desktop */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 space-y-8"
            >
              {/* Large Hero Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/20 rounded-full blur-3xl -ml-16 -mb-16"></div>

                <div className="relative z-10 text-center">
                  <h2 className="text-xl text-blue-100 font-medium mb-6">შენი მიმდინარე ბალანსი</h2>
                  
                  {/* Big Dots Visualization */}
                  <div className="mb-8">
                    <span className="text-6xl md:text-8xl font-black tracking-[0.2em] opacity-90 drop-shadow-md">
                      {formatDotsDisplay(dotsData?.dots_count)}
                    </span>
                  </div>

                  <div className="inline-flex items-baseline gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20">
                    <span className="text-5xl font-bold">{dotsData?.dots_count || 0}</span>
                    <span className="text-lg text-blue-100">წერტილი</span>
                  </div>

                  <div className="mt-8 flex justify-center">
                    <button className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors">
                      <Share2 className="w-4 h-4" />
                      გააზიარე შედეგი
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <DotsTimeline />
            </motion.div>

            {/* Sidebar - Right Column */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              {/* Countdown Card */}
              <DotsCountdown />

              {/* Info Card */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">როგორ მუშაობს?</h3>
                <ul className="space-y-4 text-sm text-slate-600">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 font-bold">1</div>
                    <p>დარეგისტრირდით და მიიღეთ საწყისი 4 წერტილი საჩუქრად.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">2</div>
                    <p>ყოველ 5 დღეში ერთხელ სისტემა ავტომატურად დაგიმატებთ 1 წერტილს.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">3</div>
                    <p>დააგროვეთ წერტილები და დაელოდეთ მომავალ სიურპრიზებს!</p>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
};

export default DotsPage;