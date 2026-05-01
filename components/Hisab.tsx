
import React, { useState, useMemo } from 'react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { SaleRecord, InventoryItem, Language, PaymentMode, Expense } from '../types';
import { getTranslation } from '../services/translations';

interface HisabProps {
  sales: SaleRecord[];
  inventory: InventoryItem[];
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  language: Language;
  onBack: () => void;
}

const Hisab: React.FC<HisabProps> = ({ sales, inventory, expenses, onAddExpense, language, onBack }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'udhar' | 'products' | 'expenses'>('summary');
  const [timeframe, setTimeframe] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'General' });

  const filteredSales = useMemo(() => {
    const now = new Date();
    
    // Exact start moments
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    return sales.filter(s => {
      const saleTime = new Date(s.timestamp).getTime();
      if (timeframe === 'daily') return saleTime >= startOfDay;
      if (timeframe === 'monthly') return saleTime >= startOfMonth;
      if (timeframe === 'yearly') return saleTime >= startOfYear;
      return true;
    });
  }, [sales, timeframe]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    return expenses.filter(e => {
      const expTime = new Date(e.timestamp).getTime();
      if (timeframe === 'daily') return expTime >= startOfDay;
      if (timeframe === 'monthly') return expTime >= startOfMonth;
      if (timeframe === 'yearly') return expTime >= startOfYear;
      return true;
    });
  }, [expenses, timeframe]);

  const stats = useMemo(() => {
    const cash = filteredSales.filter(s => s.paymentMode === PaymentMode.CASH).reduce((a, b) => a + b.totalAmount, 0);
    const upi = filteredSales.filter(s => s.paymentMode === PaymentMode.UPI).reduce((a, b) => a + b.totalAmount, 0);
    const udhar = filteredSales.filter(s => s.paymentMode === PaymentMode.UDHAR).reduce((a, b) => a + b.totalAmount, 0);
    
    const totalIncome = cash + upi + udhar;
    
    const totalCost = filteredSales.reduce((acc, sale) => {
        return acc + sale.items.reduce((itemAcc, item) => itemAcc + (item.buyingPriceAtSale * item.quantity), 0);
    }, 0);

    const totalExpenses = filteredExpenses.reduce((a, b) => a + b.amount, 0);
    const grossProfit = totalIncome - totalCost;
    const netProfit = grossProfit - totalExpenses;

    return { cash, upi, udhar, total: totalIncome, grossProfit, netProfit, totalExpenses };
  }, [filteredSales, filteredExpenses]);

  const productData = useMemo(() => {
    const map: Record<string, { name: string, income: number, qty: number }> = {};
    filteredSales.forEach(s => {
      s.items.forEach(item => {
        if (!map[item.name]) map[item.name] = { name: item.name, income: 0, qty: 0 };
        map[item.name].income += (item.priceAtSale * item.quantity);
        map[item.name].qty += item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.income - a.income).slice(0, 10);
  }, [filteredSales]);

  const chartData = [
    { name: 'Cash', value: stats.cash, color: '#128C7E' },
    { name: 'UPI', value: stats.upi, color: '#2563EB' },
    { name: 'Udhar', value: stats.udhar, color: '#F97316' },
  ].filter(d => d.value > 0);

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden font-sans">
      {/* Sticky Header */}
      <div className="bg-[#075E54] p-3 text-white shadow-md z-30 shrink-0">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <button onClick={onBack} className="p-1 text-xl">⬅️</button>
                <h1 className="font-bold text-xs sm:text-lg uppercase tracking-tight">{getTranslation(language, 'aajKaHisab')}</h1>
            </div>
            <div className="flex bg-white/10 p-1 rounded-xl">
                {(['daily', 'monthly', 'yearly'] as const).map(t => (
                    <button 
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${timeframe === t ? 'bg-white text-[#075E54]' : 'text-white/40'}`}
                    >
                        {getTranslation(language, t)}
                    </button>
                ))}
            </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar border-t border-white/10 pt-2">
            {(['summary', 'udhar', 'products', 'expenses'] as const).map(tab => (
              <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 min-w-[100px] pb-2 text-[10px] font-black uppercase border-b-4 transition-all ${activeTab === tab ? 'border-white text-white' : 'border-transparent text-white/30'}`}
              >
                  {tab === 'summary' ? 'Overview' : tab === 'udhar' ? 'Udhar Book' : tab === 'products' ? 'Item Sales' : 'Expenses'}
              </button>
            ))}
        </div>
      </div>

      {/* Main Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20 no-scrollbar">
        {activeTab === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{timeframe} Total Income</span>
                    <p className="text-4xl font-black text-[#075E54] mt-1">₹{stats.total.toLocaleString('en-IN')}</p>
                    
                    {chartData.length > 0 ? (
                      <div className="h-56 w-full mt-4">
                          <ResponsiveContainer>
                              <PieChart>
                                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                  </Pie>
                                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="py-16 text-gray-300 text-xs font-bold uppercase tracking-widest">No Sales Found</div>
                    )}

                    <div className="grid grid-cols-3 gap-2 mt-4 border-t pt-4">
                        {['Cash', 'UPI', 'Udhar'].map(label => {
                          const val = label === 'Cash' ? stats.cash : label === 'UPI' ? stats.upi : stats.udhar;
                          const color = label === 'Cash' ? '#128C7E' : label === 'UPI' ? '#2563EB' : '#F97316';
                          return (
                            <div key={label}>
                                <div className="text-[8px] font-black uppercase" style={{ color }}>{label}</div>
                                <div className="font-black text-xs text-black">₹{val}</div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-gray-100">
                        <div className="bg-emerald-50 p-4 rounded-2xl">
                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{getTranslation(language, 'profit')}</p>
                            <p className="text-xl font-black text-emerald-700">₹{stats.grossProfit.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-2xl">
                            <p className="text-[8px] font-black text-red-600 uppercase tracking-widest">{getTranslation(language, 'expenses')}</p>
                            <p className="text-xl font-black text-red-700">₹{stats.totalExpenses.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                    
                    <div className="mt-4 bg-gray-900 text-white p-5 rounded-2xl flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{getTranslation(language, 'netProfit')}</span>
                        <span className="text-2xl font-black text-emerald-400">₹{stats.netProfit.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div className="bg-gray-900 text-white p-6 rounded-[32px] shadow-xl">
                    <h3 className="text-yellow-400 font-black text-[10px] uppercase mb-4 tracking-tighter">Business Health</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                            <span className="text-xs font-bold opacity-70">Low Stock Items</span>
                            <span className="bg-red-500 px-3 py-1 rounded-lg text-[9px] font-black">{inventory.filter(i => i.quantity < 10).length} ITEMS</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                            <span className="text-xs font-bold opacity-70">Credit Given</span>
                            <span className="text-orange-400 font-black text-sm">₹{stats.udhar}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'udhar' && (
            <div className="space-y-4 animate-in slide-in-from-right-10 pb-10">
                <div className="flex justify-between items-end px-2 mb-2">
                    <div>
                      <h2 className="text-xl font-black text-gray-800">Khata Register</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{timeframe}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-orange-600 uppercase">Owed</p>
                      <p className="text-xl font-black text-orange-600">₹{stats.udhar}</p>
                    </div>
                </div>
                {filteredSales.filter(s => s.paymentMode === PaymentMode.UDHAR).reverse().map((s, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-[28px] shadow-sm border border-orange-50 flex justify-between items-center active:scale-95 transition-all">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-black text-gray-800 text-sm leading-tight truncate">👤 {s.customerName || 'Walk-in'}</h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">
                              {new Date(s.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <div className="text-right pl-3 shrink-0">
                            <span className="text-[8px] font-black text-gray-300 block uppercase">Balance</span>
                            <p className="text-xl font-black text-orange-600 tracking-tighter">₹{s.totalAmount}</p>
                            <button className="mt-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-green-100">Clear</button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'products' && (
            <div className="space-y-6 animate-in slide-in-from-right-10 pb-10">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                    <h3 className="font-black text-gray-400 text-[10px] uppercase mb-4 tracking-widest">Top Selling Items</h3>
                    {productData.length > 0 ? (
                      <div className="h-64 w-full">
                          <ResponsiveContainer>
                              <BarChart data={productData} layout="vertical" margin={{ left: -30, right: 10 }}>
                                  <XAxis type="number" hide />
                                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 8, fontWeight: 'bold', fill: '#999' }} axisLine={false} tickLine={false} />
                                  <Bar dataKey="income" fill="#128C7E" radius={[0, 10, 10, 0]} barSize={16} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="py-20 text-center text-gray-300 text-[10px] font-black uppercase">No Sales Data</div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'expenses' && (
            <div className="space-y-4 animate-in slide-in-from-right-10 pb-10">
                <div className="flex justify-between items-center px-2 mb-2">
                    <div>
                      <h2 className="text-xl font-black text-gray-800">{getTranslation(language, 'expenses')}</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{timeframe}</p>
                    </div>
                    <button 
                        onClick={() => setShowExpenseModal(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg"
                    >
                        + {getTranslation(language, 'addExpense')}
                    </button>
                </div>
                
                {filteredExpenses.length === 0 ? (
                    <div className="py-20 text-center text-gray-300 text-[10px] font-black uppercase">No Expenses Found</div>
                ) : (
                    filteredExpenses.reverse().map((exp) => (
                        <div key={exp.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-red-50 flex justify-between items-center">
                            <div>
                                <h4 className="font-black text-gray-800 text-sm leading-tight">{exp.title}</h4>
                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">
                                    {new Date(exp.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </p>
                            </div>
                            <p className="text-lg font-black text-red-600">₹{exp.amount}</p>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* Expense Modal */}
        {showExpenseModal && (
            <div className="fixed inset-0 z-[600] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
                <div className="bg-white rounded-[40px] p-8 w-full max-w-sm space-y-6 shadow-2xl border-t-[12px] border-red-500 animate-in zoom-in-95">
                    <div className="text-center">
                        <span className="text-5xl mb-3 block">💸</span>
                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">{getTranslation(language, 'addExpense')}</h3>
                    </div>
                    <div className="space-y-4">
                        <input 
                            className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl outline-none text-base font-bold focus:border-red-500 text-black"
                            placeholder={getTranslation(language, 'expenseTitle')}
                            value={newExpense.title}
                            onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
                        />
                        <input 
                            type="number"
                            className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl outline-none text-base font-bold focus:border-red-500 text-black"
                            placeholder={getTranslation(language, 'expenseAmount')}
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowExpenseModal(false)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-black text-[10px] uppercase text-gray-500">{getTranslation(language, 'back')}</button>
                        <button 
                            onClick={() => {
                                if (newExpense.title && newExpense.amount) {
                                    onAddExpense({
                                        id: Date.now().toString(),
                                        title: newExpense.title,
                                        amount: Number(newExpense.amount),
                                        category: newExpense.category,
                                        timestamp: new Date().toISOString()
                                    });
                                    setShowExpenseModal(false);
                                    setNewExpense({ title: '', amount: '', category: 'General' });
                                }
                            }}
                            className="flex-[2] bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all"
                        >
                            {getTranslation(language, 'saveExpense')}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Hisab;
