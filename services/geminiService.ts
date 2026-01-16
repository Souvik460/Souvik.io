
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAIResponse = async (prompt: string, context?: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: context ? `Context: ${context}\n\nUser Question: ${prompt}` : prompt,
      config: {
        systemInstruction: "You are Sparky, a friendly AI assistant for beginner web developers. You help explain HTML, CSS, and JS concepts simply. When suggesting libraries, provide CDN links. Keep your responses concise and helpful.",
        tools: [{ googleSearch: {} }]
      }
    });

    return {
      text: response.text || "I couldn't generate a response.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Sorry, I encountered an error. Please try again.", sources: [] };
  }
};
