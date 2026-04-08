import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Circle, CheckCircle2 } from 'lucide-react';
import { useDots } from '@/hooks/useDots';
import { format } from 'date-fns';
import { ka } from 'date-fns/locale';

const DotsTimeline = () => {
  const { dotsData } = useDots();

  // Simulate history since we only have current state and interval
  const timelineData = useMemo(() => {
    if (!dotsData) return [];

    const history = [];
    let currentCount = dotsData.dots_count;
    let currentDate = new Date(dotsData.last_dot_added);

    // Assuming we add 1 dot every 5 days
    // We'll show up to last 10 entries to keep it clean
    // And ensure we don't go below 4 dots (initial state)
    
    // Add current state
    history.push({
      date: new Date(currentDate),
      count: currentCount,
      isLatest: true
    });

    // Backtrack
    const maxEntries = 10;
    for (let i = 0; i < maxEntries; i++) {
      currentCount--;
      if (currentCount < 4) break; // Don't go below initial count

      // Go back 5 days
      currentDate = new Date(currentDate.setDate(currentDate.getDate() - 5));
      
      history.push({
        date: new Date(currentDate),
        count: currentCount,
        isLatest: false
      });
    }

    // Add initial state if not reached
    if (history[history.length - 1].count > 4) {
       history.push({
        date: new Date(dotsData.created_at),
        count: 4,
        isInitial: true
      });
    }

    return history;
  }, [dotsData]);

  if (!dotsData) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">ისტორია</h3>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {timelineData.map((item, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            {/* Icon/Dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-50 text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              {item.isLatest ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-4 h-4" />}
            </div>
            
            {/* Content Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-700">
                  {item.count} წერტილი
                </span>
                <time className="font-mono text-xs text-slate-500">
                  {format(item.date, 'dd MMM yyyy', { locale: ka })}
                </time>
              </div>
              <div className="text-sm text-slate-500">
                {item.isLatest 
                  ? 'ბოლო დამატება' 
                  : item.isInitial 
                    ? 'რეგისტრაციის ბონუსი' 
                    : 'ავტომატური დამატება (+1)'}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DotsTimeline;