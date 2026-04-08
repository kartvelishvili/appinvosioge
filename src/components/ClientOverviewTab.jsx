
import React from 'react';
import { motion } from 'framer-motion';
import { Building, Mail, Phone, MapPin, CreditCard, User, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ClientOverviewTab = ({ client, stats }) => {
  return (
    <div className="space-y-6">
      {/* Client Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building className="h-5 w-5 text-indigo-600" />
            კომპანიის დეტალები
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">დასახელება</span>
              <span className="font-medium text-slate-900">{client.company || client.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">საიდენტიფიკაციო</span>
              <span className="font-medium text-slate-900">{client.company_id || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">საკონტაქტო პირი</span>
              <span className="font-medium text-slate-900">{client.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">სტატუსი</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
              }`}>
                {client.status === 'active' ? 'აქტიური' : 'არააქტიური'}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600" />
            საკონტაქტო ინფორმაცია
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 py-2 border-b border-slate-100">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="text-slate-700">{client.email}</span>
            </div>
            <div className="flex items-center gap-3 py-2 border-b border-slate-100">
              <Phone className="h-4 w-4 text-slate-400" />
              <span className="text-slate-700">{client.phone || '-'}</span>
            </div>
            <div className="flex items-start gap-3 py-2 border-b border-slate-100">
              <MapPin className="h-4 w-4 text-slate-400 mt-1" />
              <span className="text-slate-700">
                {[client.address, client.city, client.country].filter(Boolean).join(', ') || '-'}
              </span>
            </div>
             <div className="flex items-center gap-3 py-2">
              <CreditCard className="h-4 w-4 text-slate-400" />
              <span className="text-slate-700">{client.default_currency || 'GEL'}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Statistics Section */}
      <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">სტატისტიკა</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">სულ ინვოისები</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-slate-500">
              სულ გამოწერილი
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">გადახდილი</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalPaid.toLocaleString()} ₾
            </div>
            <p className="text-xs text-slate-500">
              წარმატებული გადახდები
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">გადასახდელი</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalOutstanding.toLocaleString()} ₾
            </div>
            <p className="text-xs text-slate-500">
              მიმდინარე დავალიანება
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">საშ. გადახდის დრო</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averagePaymentTime} დღე</div>
            <p className="text-xs text-slate-500">
              საშუალო მაჩვენებელი
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientOverviewTab;
