
import React, { useState } from 'react';
import { UserRole, CIDUser, CID } from '../types';

interface CIDLoginProps {
  cids: CID[];
  onLogin: (user: CIDUser) => void;
  isOverlay?: boolean;
}

export const CIDLogin: React.FC<CIDLoginProps> = ({ cids, onLogin, isOverlay }) => {
  const [selectedCid, setSelectedCid] = useState(cids[0]?.id || '');
  const [role, setRole] = useState<UserRole>('CID_OPERATOR');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '772' || passcode === 'admin') {
      const user: CIDUser = {
        id: `USR-${Math.floor(Math.random() * 1000)}`,
        role,
        cid: selectedCid,
        name: role.replace('_', ' ')
      };
      onLogin(user);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className={`flex-1 flex items-center justify-center p-6 ${isOverlay ? 'fixed inset-0 z-[8000] bg-slate-950/40 backdrop-blur-md' : 'bg-slate-950 min-h-full'}`}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5 pointer-events-none"></div>
      
      <div className={`w-full max-w-md bg-slate-900 border border-slate-700 rounded-[3rem] p-10 shadow-2xl transition-all duration-500 animate-in zoom-in-95 ${error ? 'border-rose-500' : ''}`}>
        <header className="text-center mb-10">
          <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-amber-900/40">
            🆘
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">B-LAN MESH GATEWAY</h2>
          <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-2">Emergency Tactical Authority Activation</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
            <p className="text-xs font-bold text-amber-500 italic">"Internet connection disrupted. Activating localized PID Shard persistence protocol."</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Community ID</label>
            <select 
              value={selectedCid}
              onChange={(e) => setSelectedCid(e.target.value)}
              className="w-full px-5 py-4 bg-slate-950 border border-slate-700 rounded-2xl text-white outline-none font-bold appearance-none cursor-pointer focus:border-amber-500 transition-colors"
            >
              {cids.map(c => (
                <option key={c.id} value={c.id}>CID-{c.id} ({c.name})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Authority Level</label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
              {(['CID_OPERATOR', 'MAYOR', 'CITY_MANAGER'] as UserRole[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-3 text-[9px] font-black rounded-xl transition-all ${role === r ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {r.split('_')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">B-lan Secure Passcode</label>
            <input 
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••••"
              className="w-full px-5 py-4 bg-slate-950 border border-slate-700 rounded-2xl text-white text-center text-xl tracking-widest outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <button className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-slate-900 font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase text-xs tracking-[0.2em]">
            Establish Tactical Session
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
          <span>Fog AI Ready</span>
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span>B-lan v2.1 (Offline Core)</span>
        </div>
      </div>
    </div>
  );
};
