import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { MessageSquare, Mail, FileCode, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';

const Settings = () => {
  const location = useLocation();

  const tabs = [
    { id: 'sms', label: 'SMS პარამეტრები', icon: MessageSquare, path: '/settings/sms' },
    { id: 'email', label: 'Email პარამეტრები', icon: Mail, path: '/settings/email' },
    { id: 'templates', label: 'შაბლონები', icon: FileCode, path: '/settings/templates' },
  ];

  // Redirect to first tab if on root settings page
  if (location.pathname === '/settings') {
    return <Navigate to="/settings/sms" replace />;
  }

  const currentTab = tabs.find(tab => location.pathname.startsWith(tab.path));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8 text-sm text-slate-500" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <span className="hover:text-slate-900 transition-colors">მთავარი</span>
            </li>
            <ChevronRight className="h-4 w-4" />
            <li>
              <span className="font-medium text-slate-900">პარამეტრები</span>
            </li>
            {currentTab && (
              <>
                <ChevronRight className="h-4 w-4" />
                <li>
                  <span className="font-medium text-blue-600">{currentTab.label}</span>
                </li>
              </>
            )}
          </ol>
        </nav>

        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">სისტემის პარამეტრები</h1>
            <p className="mt-2 text-slate-600">მართეთ შეტყობინებების, შაბლონების და სისტემის სხვა პარამეტრები</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.id}
                  to={tab.path}
                  className={({ isActive }) =>
                    `group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`
                  }
                >
                  <tab.icon
                    className={`-ml-0.5 mr-2 h-5 w-5 ${
                      location.pathname.startsWith(tab.path) ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'
                    }`}
                  />
                  <span>{tab.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Settings;