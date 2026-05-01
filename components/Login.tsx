
import React, { useState } from 'react';
import { User, Language } from '../types';
import { getTranslation } from '../services/translations';

interface LoginProps {
  onLogin: (user: User) => void;
  onLanguageChange: (lang: Language) => void;
  language: Language;
}

const Login: React.FC<LoginProps> = ({ onLogin, onLanguageChange, language }) => {
  const [form, setForm] = useState({ shopName: '', email: '' });
  const [isRegistering, setIsRegistering] = useState(false);

  const languages = [
    { key: Language.ENGLISH, label: "English" },
    { key: Language.HINDI, label: "हिन्दी" },
    { key: Language.KANNADA, label: "ಕನ್ನಡ" },
    { key: Language.TAMIL, label: "தமிழ்" },
    { key: Language.TELUGU, label: "తెలుగు" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.shopName && form.email) {
      onLogin({
        name: form.shopName,
        email: form.email,
        shopName: form.shopName,
        isLoggedIn: true,
        language: undefined // Will be set in next step if new
      });
    }
  };

  const handleGoogleLogin = () => {
    // Mock Google Login
    onLogin({
      name: "Google User",
      email: "user@google.com",
      shopName: "My Google Shop",
      isLoggedIn: true,
      language: undefined
    });
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col items-center justify-center p-6 font-sans overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md bg-white rounded-[48px] shadow-[0_30px_100px_rgba(0,0,0,0.1)] overflow-hidden border border-white relative my-auto">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full -ml-24 -mb-24 blur-3xl"></div>
        
        <div className="bg-[#075E54] p-10 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          {/* Language Selector at Top */}
          <div className="relative z-20 flex justify-center flex-wrap gap-2 mb-8">
            {languages.map((lang) => (
              <button
                key={lang.key}
                onClick={() => onLanguageChange(lang.key)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all border-2 flex items-center justify-center
                  ${language === lang.key 
                    ? 'bg-white text-[#075E54] border-white scale-105 shadow-lg' 
                    : 'bg-white/10 text-white/80 border-white/10 hover:border-white/30'
                  }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <div className="relative z-10">
            <h1 className="text-5xl font-black tracking-tighter mb-2">Jugaad AI</h1>
            <p className="text-[10px] uppercase font-black tracking-[0.4em] opacity-60">Bharat's Smart Shop Assistant</p>
          </div>
        </div>
        
        <div className="p-10 space-y-8 relative z-10">
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button 
                onClick={() => setIsRegistering(false)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isRegistering ? 'bg-white shadow-sm text-[#075E54]' : 'text-gray-400'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setIsRegistering(true)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRegistering ? 'bg-white shadow-sm text-[#075E54]' : 'text-gray-400'}`}
              >
                Register
              </button>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                {isRegistering ? 'Create Your Shop' : getTranslation(language, 'loginTitle')}
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                {isRegistering ? 'Join thousands of smart retailers' : 'Welcome back to your digital register'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{getTranslation(language, 'shopName')}</label>
                <input 
                  required
                  type="text" 
                  value={form.shopName}
                  onChange={e => setForm({...form, shopName: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:border-[#075E54] focus:bg-white transition-all outline-none font-bold text-gray-800 shadow-inner"
                  placeholder="e.g. Sharma Kirana Store"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{getTranslation(language, 'email')}</label>
                <input 
                  required
                  type="email" 
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:border-[#075E54] focus:bg-white transition-all outline-none font-bold text-gray-800 shadow-inner"
                  placeholder="name@example.com"
                />
              </div>
              
              <div className="flex flex-col gap-3 mt-4">
                <button 
                  type="submit" 
                  className="w-full bg-[#075E54] hover:bg-[#128C7E] text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all text-sm uppercase tracking-widest active:scale-95"
                >
                  {isRegistering ? 'Create Account' : getTranslation(language, 'loginBtn')}
                </button>
                {!isRegistering && (
                  <button type="button" className="text-[10px] font-black text-[#075E54] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all">
                    Forgot Password?
                  </button>
                )}
              </div>
            </form>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-4 text-gray-300 text-[10px] font-black uppercase tracking-widest">Secure Access</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-white border-2 border-gray-100 hover:bg-gray-50 text-gray-700 font-black py-5 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-4 text-xs uppercase tracking-widest active:scale-95"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              {getTranslation(language, 'googleLogin')}
            </button>
        </div>
      </div>
      <p className="mt-10 text-gray-400 text-[9px] font-black uppercase tracking-[0.2em]">© 2025 Jugaad AI • Built for Bharat</p>
    </div>
  );
};

export default Login;
