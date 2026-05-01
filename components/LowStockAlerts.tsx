
import React from 'react';
import { InventoryItem, Language } from '../types';
import { getTranslation } from '../services/translations';

interface LowStockAlertsProps {
    inventory: InventoryItem[];
    language: Language;
    onBack: () => void;
}

const LowStockAlerts: React.FC<LowStockAlertsProps> = ({ inventory, language, onBack }) => {
    const lowStockItems = inventory.filter(i => i.quantity < 10); // Threshold 10 for demo

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="bg-[#075E54] p-3 flex items-center text-white sticky top-0 z-20 shadow-md">
                <button onClick={onBack} className="mr-3 text-xl">⬅️</button>
                <h1 className="font-bold text-lg">{getTranslation(language, 'lowStockTitle')}</h1>
            </div>

            <div className="p-4 space-y-3">
                {lowStockItems.length === 0 ? (
                    <div className="text-center mt-10 text-gray-500">
                        <div className="text-6xl mb-4">👍</div>
                        <p>All stock is good!</p>
                    </div>
                ) : (
                    lowStockItems.map(item => (
                        <div key={item.id} className="bg-white border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-red-600 text-lg flex items-center gap-2">
                                    ⚠️ {item.name}
                                </h3>
                                <p className="text-gray-600">Only {item.quantity} {item.unit} left</p>
                            </div>
                            <button className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold text-sm">
                                {getTranslation(language, 'reorder')}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LowStockAlerts;
