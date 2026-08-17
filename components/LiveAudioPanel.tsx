
import React, { useState, useRef, useEffect } from 'react';
import { TwinMetadata } from '../types';
import { getLiveAudioSession } from '../services/geminiService';

interface LiveAudioPanelProps {
  metadata: TwinMetadata | null;
  onClose: () => void;
}

export const LiveAudioPanel: React.FC<LiveAudioPanelProps> = ({ metadata, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Manually implemented decode function following instructions for raw PCM bytes
  const decodeAudio = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Custom audio decoding logic for raw PCM data from Gemini Live API
  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  // Manually implemented encode function following instructions for raw PCM bytes
  const encodeAudio = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputNodeRef.current = audioContextRef.current.createGain();
      outputNodeRef.current.connect(audioContextRef.current.destination);

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      const callbacks = {
        onopen: () => {
          setIsActive(true);
          setIsConnecting(false);
          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              int16[i] = inputData[i] * 32768;
            }
            const base64 = encodeAudio(new Uint8Array(int16.buffer));
            // Always use sessionPromise to send data to prevent race conditions and stale closures
            sessionPromise.then((session) => {
              session.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
            });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
        },
        onmessage: async (msg: any) => {
          // Direct property access for model turn parts
          const audioStr = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioStr && audioContextRef.current) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
            const buffer = await decodeAudioData(decodeAudio(audioStr), audioContextRef.current, 24000, 1);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(outputNodeRef.current!);
            
            // Gapless playback using nextStartTime cursor
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            sourcesRef.current.add(source);
            source.onended = () => sourcesRef.current.delete(source);
          }

          if (msg.serverContent?.outputTranscription) {
            setTranscription(prev => (prev + ' ' + msg.serverContent.outputTranscription.text).slice(-200));
          }
        },
        onclose: () => setIsActive(false),
        onerror: (e: any) => console.error("Live Audio Error", e),
      };

      const sessionPromise = getLiveAudioSession(callbacks, metadata);
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start voice session", err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsActive(false);
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-300">
        <div className="relative inline-block">
          <div className={`w-32 h-32 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center text-4xl shadow-2xl transition-all duration-500 ${isActive ? 'scale-110 shadow-blue-500/50 animate-pulse' : ''}`}>
            {isActive ? '🎙️' : '🔇'}
          </div>
          {isActive && (
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-20"></div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight">Civic Voice Control</h2>
          <p className="text-xs font-black text-blue-400 uppercase tracking-[0.3em]">Native Audio Live API</p>
        </div>

        <div className="bg-slate-950 rounded-2xl p-6 h-32 flex flex-col items-center justify-center text-slate-400 italic font-medium text-sm border border-slate-800 shadow-inner overflow-hidden">
          {isActive ? (
            <p className="animate-in fade-in duration-500 line-clamp-3">{transcription || "Listening for your voice..."}</p>
          ) : (
            <p>System offline. Tap to connect to the community mesh.</p>
          )}
        </div>

        <div className="flex gap-4">
          {!isActive ? (
            <button 
              onClick={startSession}
              disabled={isConnecting}
              className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 uppercase text-xs tracking-widest"
            >
              {isConnecting ? 'Initializing Mesh...' : 'Connect to Voice Hub'}
            </button>
          ) : (
            <button 
              onClick={stopSession}
              className="flex-1 py-5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase text-xs tracking-widest"
            >
              Disconnect Session
            </button>
          )}
          <button 
            onClick={onClose}
            className="px-8 py-5 bg-slate-800 text-slate-400 font-black rounded-2xl hover:text-white transition-colors uppercase text-xs tracking-widest"
          >
            Close
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-800/50">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">24kHz PCM Audio</span>
          <div className="h-4 w-px bg-slate-800"></div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Low Latency Fog Sync</span>
        </div>
      </div>
    </div>
  );
};
