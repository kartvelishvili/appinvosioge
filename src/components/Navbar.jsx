import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Building2, 
  FileSignature, 
  ChevronDown,
  Library,
  TrendingUp
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import UserProfileDropdown from '@/components/UserProfileDropdown';
import MobileMenu from '@/components/MobileMenu';

const Navbar = () => {
  const location = useLocation();
  const [hoveredMenu, setHoveredMenu] = useState(null);

  const navigationItems = [
    { icon: LayoutDashboard, label: 'დაფა', path: '/dashboard' },
    { icon: TrendingUp, label: 'ანალიტიკა', path: '/analytics' },
    { icon: FileText, label: 'ინვოისები', path: '/invoices' },
    { icon: Library, label: 'ბიბლიოთეკა', path: '/library' },
    { icon: FileSignature, label: 'კონტრაქტები', path: '/contracts' },
    { icon: Users, label: 'კლიენტები', path: '/clients' },
    { icon: Building2, label: 'შემსრულებლები', path: '/performers' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex-shrink-0">
               <img 
                 src="https://i.postimg.cc/XY1FTbTp/invoiso-web.png" 
                 alt="Invoiso" 
                 className="h-8 w-auto object-contain hover:opacity-90 transition-opacity"
               />
            </Link>
            <MobileMenu />
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
             {navigationItems.map((item) => (
                <div 
                   key={item.path} 
                   className="relative"
                   onMouseEnter={() => item.submenu && setHoveredMenu(item.path)}
                   onMouseLeave={() => item.submenu && setHoveredMenu(null)}
                >
                   <Link
                      to={item.path}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                         isActive(item.path) 
                           ? 'text-indigo-600 bg-indigo-50' 
                           : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                   >
                      <item.icon className={`h-4 w-4 ${isActive(item.path) ? 'text-indigo-600' : 'text-slate-500'}`} />
                      <span className="hidden xl:inline">{item.label}</span>
                      {item.submenu && <ChevronDown className="h-3 w-3 opacity-50"/>}
                   </Link>

                   {/* Submenu */}
                   <AnimatePresence>
                     {item.submenu && hoveredMenu === item.path && (
                        <motion.div
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: 10 }}
                           className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 py-1"
                        >
                           {item.submenu.map((sub) => (
                              <Link 
                                 key={sub.path} 
                                 to={sub.path}
                                 className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              >
                                 <sub.icon className="h-4 w-4" />
                                 {sub.label}
                              </Link>
                           ))}
                        </motion.div>
                     )}
                   </AnimatePresence>
                </div>
             ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 pl-6 border-l border-slate-100 ml-6">
             <NotificationBell />
             <UserProfileDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;