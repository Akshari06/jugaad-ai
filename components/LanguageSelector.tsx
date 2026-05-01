
import React, { useState } from 'react';
import { Language } from '../types';
import { getTranslation } from '../services/translations';

interface LanguageSelectorProps {
  onSelect: (lang: Language) => void;
  onBack?: () => void;
  currentLang?: Language;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelect, onBack, currentLang = Language.ENGLISH }) => {
  const [selected, setSelected] = useState<Language>(currentLang);

  const languages = [
    { key: Language.ENGLISH, label: "English" },
    { key: Language.HINDI, label: "हिंदी (Hindi)" },
    { key: Language.KANNADA, label: "ಕನ್ನಡ (Kannada)" },
    { key: Language.TAMIL, label: "தமிழ் (Tamil)" },
    { key: Language.TELUGU, label: "తెలుగు (Telugu)" }
  ];

  return (
    <div className="h-full bg-gray-50 flex flex-col items-center justify-center p-6 font-sans overflow-y-auto no-scrollbar">
      <div className="bg-white p-10 rounded-[48px] shadow-[0_30px_100px_rgba(0,0,0,0.1)] w-full max-w-md border border-white relative overflow-hidden my-auto">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        
        <div className="text-center mb-10 relative z-10">
            <div className="bg-emerald-50 w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner animate-float">🌐</div>
            <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{getTranslation(selected, 'langTitle')}</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">Choose your preferred language</p>
        </div>
        
        <div className="grid grid-cols-1 gap-3 mb-10 relative z-10">
          {languages.map((lang) => (
            <button
              key={lang.key}
              onClick={() => setSelected(lang.key)}
              className={`p-5 border-2 rounded-2xl transition-all font-black uppercase text-xs tracking-widest flex items-center justify-between group active:scale-95
                ${selected === lang.key 
                  ? 'border-[#075E54] bg-emerald-50 text-[#075E54] shadow-md' 
                  : 'border-gray-50 hover:border-gray-200 text-gray-400 hover:text-gray-600'
                }
              `}
            >
              <span>{lang.label}</span>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selected === lang.key ? 'border-[#075E54] bg-[#075E54]' : 'border-gray-200'}`}>
                {selected === lang.key && <span className="text-white text-[10px]">✓</span>}
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 relative z-10">
          <button 
            onClick={() => onSelect(selected)}
            className="w-full bg-[#075E54] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-[#128C7E] transition-all active:scale-95"
          >
            {getTranslation(selected, 'continue')}
          </button>
          
          {onBack && (
            <button 
              onClick={onBack}
              className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
            >
              {getTranslation(selected, 'back')}
            </button>
          )}
        </div>
      </div>
      <p className="mt-10 text-gray-400 text-[9px] font-black uppercase tracking-[0.2em]">Personalize your experience</p>
    </div>
  );
};

export default LanguageSelector;
