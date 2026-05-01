
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiActionResponse, InventoryItem, SaleRecord, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = (language: string) => `
KiranaAI Vision & Sales Assistant. Language: ${language}.
Role: Expert Indian shopkeeper's billing assistant.

CORE TASKS:
1. VISION: Analyze photos of grocery items (oil, soap, biscuits, rice, flour, etc.). 
   - Detect the exact item names and count how many are there.
   - Example: "2 Parle-G pkts", "1 Fortune Oil bottle".
2. TEXT/VOICE: Parse orders like "Ramesh ko 2 kilo chini aur ek tel do".
3. MAPPING: Match items to provided inventory list.

INTENT LOGIC:
- If items are detected -> intent is 'SALE'.
- If customer name is mentioned (e.g. "Ramesh", "Suresh") or phrases like "Udhar likho" -> extract 'customerName'.

OUTPUT: Strictly JSON. 'summary' is a 1-sentence confirmation in ${language}.
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    intent: { type: Type.STRING, enum: ["SALE", "STOCK", "REPORT", "UNKNOWN"] },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          price: { type: Type.NUMBER }
        }
      }
    },
    summary: { type: Type.STRING },
    customerName: { type: Type.STRING }
  },
  required: ["intent", "summary"]
};

export const processMultiModalInput = async (
  text: string | null,
  imageBase64: string | null,
  audioBase64: string | null,
  currentInventory: InventoryItem[],
  recentSales: SaleRecord[],
  language: Language,
  mimeType: string = 'audio/webm'
): Promise<GeminiActionResponse> => {
  try {
    const parts: any[] = [];
    const inventoryContext = currentInventory.slice(0, 60).map(i => `${i.name}(₹${i.price})`).join('|');
    
    parts.push({ text: `Context: Inventory List: ${inventoryContext}` });

    if (audioBase64) parts.push({ inlineData: { mimeType, data: audioBase64 } });
    if (imageBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
    if (text) parts.push({ text: text });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION(language),
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0,
      }
    });

    return JSON.parse(response.text || '{}') as GeminiActionResponse;
  } catch (error) {
    console.error("Gemini Error:", error);
    return { intent: "UNKNOWN", summary: "Please try again with a clearer image or voice." };
  }
};

export const processStockImage = async (
  imageBase64: string,
  language: Language
): Promise<GeminiActionResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: "Analyze this image of a bill or stock list. Extract items and their quantities. Output JSON only." },
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
        ]
      },
      config: {
        systemInstruction: `You are a stock manager. Extract items and quantities from the image. 
        Output JSON with 'intent': 'STOCK', 'items': [{name, quantity}], 'summary': 'Stock detected'.`,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    return JSON.parse(response.text || '{}') as GeminiActionResponse;
  } catch (error) {
    console.error("Stock Scan Error:", error);
    return { intent: "UNKNOWN", summary: "Failed to scan stock." };
  }
};
