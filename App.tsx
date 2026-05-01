
import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import InventoryList from './components/InventoryList';
import Billing from './components/Billing';
import Home from './components/Home';
import Login from './components/Login';
import Hisab from './components/Hisab';
import LowStockAlerts from './components/LowStockAlerts';
import { getTranslation } from './services/translations';
import { processStockImage } from './services/geminiService';
import { 
    InventoryItem, Message, MessageSender, MessageType, SaleRecord, 
    User, Language, GeminiActionResponse, Expense 
} from './types';

enum View {
  AUTH = 'AUTH', HOME = 'HOME',
  HISAB = 'HISAB', BILLING = 'BILLING', INVENTORY = 'INVENTORY', CHAT = 'CHAT',
  LOW_STOCK = 'LOW_STOCK'
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [preloadedBillItems, setPreloadedBillItems] = useState<{name: string, quantity: number, price?: number}[]>([]);
  const [preloadedCustomer, setPreloadedCustomer] = useState<string | undefined>(undefined);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', name: 'Parle-G Biscuit', quantity: 150, unit: 'pkts', price: 10, buyingPrice: 8, category: 'Snacks' },
    { id: '2', name: 'Tata Salt 1kg', quantity: 30, unit: 'pkts', price: 28, buyingPrice: 22, category: 'Grocery' },
    { id: '3', name: 'Amul Milk 500ml', quantity: 48, unit: 'pkts', price: 34, buyingPrice: 30, category: 'Dairy' },
    { id: '4', name: 'Sugar 1kg', quantity: 100, unit: 'kg', price: 45, buyingPrice: 38, category: 'Grocery' },
    { id: '5', name: 'Aashirvaad Atta 5kg', quantity: 20, unit: 'bags', price: 245, buyingPrice: 210, category: 'Grocery' },
    { id: '6', name: 'Fortune Soyabean Oil 1L', quantity: 40, unit: 'bottles', price: 165, buyingPrice: 145, category: 'Grocery' },
    { id: '7', name: 'Maggi 2-Min Noodles', quantity: 120, unit: 'pkts', price: 14, buyingPrice: 11, category: 'Snacks' },
    { id: '8', name: 'Lifebuoy Soap 125g', quantity: 60, unit: 'pcs', price: 35, buyingPrice: 28, category: 'Personal Care' },
    { id: '9', name: 'Colgate Strong Teeth 100g', quantity: 25, unit: 'pcs', price: 65, buyingPrice: 55, category: 'Personal Care' },
    { id: '10', name: 'Taj Mahal Tea 250g', quantity: 15, unit: 'pkts', price: 180, buyingPrice: 160, category: 'Grocery' },
    { id: '11', name: 'Haldiram Aloo Bhujia', quantity: 40, unit: 'pkts', price: 20, buyingPrice: 16, category: 'Snacks' },
    { id: '12', name: 'Dettol Handwash Refill', quantity: 12, unit: 'pkts', price: 99, buyingPrice: 85, category: 'Personal Care' },
    { id: '13', name: 'Basmati Rice 1kg', quantity: 50, unit: 'kg', price: 110, buyingPrice: 95, category: 'Grocery' },
    { id: '14', name: 'Harpic Toilet Cleaner', quantity: 10, unit: 'bottles', price: 145, buyingPrice: 125, category: 'Cleaning' },
  ]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('jugaad_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser) as User;
      setUser(parsedUser);
      setCurrentView(View.HOME);
    } else {
      setCurrentView(View.AUTH);
    }
    const savedSales = localStorage.getItem('jugaad_sales');
    if (savedSales) {
      setSales(JSON.parse(savedSales));
    }
  }, []);

  const handleLogin = (newUser: User) => {
    const updatedUser = { ...newUser, language: user?.language || Language.ENGLISH };
    setUser(updatedUser);
    localStorage.setItem('jugaad_user', JSON.stringify(updatedUser));
    setCurrentView(View.HOME);
  };

  const handleLanguageSelect = (lang: Language) => {
    const updatedUser = user ? { ...user, language: lang } : { name: '', email: '', shopName: '', isLoggedIn: false, language: lang };
    setUser(updatedUser);
    if (updatedUser.isLoggedIn) {
      localStorage.setItem('jugaad_user', JSON.stringify(updatedUser));
    }
  };

  const handlePOSSale = (sale: SaleRecord) => {
      const updatedSales = [...sales, sale];
      setSales(updatedSales);
      localStorage.setItem('jugaad_sales', JSON.stringify(updatedSales));

      setInventory(prevInventory => {
        const updatedInventory = [...prevInventory];
        sale.items.forEach(sItem => {
           let idx = sItem.itemId ? updatedInventory.findIndex(i => i.id === sItem.itemId) : -1;
           if (idx === -1) {
             idx = updatedInventory.findIndex(i => i.name.toLowerCase().includes(sItem.name.toLowerCase()));
           }
           if (idx > -1) {
             updatedInventory[idx].quantity = Math.max(0, updatedInventory[idx].quantity - sItem.quantity);
           }
        });
        return updatedInventory;
      });
      
      setPreloadedBillItems([]);
      setPreloadedCustomer(undefined);
      
      if (currentView !== View.CHAT) {
        setCurrentView(View.HISAB);
      }
  };

  const handleAIAction = (response: GeminiActionResponse) => {
      if (response.intent === 'SALE' && response.items && currentView !== View.CHAT) {
          setPreloadedBillItems(response.items);
          setPreloadedCustomer(response.customerName);
          setCurrentView(View.BILLING);
      }
  };

  const handleProcessStockImage = async (base64: string) => {
      setNotification(getTranslation(currentLanguage, 'aiAnalyzingStock'));
      try {
          const response = await processStockImage(base64, currentLanguage);
          if (response.intent === 'STOCK' && response.items) {
              handleBulkAddProducts(response.items.map(i => ({
                  id: Date.now().toString() + Math.random(),
                  name: i.name,
                  quantity: i.quantity,
                  unit: 'units',
                  price: i.price || 0,
                  buyingPrice: (i.price || 0) * 0.8,
                  category: 'General'
              })));
              setNotification(getTranslation(currentLanguage, 'stockUpdated'));
          } else {
              setNotification("Could not detect stock items.");
          }
      } catch (err) {
          setNotification("Error processing stock image.");
      }
      setTimeout(() => setNotification(null), 3000);
  };

  const handleBulkAddProducts = (newItems: InventoryItem[]) => {
      setInventory(prev => {
          const updated = [...prev];
          newItems.forEach(ni => {
              const idx = updated.findIndex(i => i.name.toLowerCase() === ni.name.toLowerCase());
              if (idx > -1) {
                  updated[idx].quantity += ni.quantity;
              } else {
                  updated.push(ni);
              }
          });
          return updated;
      });
  };

  const currentLanguage = user?.language || Language.ENGLISH;

  return (
    <div className="fixed inset-0 bg-gray-200 flex justify-center overflow-hidden">
      <div className="w-full max-w-lg bg-white flex flex-col relative shadow-2xl h-full overflow-hidden">
        
        {currentView === View.AUTH && (
          <Login 
            language={currentLanguage} 
            onLogin={handleLogin} 
            onLanguageChange={(lang) => {
              const updatedUser = user ? { ...user, language: lang } : { name: '', email: '', shopName: '', isLoggedIn: false, language: lang };
              setUser(updatedUser);
            }}
          />
        )}

        {notification && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl animate-in slide-in-from-top-10">
                {notification}
            </div>
        )}

        {(currentView !== View.AUTH) && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-hidden relative">
                {currentView === View.HOME && (
                    <Home 
                        language={currentLanguage} 
                        shopName={user?.shopName || "My Shop"}
                        sales={sales}
                        onNavigate={(v) => setCurrentView(v as View)} 
                        onLanguageChange={handleLanguageSelect}
                        onLogout={() => { localStorage.clear(); setUser(null); setCurrentView(View.HOME); setTimeout(() => setCurrentView(View.AUTH), 0); }}
                    />
                )}
                {currentView === View.LOW_STOCK && (
                    <LowStockAlerts 
                        inventory={inventory} 
                        language={currentLanguage} 
                        onBack={() => setCurrentView(View.HOME)} 
                    />
                )}
                {currentView === View.HISAB && (
                    <Hisab 
                        sales={sales} 
                        inventory={inventory} 
                        expenses={expenses}
                        onAddExpense={(e) => setExpenses([...expenses, e])}
                        language={currentLanguage} 
                        onBack={() => setCurrentView(View.HOME)} 
                    />
                )}
                {currentView === View.BILLING && (
                    <Billing 
                        inventory={inventory} 
                        onCompleteSale={handlePOSSale} 
                        language={currentLanguage} 
                        onBack={() => { setPreloadedBillItems([]); setPreloadedCustomer(undefined); setCurrentView(View.HOME); }} 
                        preloadedItems={preloadedBillItems}
                        preloadedCustomer={preloadedCustomer}
                    />
                )}
                {currentView === View.INVENTORY && (
                    <InventoryList 
                        inventory={inventory} 
                        onAddProduct={(p) => setInventory([...inventory, p])}
                        onBulkAddProducts={handleBulkAddProducts}
                        onProcessImage={handleProcessStockImage}
                        language={currentLanguage}
                        onBack={() => setCurrentView(View.HOME)}
                    />
                )}
                {currentView === View.CHAT && (
                    <ChatInterface 
                        messages={messages} 
                        addMessage={(m) => setMessages(prev => [...prev, m])}
                        onActionProcessed={handleAIAction}
                        inventory={inventory}
                        sales={sales}
                        onViewDashboard={() => setCurrentView(View.HOME)}
                        language={currentLanguage}
                        onCompleteSale={handlePOSSale}
                    />
                )}
            </div>

            {/* Bottom Navigation Bar */}
            <div className="bg-white border-t px-4 flex justify-between items-center z-[100] shadow-[0_-4px_10px_rgba(0,0,0,0.05)] shrink-0 h-16 sm:h-20">
                <button onClick={() => setCurrentView(View.HOME)} className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentView === View.HOME ? 'text-[#075E54] bg-green-50' : 'text-gray-400'}`}>
                    <span className="text-xl sm:text-2xl">🏠</span>
                </button>
                <button onClick={() => setCurrentView(View.HISAB)} className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentView === View.HISAB ? 'text-[#075E54] bg-green-50' : 'text-gray-400'}`}>
                    <span className="text-xl sm:text-2xl">📖</span>
                </button>
                <button 
                  onClick={() => { setPreloadedBillItems([]); setCurrentView(View.BILLING); }} 
                  className="bg-[#075E54] text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full -mt-10 shadow-2xl border-4 border-white active:scale-90 transition-all flex items-center justify-center"
                >
                    <span className="text-2xl sm:text-3xl font-bold">+</span>
                </button>
                <button onClick={() => setCurrentView(View.INVENTORY)} className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentView === View.INVENTORY ? 'text-[#075E54] bg-green-50' : 'text-gray-400'}`}>
                    <span className="text-xl sm:text-2xl">📦</span>
                </button>
                <button onClick={() => setCurrentView(View.CHAT)} className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentView === View.CHAT ? 'text-[#075E54] bg-green-50' : 'text-gray-400'}`}>
                    <span className="text-xl sm:text-2xl">🤖</span>
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
