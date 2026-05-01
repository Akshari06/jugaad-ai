
export enum MessageSender { USER = 'USER', BOT = 'BOT' }
export enum MessageType { TEXT = 'TEXT', AUDIO = 'AUDIO', IMAGE = 'IMAGE', PAYMENT_PICKER = 'PAYMENT_PICKER' }

export interface Message {
  id: string;
  text?: string;
  sender: MessageSender;
  type: MessageType;
  timestamp: Date;
  mediaUrl?: string;
  metadata?: any; // To store pending items for payment picker
}

export enum Language {
  ENGLISH = 'English', HINDI = 'Hindi', KANNADA = 'Kannada', TAMIL = 'Tamil', TELUGU = 'Telugu'
}

export enum PaymentMode {
  CASH = 'CASH',
  UPI = 'UPI',
  UDHAR = 'UDHAR'
}

export interface User {
  name: string;
  email: string;
  shopName: string;
  language?: Language;
  isLoggedIn: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number; // Regular Selling Price
  buyingPrice: number; // Wholesale/Purchase Price
  category: string;
  barcode?: string;
}

export interface SaleRecord {
  id: string;
  items: { itemId?: string; name: string; quantity: number; priceAtSale: number; buyingPriceAtSale: number }[];
  totalAmount: number;
  paymentMode: PaymentMode;
  customerName?: string;
  timestamp: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  timestamp: string;
}

export interface GeminiActionResponse {
  intent: string;
  items?: { name: string; quantity: number; price?: number }[];
  summary: string;
  customerName?: string;
}
