
import React, { useState, useRef, useEffect } from 'react';
import { TwinMetadata, ChatMessage } from '../types';
import { chatWithMapsGrounding } from '../services/geminiService';

interface AIChatPanelProps {
  metadata: TwinMetadata | null;
  onClose: () => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ metadata, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hello! I am the Civic AI assistant for ${metadata?.name || 'your community'}. How can I help you explore the Digital Twin today?`, timestamp: new Date().toLocaleTimeString() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithMapsGrounding(input, metadata);
      const modelMsg: ChatMessage = { 
        role: 'model', 
        text: response.text + (response.sources.length > 0 ? '\n\nSources:\n' + response.sources.join('\n') : ''), 
        timestamp: new Date().toLocaleTimeString(),
        isLocalInference: (response as any).isLocal
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting to the cloud nodes.", timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-[4000] w-full max-w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
      <header className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black tracking-tight">Civic Assistant</h3>
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Grounding Intelligence</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors font-black">✕</button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm font-medium shadow-sm relative ${
              m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
            }`}>
              {m.isLocalInference && (
                <span className="absolute -top-2 -left-2 bg-indigo-600 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded-full border border-white shadow-sm">
                  Gemma Core
                </span>
              )}
              <p className="whitespace-pre-wrap">{m.text}</p>
              <span className={`text-[8px] font-black uppercase block mt-1 opacity-50 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                {m.timestamp}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-75"></span>
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-200 flex gap-3">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={navigator.onLine ? "Ask about city data..." : "Ask local Gemma Core..."}
          className="flex-1 px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/20 text-sm font-medium"
        />
        <button type="submit" className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
          <span className="text-xl">➔</span>
        </button>
      </form>
    </div>
  );
};
