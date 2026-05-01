
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { InventoryItem, Language, PaymentMode, SaleRecord } from '../types';
import { getTranslation } from '../services/translations';

interface BillingProps {
  inventory: InventoryItem[];
  onCompleteSale: (sale: SaleRecord) => void;
  language: Language;
  onBack: () => void;
  preloadedItems?: { name: string; quantity: number; price?: number }[];
  preloadedCustomer?: string;
}

const Billing: React.FC<BillingProps> = ({ inventory, onCompleteSale, language, onBack, preloadedItems, preloadedCustomer }) => {
  const [cart, setCart] = useState<{item: InventoryItem, qty: number, overridePrice?: number}[]>([]);
  const [festivalMode, setFestivalMode] = useState(false);
  const [festivalTotal, setFestivalTotal] = useState('');
  const [isRegularCustomer, setIsRegularCustomer] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUdharModal, setShowUdharModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSale, setLastSale] = useState<SaleRecord | null>(null);
  const [udharName, setUdharName] = useState(preloadedCustomer || '');
  const [search, setSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Default to showing all items if no search is performed
  const searchResults = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return inventory; // Show all items if search is empty
    return inventory.filter(i => 
        i.name.toLowerCase().includes(term) || 
        i.category.toLowerCase().includes(term)
    );
  }, [inventory, search]);

  useEffect(() => {
    if (preloadedItems && preloadedItems.length > 0) {
      const newCart = preloadedItems.map(pi => {
        const found = inventory.find(i => i.name.toLowerCase().includes(pi.name.toLowerCase()));
        if (found) {
          return { item: found, qty: pi.quantity, overridePrice: pi.price };
        }
        return { 
          item: { id: 'temp-' + pi.name, name: pi.name, quantity: 999, unit: 'pcs', price: pi.price || 0, buyingPrice: (pi.price || 0) * 0.9, category: 'General' }, 
          qty: pi.quantity,
          overridePrice: pi.price 
        };
      });
      setCart(newCart);
      if (preloadedCustomer) setUdharName(preloadedCustomer);
    }
  }, [preloadedItems, preloadedCustomer, inventory]);

  const cartTotal = useMemo(() => {
    if (festivalMode) return Number(festivalTotal) || 0;
    return cart.reduce((sum, c) => {
      const activePrice = c.overridePrice ?? (isRegularCustomer ? c.item.buyingPrice : c.item.price);
      return sum + (activePrice * c.qty);
    }, 0);
  }, [cart, festivalMode, festivalTotal, isRegularCustomer]);

  const addToCart = (item: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) return prev.map(c => c.item.id === item.id ? {...c, qty: c.qty + 1} : c);
      return [...prev, { item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => {
        if (c.item.id === id) {
            return { ...c, qty: Math.max(1, c.qty + delta) };
        }
        return c;
    }));
  };

  const handleFinalize = (mode: PaymentMode) => {
    if (mode === PaymentMode.UDHAR && !udharName) {
      setShowUdharModal(true);
      return;
    }

    const sale: SaleRecord = {
      id: Date.now().toString(),
      items: festivalMode ? [{ name: 'Rush Sale', quantity: 1, priceAtSale: cartTotal, buyingPriceAtSale: cartTotal * 0.8 }] 
                         : cart.map(c => ({ 
                             itemId: c.item.id, 
                             name: c.item.name, 
                             quantity: c.qty, 
                             priceAtSale: c.overridePrice ?? (isRegularCustomer ? c.item.buyingPrice : c.item.price),
                             buyingPriceAtSale: c.item.buyingPrice
                           })),
      totalAmount: cartTotal,
      paymentMode: mode,
      customerName: udharName || undefined,
      timestamp: new Date().toISOString()
    };

    onCompleteSale(sale);
    setLastSale(sale);
    setCart([]);
    setFestivalTotal('');
    setUdharName('');
    setShowPaymentModal(false);
    setShowUdharModal(false);
    setShowSuccessModal(true);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden font-sans">
      {/* Top Header - Sticky */}
      <div className="bg-[#075E54] p-4 text-white flex items-center justify-between shrink-0 shadow-xl z-50 rounded-b-[32px]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            <span className="text-xl">⬅️</span>
          </button>
          <div>
            <h1 className="font-black text-xs uppercase tracking-[0.2em]">{getTranslation(language, 'billing')}</h1>
            <p className="text-[8px] font-bold opacity-60 uppercase">New Transaction</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={() => setIsRegularCustomer(!isRegularCustomer)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm ${isRegularCustomer ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70'}`}
            >
              {isRegularCustomer ? 'Wholesale' : 'Retail'}
            </button>
            <button 
              onClick={() => setFestivalMode(!festivalMode)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm ${festivalMode ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/70'}`}
            >
              Rush
            </button>
        </div>
      </div>

      {/* Main Interaction Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        
        {/* Search Bar */}
        {!festivalMode && (
          <div className="bg-white p-4 border-b border-gray-100 flex gap-3 shrink-0 shadow-sm z-40">
            <div className="relative flex-1">
              <input 
                className="w-full bg-gray-50 border-2 border-transparent p-4 pl-12 rounded-2xl outline-none text-base font-bold focus:border-[#075E54] focus:bg-white transition-all text-black shadow-inner"
                placeholder={getTranslation(language, 'search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="absolute left-4 top-4.5 text-xl opacity-40">🔍</span>
            </div>
            <button className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
              <span className="text-xl">📸</span>
            </button>
          </div>
        )}

        {/* Scrollable List Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar pb-36">
          {festivalMode ? (
            <div className="flex flex-col items-center justify-center pt-10 animate-in zoom-in-95 duration-300">
              <div className="bg-white p-10 rounded-[48px] shadow-2xl w-full text-center border-4 border-yellow-400 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
                <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Enter Total Amount</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-black text-gray-300">₹</span>
                  <input 
                    type="number" 
                    value={festivalTotal}
                    onChange={(e) => setFestivalTotal(e.target.value)}
                    className="w-full text-6xl font-black text-[#075E54] text-center outline-none bg-transparent tracking-tighter"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Catalogue Section */}
              <div>
                <div className="flex justify-between items-end mb-4 px-1">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Items ({searchResults.length})</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {searchResults.map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => addToCart(item)}
                      className="bg-white p-5 rounded-[32px] border border-gray-100 text-left active:scale-95 transition-all shadow-md hover:shadow-lg group"
                    >
                      <div className="bg-gray-50 w-10 h-10 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-primary-light/10 transition-colors">
                        <span className="text-xl opacity-40">📦</span>
                      </div>
                      <p className="font-black text-sm truncate text-gray-800 mb-1">{item.name}</p>
                      <p className="text-lg font-black text-[#075E54]">₹{isRegularCustomer ? item.buyingPrice : item.price}</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Stock: {item.quantity}</p>
                        <span className="text-[#075E54] font-black text-lg opacity-0 group-hover:opacity-100 transition-opacity">+</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart Section */}
              {cart.length > 0 && (
                <div className="mt-8 animate-in slide-in-from-bottom-5 duration-500">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <h3 className="text-[10px] font-black text-[#075E54] uppercase tracking-widest">Current Bill</h3>
                  </div>
                  <div className="space-y-3">
                    {cart.map((c, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-[24px] flex justify-between items-center shadow-sm border border-gray-50 hover:border-primary/20 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-sm truncate text-gray-800">{c.item.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">₹{c.overridePrice ?? (isRegularCustomer ? c.item.buyingPrice : c.item.price)} / unit</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
                            <button onClick={() => updateQty(c.item.id, -1)} className="w-8 h-8 flex items-center justify-center font-black text-gray-400 hover:text-primary transition-colors">-</button>
                            <span className="w-8 text-center font-black text-sm text-gray-800">{c.qty}</span>
                            <button onClick={() => updateQty(c.item.id, 1)} className="w-8 h-8 flex items-center justify-center font-black text-gray-400 hover:text-primary transition-colors">+</button>
                          </div>
                          <button onClick={() => setCart(prev => prev.filter(i => i.item.id !== c.item.id))} className="text-gray-200 hover:text-red-400 transition-colors">
                            <span className="text-xl">✕</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Grand Total Bar */}
        <div className="absolute bottom-6 left-0 right-0 px-6 pointer-events-none z-[60]">
           <div className="max-w-md mx-auto pointer-events-auto">
              <div className="bg-gray-900 text-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-2 flex items-center justify-between border border-white/10 backdrop-blur-xl">
                <div className="pl-8">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Grand Total</p>
                  <p className="text-2xl font-black text-emerald-400 tracking-tighter">₹{cartTotal.toLocaleString('en-IN')}</p>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  disabled={cartTotal <= 0}
                  className="bg-emerald-500 text-white px-10 py-5 rounded-full font-black text-xs uppercase shadow-lg shadow-emerald-500/20 disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none transition-all active:scale-95 hover:bg-emerald-400"
                >
                  Checkout →
                </button>
              </div>
           </div>
        </div>
      </div>

      {/* Payment Selection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-6 space-y-4 animate-in slide-in-from-bottom-10">
            <h3 className="text-center font-black text-gray-800 uppercase tracking-tight">Select Payment Mode</h3>
            <div className="bg-gray-50 py-4 rounded-3xl text-center border">
              <p className="text-[10px] font-black text-gray-400 uppercase">Amount Due</p>
              <p className="text-4xl font-black text-[#075E54]">₹{cartTotal}</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => handleFinalize(PaymentMode.CASH)} className="w-full bg-[#128C7E] text-white p-4 rounded-2xl font-black flex justify-between items-center shadow-md">
                <span>💵 CASH</span>
                <span className="opacity-40">→</span>
              </button>
              <button onClick={() => handleFinalize(PaymentMode.UPI)} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black flex justify-between items-center shadow-md">
                <span>📱 ONLINE / UPI</span>
                <span className="opacity-40">→</span>
              </button>
              <button onClick={() => handleFinalize(PaymentMode.UDHAR)} className="w-full bg-orange-500 text-white p-4 rounded-2xl font-black flex justify-between items-center shadow-md">
                <span>📖 UDHAR / KHATA</span>
                <span className="opacity-40">→</span>
              </button>
            </div>
            <button onClick={() => setShowPaymentModal(false)} className="w-full py-2 text-[10px] font-black text-gray-400 uppercase">Cancel</button>
          </div>
        </div>
      )}

      {/* Udhar Confirmation Modal */}
      {showUdharModal && (
        <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm space-y-6 shadow-2xl border-t-[10px] border-orange-500">
            <div className="text-center">
              <span className="text-5xl block mb-2">📖</span>
              <h4 className="font-black text-gray-800 uppercase">Customer Name?</h4>
            </div>
            <input 
              className="w-full bg-gray-50 border-2 p-4 rounded-2xl text-center text-xl font-bold focus:border-orange-500 outline-none"
              placeholder="Ex: Rajesh Bhai"
              value={udharName}
              onChange={(e) => setUdharName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setShowUdharModal(false)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-black text-xs uppercase text-gray-400">Back</button>
              <button onClick={() => handleFinalize(PaymentMode.UDHAR)} disabled={!udharName} className="flex-[2] bg-orange-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg disabled:opacity-30">Record Udhar</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && lastSale && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white rounded-[48px] p-10 w-full max-w-sm text-center space-y-8 shadow-2xl border-b-[16px] border-emerald-500 animate-in zoom-in-95">
                <div className="relative">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-5xl mx-auto animate-bounce">✅</div>
                    <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping"></div>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{getTranslation(language, 'successSale')}</h2>
                    <p className="text-4xl font-black text-emerald-600 mt-2">₹{lastSale.totalAmount}</p>
                </div>
                
                <div className="space-y-3">
                    <a 
                      href={`https://wa.me/?text=${encodeURIComponent(`*${lastSale.customerName || 'Customer'} Receipt*\n` + lastSale.items.map(i => `${i.name} x${i.quantity}: ₹${i.priceAtSale * i.quantity}`).join('\n') + `\n*Total: ₹${lastSale.totalAmount}*`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#25D366] text-white py-5 rounded-3xl font-black text-xs uppercase shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        <span className="text-xl">📱</span> {getTranslation(language, 'shareReceipt')}
                    </a>
                    <button 
                        onClick={() => { setShowSuccessModal(false); onBack(); }}
                        className="w-full bg-gray-900 text-white py-5 rounded-3xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all"
                    >
                        {getTranslation(language, 'back')}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
