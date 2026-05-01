
import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageSender, MessageType, InventoryItem, SaleRecord, Language, PaymentMode } from '../types';
import { processMultiModalInput } from '../services/geminiService';
import { getTranslation } from '../services/translations';

interface ChatInterfaceProps {
  messages: Message[];
  addMessage: (msg: Message) => void;
  onActionProcessed: (action: any) => void;
  inventory: InventoryItem[];
  sales: SaleRecord[];
  onViewDashboard: () => void;
  language: Language;
  onCompleteSale: (sale: SaleRecord) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, addMessage, onActionProcessed, inventory, 
  sales, onViewDashboard, language, onCompleteSale 
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isWholesale, setIsWholesale] = useState(false);
  const [udharNameInput, setUdharNameInput] = useState('');
  const [pendingSale, setPendingSale] = useState<any>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, isRecording]);

  const processInput = async (text: string | null, imageBase64: string | null, audioBase64: string | null) => {
    setIsProcessing(true);
    try {
      const response = await processMultiModalInput(text, imageBase64, audioBase64, inventory, sales, language);
      
      if (response.intent === 'SALE' && response.items && response.items.length > 0) {
        const enrichedItems = response.items.map(aiItem => {
          const found = inventory.find(i => i.name.toLowerCase().includes(aiItem.name.toLowerCase()));
          const priceToUse = isWholesale ? (found?.buyingPrice || aiItem.price || 0) : (found?.price || aiItem.price || 0);
          return { ...aiItem, price: priceToUse, buyingPrice: found?.buyingPrice || priceToUse * 0.8, itemId: found?.id };
        });
        const total = enrichedItems.reduce((acc, curr) => acc + (curr.price! * curr.quantity), 0);

        addMessage({
          id: Date.now().toString(),
          text: `${response.summary}. Total: ₹${total}`,
          sender: MessageSender.BOT,
          type: MessageType.PAYMENT_PICKER,
          timestamp: new Date(),
          metadata: { items: enrichedItems, total, customerName: response.customerName }
        });
      } else {
        addMessage({
          id: Date.now().toString(),
          text: response.summary,
          sender: MessageSender.BOT,
          type: MessageType.TEXT,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error(error);
      addMessage({ id: Date.now().toString(), text: "Galti hui. Please try again.", sender: MessageSender.BOT, type: MessageType.TEXT, timestamp: new Date() });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentClick = (mode: PaymentMode, metadata: any) => {
    if (mode === PaymentMode.UDHAR && !metadata.customerName && !udharNameInput) {
      setPendingSale({ mode, metadata });
      return;
    }

    const finalName = udharNameInput || metadata.customerName;
    const sale: SaleRecord = {
      id: Date.now().toString(),
      items: metadata.items.map((i: any) => ({
        itemId: i.itemId,
        name: i.name,
        quantity: i.quantity,
        priceAtSale: i.price,
        buyingPriceAtSale: i.buyingPrice
      })),
      totalAmount: metadata.total,
      paymentMode: mode,
      customerName: mode === PaymentMode.UDHAR ? finalName : undefined,
      timestamp: new Date().toISOString()
    };

    onCompleteSale(sale);
    setUdharNameInput('');
    setPendingSale(null);
    
    const receiptText = `*${metadata.customerName || 'Customer'} Receipt*%0A` + 
      metadata.items.map((i: any) => `${i.name} x${i.quantity}: ₹${i.price * i.quantity}`).join('%0A') + 
      `%0A*Total: ₹${metadata.total}*`;

    addMessage({
      id: (Date.now() + 500).toString(),
      text: getTranslation(language, 'successSale') + ` (₹${metadata.total})`,
      sender: MessageSender.BOT,
      type: MessageType.TEXT,
      timestamp: new Date(),
      metadata: { shareUrl: `https://wa.me/?text=${receiptText}` }
    });
  };

  const startCapture = async () => {
    setIsCapturing(true);
    setIsCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
        };
      }
    } catch (err) { 
      alert("Camera error. Please allow permission."); 
      setIsCapturing(false); 
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current && isCameraReady) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx?.drawImage(videoRef.current, 0, 0);
      
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
      
      // Stop camera
      const tracks = (videoRef.current.srcObject as MediaStream)?.getTracks();
      tracks?.forEach(t => t.stop());
      setIsCapturing(false);

      addMessage({ 
        id: Date.now().toString(), 
        sender: MessageSender.USER, 
        type: MessageType.IMAGE, 
        timestamp: new Date(), 
        mediaUrl: dataUrl 
      });
      
      processInput("Detect items in this image", dataUrl.split(',')[1], null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          addMessage({ id: Date.now().toString(), sender: MessageSender.USER, type: MessageType.AUDIO, timestamp: new Date(), mediaUrl: URL.createObjectURL(audioBlob) });
          processInput(null, null, base64);
        };
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start(200);
      setIsRecording(true);
    } catch (err) { alert("Mic permission denied."); }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-[#075E54] p-4 flex items-center gap-4 text-white shadow-xl shrink-0 z-50 rounded-b-[32px]">
           <button onClick={onViewDashboard} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
             <span className="text-xl">⬅️</span>
           </button>
           <div className="w-10 h-10 bg-gradient-to-tr from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">🤖</div>
           <div className="flex-1 min-w-0">
             <h1 className="font-black text-sm uppercase tracking-[0.1em]">Kirana AI</h1>
             <p className="text-[8px] font-bold opacity-60 tracking-widest uppercase flex items-center gap-1">
               <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
               Online Assistant
             </p>
           </div>
           <button 
              onClick={() => setIsWholesale(!isWholesale)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black border transition-all shadow-sm ${isWholesale ? 'bg-blue-500 border-white text-white' : 'bg-white/10 border-white/20 text-white/70'}`}
           >
              {isWholesale ? getTranslation(language, 'wholesaleOn') : getTranslation(language, 'wholesaleOff')}
           </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === MessageSender.USER ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] rounded-[24px] p-4 shadow-sm ${msg.sender === MessageSender.USER ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
              {msg.type === MessageType.TEXT && (
                <div className="space-y-3">
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  {msg.metadata?.shareUrl && (
                    <a 
                      href={msg.metadata.shareUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md active:scale-95 transition-all"
                    >
                      <span>📱</span> {getTranslation(language, 'shareReceipt')}
                    </a>
                  )}
                </div>
              )}
              {msg.type === MessageType.AUDIO && (
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <audio src={msg.mediaUrl} controls className="h-8 w-48" />
                </div>
              )}
              {msg.type === MessageType.IMAGE && (
                <div className="relative rounded-2xl overflow-hidden shadow-md border-4 border-white">
                  <img src={msg.mediaUrl} className="max-h-64 w-full object-cover" />
                </div>
              )}
              
              {msg.type === MessageType.PAYMENT_PICKER && (
                <div className="space-y-4 mt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <p className="text-sm font-black text-gray-800 uppercase tracking-tight">Bill Summary</p>
                  </div>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    {msg.metadata.items.map((it: any, i: number) => (
                      <div key={i} className="flex justify-between text-[11px] font-bold text-gray-600">
                        <span className="truncate pr-4">{it.name} <span className="text-gray-400">x{it.quantity}</span></span>
                        <span className="shrink-0 text-gray-900 font-black">₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Total</span>
                      <span className="text-lg font-black text-[#075E54]">₹{msg.metadata.total}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center mb-3">Choose Payment Method</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handlePaymentClick(PaymentMode.CASH, msg.metadata)} className="bg-emerald-600 text-white p-4 rounded-2xl text-[10px] font-black shadow-lg shadow-emerald-500/10 active:scale-95 transition-all uppercase flex flex-col items-center gap-1">
                          <span className="text-xl">💵</span>
                          {getTranslation(language, 'cashTotal')}
                        </button>
                        <button onClick={() => handlePaymentClick(PaymentMode.UPI, msg.metadata)} className="bg-blue-600 text-white p-4 rounded-2xl text-[10px] font-black shadow-lg shadow-blue-500/10 active:scale-95 transition-all uppercase flex flex-col items-center gap-1">
                          <span className="text-xl">📱</span>
                          {getTranslation(language, 'upiTotal')}
                        </button>
                    </div>
                    <button onClick={() => handlePaymentClick(PaymentMode.UDHAR, msg.metadata)} className="w-full bg-orange-500 text-white p-4 rounded-2xl text-[10px] font-black shadow-lg shadow-orange-500/10 active:scale-95 transition-all uppercase flex items-center justify-center gap-2">
                      <span className="text-xl">📖</span>
                      {getTranslation(language, 'udharTotal')}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end items-center gap-1 mt-2 opacity-40">
                <p className="text-[8px] font-bold uppercase">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {msg.sender === MessageSender.USER && <span className="text-[10px]">✓✓</span>}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start animate-in fade-in duration-300">
             <div className="bg-white p-4 rounded-[24px] rounded-tl-none shadow-sm flex items-center gap-3 border border-gray-100">
               <div className="flex gap-1">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{getTranslation(language, 'aiAnalyzing')}</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Bar */}
      <div className="bg-white p-4 border-t border-gray-100 flex items-center gap-3 shrink-0 z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] rounded-t-[32px]">
        <button 
          onClick={startCapture} 
          className="p-4 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 transition-colors border border-gray-100 active:scale-90 flex flex-col items-center min-w-[65px]"
        >
          <span className="text-2xl">📷</span>
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">{getTranslation(language, 'scan')}</span>
        </button>
        <div className="flex-1 relative">
          <input 
              type="text" 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === 'Enter' && inputText.trim()) {
                  const text = inputText;
                  setInputText('');
                  addMessage({ id: Date.now().toString(), text, sender: MessageSender.USER, type: MessageType.TEXT, timestamp: new Date() });
                  processInput(text, null, null);
                }
              }}
              placeholder={getTranslation(language, 'typeItems')} 
              className="w-full bg-gray-50 p-4 rounded-2xl outline-none text-base font-bold border-2 border-transparent focus:border-[#075E54] focus:bg-white transition-all shadow-inner text-black"
          />
        </div>
        <button 
            onClick={() => {
                if (inputText.trim()) {
                    const text = inputText;
                    setInputText('');
                    addMessage({ id: Date.now().toString(), text, sender: MessageSender.USER, type: MessageType.TEXT, timestamp: new Date() });
                    processInput(text, null, null);
                } else {
                    isRecording ? (mediaRecorderRef.current?.stop(), setIsRecording(false)) : startRecording();
                }
            }}
            className={`p-4 rounded-2xl shadow-xl text-white transition-all active:scale-95 flex flex-col items-center justify-center min-w-[75px] ${isRecording ? 'bg-red-500 shadow-red-500/20 animate-pulse' : 'bg-[#075E54] shadow-emerald-500/20'}`}
        >
            {inputText ? (
              <span className="text-xl font-bold">➡️</span>
            ) : (
              <>
                <span className="text-2xl">{isRecording ? '⏹️' : '🎤'}</span>
                <span className="text-[8px] font-black uppercase mt-0.5 tracking-tighter">{isRecording ? getTranslation(language, 'cancel') : getTranslation(language, 'talk')}</span>
              </>
            )}
        </button>
      </div>

      {/* Camera UI */}
      {isCapturing && (
          <div className="fixed inset-0 z-[500] bg-black flex flex-col animate-in fade-in duration-300">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="flex-1 object-cover"
              />
              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div className="bg-black/90 p-10 flex justify-between items-center border-t border-white/10 pb-20">
                  <button 
                    onClick={() => { 
                      const stream = videoRef.current?.srcObject as MediaStream;
                      stream?.getTracks().forEach(t => t.stop());
                      setIsCapturing(false); 
                    }} 
                    className="text-white font-black text-xs uppercase bg-white/10 px-6 py-4 rounded-2xl active:bg-white/20 border border-white/10"
                  >
                    {getTranslation(language, 'cancel')}
                  </button>
                  <div className="relative flex items-center justify-center">
                      <button 
                        onClick={takePhoto} 
                        className="w-20 h-20 bg-white rounded-full border-[8px] border-gray-600 active:scale-90 transition-transform shadow-2xl relative z-10"
                      ></button>
                      <div className="absolute inset-0 bg-white/30 rounded-full animate-ping scale-150"></div>
                  </div>
                  <div className="w-16"></div>
              </div>
          </div>
      )}

      {/* Udhar Modal */}
      {pendingSale && (
        <div className="fixed inset-0 z-[600] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm space-y-6 shadow-2xl border-t-[12px] border-orange-500 animate-in zoom-in-95">
              <div className="text-center">
                <span className="text-5xl mb-3 block">📖</span>
                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">{getTranslation(language, 'kiskeNaam')}</h3>
              </div>
              <input 
                className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-2xl outline-none text-xl font-bold focus:border-orange-500 shadow-inner text-center text-black"
                placeholder="Ex: Ramesh"
                value={udharNameInput}
                onChange={(e) => setUdharNameInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && udharNameInput.trim() && handlePaymentClick(PaymentMode.UDHAR, pendingSale.metadata)}
              />
              <div className="flex gap-3">
                  <button onClick={() => setPendingSale(null)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-black text-[10px] uppercase text-gray-500">{getTranslation(language, 'back')}</button>
                  <button 
                    onClick={() => handlePaymentClick(PaymentMode.UDHAR, pendingSale.metadata)} 
                    disabled={!udharNameInput.trim()} 
                    className="flex-[2] bg-orange-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg disabled:opacity-30 active:scale-95 transition-all"
                  >
                    {getTranslation(language, 'confirmUdhar')}
                  </button>
              </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ChatInterface;
