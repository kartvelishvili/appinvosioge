import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Building2, 
  FileSignature,
  Zap,
  Library,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    { icon: LayoutDashboard, label: 'დაფა', path: '/dashboard' },
    { icon: TrendingUp, label: 'ანალიტიკა', path: '/analytics' },
    { icon: FileText, label: 'ინვოისები', path: '/invoices' },
    { icon: Library, label: 'ბიბლიოთეკა', path: '/library' },
    { icon: Zap, label: 'ერთჯერადი', path: '/one-time-invoices' },
    { icon: FileSignature, label: 'კონტრაქტები', path: '/contracts' },
    { icon: Users, label: 'კლიენტები', path: '/clients' },
    { icon: Building2, label: 'შემსრულებლები', path: '/performers' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="lg:hidden">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 text-slate-600 hover:text-indigo-600"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
            />
            
            {/* Menu panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-8">
                {/* Header */}
                <div className="flex items-center">
                  <img 
                     src="https://i.postimg.cc/XY1FTbTp/invoiso-web.png" 
                     alt="Invoiso" 
                     className="h-8 w-auto object-contain"
                  />
                </div>

                {/* Navigation Links */}
                <nav className="space-y-2">
                  {navigationItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={closeMenu}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                          active 
                            ? 'bg-indigo-50 text-indigo-700' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileMenu;