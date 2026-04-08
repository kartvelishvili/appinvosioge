import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Gift } from 'lucide-react';
import { useDots } from '@/hooks/useDots';

const DotsCountdown = () => {
  const { dotsData, calculateNextDotDate } = useDots();
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!dotsData) return;

    const calculateTime = () => {
      const nextDotDate = calculateNextDotDate();
      if (!nextDotDate) return;

      const now = new Date();
      const difference = nextDotDate - now;

      if (difference <= 0) {
        setTimeLeft('მალე!'); // Soon!
        setProgress(100);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      setTimeLeft(`${days}დ ${hours}სთ ${minutes}წთ`);

      // Calculate progress (5 days total duration)
      const totalDuration = 5 * 24 * 60 * 60 * 1000;
      const elapsed = totalDuration - difference;
      const calculatedProgress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
      setProgress(calculatedProgress);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [dotsData, calculateNextDotDate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 blur-2xl" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">შემდეგი წერტილი</h3>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-end mb-2">
          <span className="text-3xl font-bold text-blue-600 tracking-tight">{timeLeft}</span>
          <Gift className="w-5 h-5 text-blue-400 mb-1" />
        </div>
        
        <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
          <motion.div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <p className="text-xs text-slate-500 text-right font-medium">{Math.round(progress)}% შესრულებულია</p>
      </div>
    </motion.div>
  );
};

export default DotsCountdown;