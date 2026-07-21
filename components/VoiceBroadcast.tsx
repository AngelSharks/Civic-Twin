
import React, { useState, useRef } from 'react';
import { CIDUser } from '../types';

interface VoiceBroadcastProps {
  user: CIDUser;
}

export const VoiceBroadcast: React.FC<VoiceBroadcastProps> = ({ user }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastLog, setBroadcastLog] = useState<string[]>([]);
  
  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      triggerBroadcast("EMERGENCY TACTICAL ALERT");
    } else {
      setIsRecording(true);
    }
  };

  const triggerBroadcast = (type: string) => {
    setIsBroadcasting(true);
    setBroadcastLog(prev => [`[${new Date().toLocaleTimeString()}] INITIATING ${type} TO ALL PID MEMBERS...`, ...prev]);
    
    setTimeout(() => {
      setBroadcastLog(prev => [`[MESH] Shard distribution complete for CID-${user.cid}.`, ...prev]);
      setIsBroadcasting(false);
    }, 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">Authority Broadcast Hub</h3>
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">B-lan Core Override: {user.role}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full">
          <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
          <span className="text-[9px] font-black text-rose-500 uppercase">Live Mesh Channel</span>
        </div>
      </header>

      <div className="flex flex-col items-center gap-6">
        <button 
          onClick={handleRecord}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl transition-all duration-500 shadow-2xl ${
            isRecording ? 'bg-rose-600 scale-110 animate-pulse border-4 border-white' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          {isRecording ? '⏹️' : '🎙️'}
        </button>
        <p className="text-xs font-bold text-slate-400">
          {isRecording ? "RECORDING EMERGENCY VOICE PACKET..." : "Tap to record tactical mesh alert"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => triggerBroadcast("ALL CLEAR UPDATE")}
          className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase text-[10px] tracking-widest"
        >
          📢 Send All Clear
        </button>
        <button 
          onClick={() => triggerBroadcast("SHELTER IN PLACE")}
          className="py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase text-[10px] tracking-widest"
        >
          🛡️ Shelter Order
        </button>
      </div>

      <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 font-mono text-[10px] text-slate-500 h-24 overflow-y-auto space-y-1">
        {broadcastLog.map((log, i) => (
          <div key={i} className={log.includes('complete') ? 'text-emerald-500' : ''}>{log}</div>
        ))}
      </div>
    </div>
  );
};
