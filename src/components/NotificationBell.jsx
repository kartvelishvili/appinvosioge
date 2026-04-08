import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertCircle, RefreshCw } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from '@/utils/dateUtils';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAsRead, error, refresh, loading } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-300 group"
      >
        <Bell className="h-5 w-5 transition-transform group-hover:rotate-12" />
        {unreadCount > 0 && !error && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2.5 right-2.5 h-[6px] w-[6px] bg-red-500 rounded-full ring-2 ring-white"
          />
        )}
        {error && (
          <span className="absolute top-2.5 right-2.5 h-[8px] w-[8px] bg-amber-500 rounded-full ring-2 ring-white flex items-center justify-center">
             <AlertCircle className="w-2 h-2 text-white" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 origin-top-right"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800">შეტყობინებები</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {unreadCount} ახალი
                </span>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {error ? (
                 <div className="p-8 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                    <p className="text-xs mb-3 text-red-500">{error}</p>
                    <button onClick={refresh} className="text-xs flex items-center justify-center gap-1 mx-auto text-indigo-600 hover:underline">
                       <RefreshCw className="w-3 h-3" /> თავიდან ცდა
                    </button>
                 </div>
              ) : loading ? (
                 <div className="p-8 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin text-indigo-400" />
                    <p className="text-xs">იტვირთება...</p>
                 </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">შეტყობინებები არ არის</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative ${!notification.read ? 'bg-indigo-50/30' : ''}`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                       {!notification.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                       <p className={`text-sm font-semibold mb-1 ${!notification.read ? 'text-indigo-900' : 'text-slate-700'}`}>{notification.title}</p>
                       <p className="text-xs text-slate-500 leading-relaxed">{notification.message}</p>
                       <p className="text-[10px] text-slate-400 mt-2 text-right">{formatDistanceToNow(notification.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;