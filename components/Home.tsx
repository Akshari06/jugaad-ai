
import React, { useMemo } from 'react';
import { Language, SaleRecord } from '../types';
import { getTranslation } from '../services/translations';

interface HomeProps {
  language: Language;
  onNavigate: (view: string) => void;
  shopName: string;
  sales: SaleRecord[];
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
}

const Home: React.FC<HomeProps> = ({ language, onNavigate, shopName, sales, onLanguageChange, onLogout }) => {
  
  const languages = [
    { key: Language.ENGLISH, label: "EN" },
    { key: Language.HINDI, label: "HI" },
    { key: Language.KANNADA, label: "KN" },
    { key: Language.TAMIL, label: "TA" },
    { key: Language.TELUGU, label: "TE" }
  ];
  const stats = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const todaySales = sales.filter(s => new Date(s.timestamp).getTime() >= startOfToday.getTime());
    const income = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const cost = todaySales.reduce((acc, sale) => {
        return acc + sale.items.reduce((itemAcc, item) => itemAcc + (item.buyingPriceAtSale * item.quantity), 0);
    }, 0);
    
    return { income, profit: income - cost };
  }, [sales]);

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto pb-24 font-sans no-scrollbar">
      {/* Header */}
      <div className="bg-[#075E54] p-6 pb-12 text-white flex justify-between items-start rounded-b-[40px] shadow-lg">
        <div>
          <h1 className="text-xl font-black tracking-tight">{shopName}</h1>
          <p className="text-[9px] uppercase opacity-70 font-bold mt-1 tracking-widest">Digital Shop Register</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1 bg-white/10 p-1 rounded-xl">
              {languages.map((lang) => (
                <button
                  key={lang.key}
                  onClick={() => onLanguageChange(lang.key)}
                  className={`w-7 h-7 rounded-lg text-[8px] font-black transition-all flex items-center justify-center
                    ${language === lang.key 
                      ? 'bg-white text-[#075E54] shadow-lg' 
                      : 'text-white/60 hover:text-white'
                    }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <button onClick={onLogout} className="p-2 bg-white/10 rounded-xl text-lg hover:bg-white/20 transition-all">🚪</button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="px-5 -mt-8">
        <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{getTranslation(language, 'aajKaHisab')}</p>
                    <p className="text-4xl font-black text-[#075E54]">₹{stats.income.toLocaleString('en-IN')}</p>
                </div>
                <button onClick={() => onNavigate('HISAB')} className="bg-[#DCF8C6] text-[#075E54] px-5 py-3 rounded-2xl font-black text-[10px] uppercase shadow-sm active:scale-95 transition-all">
                    {getTranslation(language, 'aajKaHisab')}
                </button>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{getTranslation(language, 'profit')}</span>
                <span className="text-xl font-black text-emerald-700">₹{stats.profit.toLocaleString('en-IN')}</span>
            </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="p-5 space-y-4">
        <button 
            onClick={() => onNavigate('BILLING')}
            className="w-full bg-[#128C7E] text-white rounded-[32px] p-6 shadow-lg flex items-center gap-5 active:scale-95 transition-all"
        >
            <div className="bg-white/20 p-4 rounded-2xl shadow-inner text-4xl">🧾</div>
            <div className="text-left">
                <span className="block text-2xl font-black">{getTranslation(language, 'quickBilling')}</span>
                <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{getTranslation(language, 'createBillFast')}</span>
            </div>
        </button>

        <div className="grid grid-cols-2 gap-4">
            <button 
                onClick={() => onNavigate('INVENTORY')}
                className="bg-blue-600 text-white p-6 rounded-[32px] shadow-lg flex flex-col items-center gap-2 active:scale-95"
            >
                <span className="text-4xl">📦</span>
                <span className="font-black text-[10px] uppercase tracking-widest">{getTranslation(language, 'stock')}</span>
            </button>
            <button 
                onClick={() => onNavigate('HISAB')}
                className="bg-orange-500 text-white p-6 rounded-[32px] shadow-lg flex flex-col items-center gap-2 active:scale-95"
            >
                <span className="text-4xl">📖</span>
                <span className="font-black text-[10px] uppercase tracking-widest">{getTranslation(language, 'khataBook')}</span>
            </button>
        </div>

        {/* AI Bot Row */}
        <button 
            onClick={() => onNavigate('CHAT')}
            className="w-full bg-gray-900 text-white p-6 rounded-[32px] shadow-2xl flex items-center justify-between group active:scale-95 transition-all"
        >
            <div className="flex items-center gap-5">
                <div className="bg-gradient-to-tr from-green-400 to-emerald-600 p-3 rounded-2xl animate-pulse">
                    <span className="text-3xl">🤖</span>
                </div>
                <div className="text-left">
                    <span className="block text-lg font-black tracking-tight uppercase">{getTranslation(language, 'kiranaAI')}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{getTranslation(language, 'voicePhotoBilling')}</span>
                </div>
            </div>
            <span className="text-white/20 text-xl font-bold">→</span>
        </button>
      </div>

      {/* Alert Banner */}
      <div className="px-5 pb-10">
          <button 
            onClick={() => onNavigate('LOW_STOCK')}
            className="w-full bg-red-50 border border-red-100 p-4 rounded-[24px] flex items-center gap-3 active:scale-95 transition-all"
          >
              <span className="text-xl">⚠️</span>
              <p className="text-[10px] font-black text-red-600 uppercase">{getTranslation(language, 'checkLowStock')}</p>
          </button>
      </div>
    </div>
  );
};

export default Home;
