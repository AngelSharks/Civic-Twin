
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, Sparkles } from 'lucide-react';
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
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput(prev => {
            // If starting fresh replace or append cleanly
            return transcript;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission blocked');
        } else if (event.error !== 'no-speech') {
          setSpeechError('Voice input error');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition not supported in this browser');
      setTimeout(() => setSpeechError(null), 3500);
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn("Could not start recognition:", e);
        setIsListening(false);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);
    const sentText = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithMapsGrounding(sentText, metadata);
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
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
            Civic Assistant
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </h3>
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Grounding Intelligence & Voice</p>
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

      {speechError && (
        <div className="px-6 py-2 bg-rose-50 border-t border-rose-100 text-[11px] font-bold text-rose-600 flex items-center justify-between">
          <span>⚠️ {speechError}</span>
          <button onClick={() => setSpeechError(null)} className="text-rose-400 hover:text-rose-700">✕</button>
        </div>
      )}

      {isListening && (
        <div className="px-6 py-2 bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>Listening to microphone... Speak now</span>
          </div>
          <button onClick={toggleListening} className="underline text-[10px] uppercase tracking-widest font-black">Stop</button>
        </div>
      )}

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "Listening..." : (navigator.onLine ? "Ask about city data..." : "Ask local Gemma Core...")}
          className="flex-1 px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600/20 text-sm font-medium"
        />

        {/* Audio Input Mic Icon Button */}
        <button
          type="button"
          onClick={toggleListening}
          title={isListening ? "Stop Voice Input" : "Speak to Civic Assistant"}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
            isListening 
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105 animate-pulse' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Submit / Send Button */}
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="w-11 h-11 bg-blue-600 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
