import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useDots } from '@/hooks/useDots';

const DotsButton = () => {
  const navigate = useNavigate();
  const { dotsData, loading, formatDotsDisplay } = useDots();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate('/dot')}
      className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all duration-300 border border-blue-500/50 group"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-white/80" />
      ) : (
        <>
          <div className="flex items-center">
            <span className="text-2xl font-bold leading-none tracking-widest relative -top-1">
              {formatDotsDisplay(dotsData?.dots_count)}
            </span>
          </div>
          <div className="flex flex-col items-start ml-1">
            <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">სულ</span>
            <span className="text-sm font-bold leading-none">{dotsData?.dots_count || 0}</span>
          </div>
        </>
      )}
    </motion.button>
  );
};

export default DotsButton;