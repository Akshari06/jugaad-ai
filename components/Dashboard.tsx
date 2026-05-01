
import React from 'react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { InventoryItem, SaleRecord, Language } from '../types';
import { getTranslation } from '../services/translations';

interface DashboardProps {
  sales: SaleRecord[];
  inventory: InventoryItem[];
  language: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ sales, inventory, language }) => {
  
  // -- MOCK DATA FOR CHARTS --
  const dailyData = [
    { day: 'Mon', income: 4200 },
    { day: 'Tue', income: 3800 },
    { day: 'Wed', income: 5100 },
    { day: 'Thu', income: 4900 },
    { day: 'Fri', income: 6200 },
    { day: 'Sat', income: 7500 },
    { day: 'Sun', income: 5400 },
  ];

  const monthlyData = [
    { month: 'Oct', total: 125000 },
    { month: 'Nov', total: 142000 },
    { month: 'Dec', total: 168000 },
  ];

  // -- CALCULATE PRODUCT ANALYTICS --
  const topProducts = inventory.slice(0, 3).map(item => ({
      name: item.name,
      sold: Math.floor(Math.random() * 100) + 50,
      revenue: Math.floor(Math.random() * 5000) + 1000
  })).sort((a,b) => b.revenue - a.revenue);

  const expiringSoon = inventory.filter(i => i.expiryDate).slice(0, 3).map(i => {
      const days = Math.floor((new Date(i.expiryDate!).getTime() - new Date().getTime()) / (1000*3600*24));
      return { ...i, daysLeft: days };
  }).sort((a,b) => a.daysLeft - b.daysLeft);

  const limitedStock = inventory.filter(i => i.quantity < 10).slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto p-4 space-y-6 pb-24">
      
      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">
            {getTranslation(language, 'dailyIncome')}
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#999'}} />
                <YAxis hide />
                <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                />
                <Line type="monotone" dataKey="income" stroke="#075E54" strokeWidth={3} dot={{r: 4, fill: '#075E54'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Performance */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">
            {getTranslation(language, 'monthlyIncome')}
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#999'}} />
                <YAxis hide />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                <Bar dataKey="total" fill="#128C7E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Product Insights Cards */}
      <div className="space-y-6">
        {/* Top Selling */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-lg">{getTranslation(language, 'topProducts')}</h3>
              <span className="text-[#075E54] text-sm font-bold">⭐</span>
           </div>
           <div className="space-y-4">
              {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0">
                      <div>
                          <p className="font-bold text-gray-700">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.sold} {getTranslation(language, 'qty')}</p>
                      </div>
                      <p className="font-bold text-[#075E54]">₹{p.revenue.toLocaleString()}</p>
                  </div>
              ))}
           </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-800 text-lg mb-4">{getTranslation(language, 'expiringSoon')}</h3>
           <div className="space-y-3">
              {expiringSoon.map((p, i) => (
                  <div key={i} className="bg-orange-50 p-3 rounded-2xl flex items-center justify-between">
                      <div>
                          <p className="font-bold text-gray-800">{p.name}</p>
                          <p className="text-xs text-orange-600 font-semibold">{p.expiryDate}</p>
                      </div>
                      <div className="bg-white px-3 py-1 rounded-full text-xs font-bold text-orange-600 shadow-sm">
                          {p.daysLeft} {getTranslation(language, 'days')}
                      </div>
                  </div>
              ))}
           </div>
        </div>

        {/* Limited Stock */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-800 text-lg mb-4">{getTranslation(language, 'limitedStock')}</h3>
           <div className="grid grid-cols-1 gap-3">
              {limitedStock.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-2xl">
                      <p className="font-bold text-gray-800">{p.name}</p>
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          {p.quantity} {p.unit}
                      </span>
                  </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
