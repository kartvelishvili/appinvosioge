import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const RevenueCharts = ({ chartData, pieData, onChartClick }) => {
  
  const handleBarClick = (data) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      onChartClick(data.activePayload[0].payload);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
          <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-medium flex justify-between gap-4 py-0.5" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span className="font-mono font-bold">{Number(entry.value).toLocaleString()} ₾</span>
            </p>
          ))}
          <p className="text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-50 italic text-center">დეტალებისთვის დააკლიკეთ</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* Monthly Bar Chart */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 min-h-[350px]">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-6">შემოსავლების სტრუქტურა</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} onClick={handleBarClick} className="cursor-pointer">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `${val/1000}k`} dx={-10} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="paid" name="გადახდილი" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
              <Bar dataKey="unpaid" name="გადაუხდელი" stackId="a" fill="#E5E7EB" />
              <Bar dataKey="overdue" name="ვადაგადაცილებული" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Cumulative Area Chart */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 min-h-[350px]">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-6">შემოსავლების დინამიკა (კუმულატიური)</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} onClick={handleBarClick} className="cursor-pointer">
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `${val/1000}k`} dx={-10} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="cumulative" name="ჯამური შემოსავალი" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Line Chart Trend */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 min-h-[350px]">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-6">ყოველთვიური ტრენდი</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} onClick={handleBarClick} className="cursor-pointer">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `${val/1000}k`} dx={-10} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="total" name="სრული დარიცხვა" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="paid" name="ფაქტიური გადახდა" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Pie Chart Distribution */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 min-h-[350px] flex flex-col">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">სტატუსების გადანაწილება</h3>
        <div className="h-[280px] flex-1 flex items-center justify-center relative">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${Number(value).toLocaleString()} ₾`, 'თანხა']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 font-medium">მონაცემი არ მოიძებნა</div>
          )}
        </div>
      </motion.div>

    </div>
  );
};

export default RevenueCharts;