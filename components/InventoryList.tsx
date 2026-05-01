
import React, { useState, useRef } from 'react';
import { InventoryItem, Language } from '../types';
import { getTranslation } from '../services/translations';

interface InventoryListProps {
  inventory: InventoryItem[];
  onAddProduct: (item: InventoryItem) => void;
  onBulkAddProducts: (items: InventoryItem[]) => void;
  onProcessImage: (base64: string) => void; // Trigger OCR
  language: Language;
  onBack: () => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ inventory, onAddProduct, onBulkAddProducts, onProcessImage, language, onBack }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '', quantity: 0, price: 0, buyingPrice: 0, category: 'General', unit: 'units', expiryDate: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.name && newItem.quantity !== undefined) {
      onAddProduct({
        id: Date.now().toString(),
        name: newItem.name,
        quantity: Number(newItem.quantity),
        price: Number(newItem.price || 0),
        buyingPrice: Number(newItem.buyingPrice || 0),
        category: newItem.category || 'General',
        unit: newItem.unit || 'units',
        expiryDate: newItem.expiryDate || undefined
      });
      setShowAddModal(false);
      setNewItem({ name: '', quantity: 0, price: 0, buyingPrice: 0, category: 'General', unit: 'units', expiryDate: '' });
    }
  };

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        // Trigger parent OCR processing
        alert("Processing image for stock... ⏳");
        onProcessImage(base64);
    };
    reader.readAsDataURL(file);
    event.target.value = ''; // Reset
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden relative font-sans">
      <div className="bg-[#075E54] p-4 flex items-center text-white sticky top-0 z-50 shadow-xl rounded-b-[32px]">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-xl mr-4 hover:bg-white/20 transition-colors">
          <span className="text-xl">⬅️</span>
        </button>
        <div>
          <h1 className="font-black text-xs uppercase tracking-[0.2em]">{getTranslation(language, 'stock')}</h1>
          <p className="text-[8px] font-bold opacity-60 uppercase">Manage Products</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar pb-24">
          {/* Quick Actions */}
          <div className="flex gap-4">
            <button 
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 bg-white border border-gray-100 p-6 rounded-[32px] flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all group"
            >
                <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                  <span className="text-2xl">📷</span>
                </div>
                <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Scan Bill</span>
            </button>
             <button 
                onClick={() => setShowAddModal(true)}
                className="flex-1 bg-white border border-gray-100 p-6 rounded-[32px] flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all group"
            >
                <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                  <span className="text-2xl">➕</span>
                </div>
                <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Manual Add</span>
            </button>
            <input 
                type="file" 
                ref={cameraInputRef} 
                accept="image/*" 
                capture="environment"
                className="hidden"
                onChange={handleImageCapture}
            />
          </div>

          <div className="relative">
             <input 
                type="text" 
                placeholder={getTranslation(language, 'search')} 
                className="w-full bg-white border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 shadow-sm focus:outline-none focus:border-[#075E54] focus:bg-white transition-all font-bold text-gray-800" 
             />
             <span className="absolute left-4 top-4.5 text-xl opacity-30">🔍</span>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Inventory Items ({inventory.length})</h3>
            {inventory.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-[32px] shadow-md flex justify-between items-center border border-gray-50 hover:border-primary/20 transition-colors group">
                  <div className="flex gap-4 items-center">
                    <div className="bg-gray-50 w-12 h-12 rounded-2xl flex items-center justify-center text-xl opacity-40 group-hover:bg-primary-light/10 transition-colors">
                      📦
                    </div>
                    <div>
                        <h3 className="font-black text-gray-800 text-sm leading-tight">{item.name}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{item.category}</p>
                        <p className="text-base font-black text-[#075E54] mt-1">₹{item.price}</p>
                    </div>
                  </div>
                  <div className="text-right">
                      <span className={`inline-block px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      item.quantity < 10 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                      {item.quantity} {item.unit}
                      </span>
                      <button className="block text-[9px] text-blue-600 font-black uppercase tracking-widest mt-3 hover:underline">Edit Item</button>
                  </div>
                </div>
            ))}
          </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add New Item</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Item Name</label>
                <input required type="text" className="w-full border rounded p-2 text-lg" 
                  value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-xs text-gray-500">Quantity</label>
                    <input required type="number" className="w-full border rounded p-2 text-lg" 
                      value={newItem.quantity || ''} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                 </div>
                 <div>
                    <label className="text-xs text-gray-500">Unit</label>
                    <select className="w-full border rounded p-2 text-lg bg-white" 
                        value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})}>
                        <option value="units">units</option>
                        <option value="kg">kg</option>
                        <option value="l">liter</option>
                        <option value="g">gram</option>
                        <option value="pkt">pkt</option>
                        <option value="pcs">pcs</option>
                    </select>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-xs text-gray-500">Buy Price (₹)</label>
                    <input type="number" className="w-full border rounded p-2 text-lg" 
                      value={newItem.buyingPrice || ''} onChange={e => setNewItem({...newItem, buyingPrice: Number(e.target.value)})} />
                 </div>
                 <div>
                    <label className="text-xs text-gray-500">Sell Price (₹)</label>
                    <input type="number" className="w-full border rounded p-2 text-lg" 
                      value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
                 </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 bg-gray-200 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-[#075E54] text-white rounded-xl font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
