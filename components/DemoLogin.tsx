
import React, { useState } from 'react';

interface DemoLoginProps {
  onLogin: () => void;
  onReset: () => void;
}

export const DemoLogin: React.FC<DemoLoginProps> = ({ onLogin, onReset }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [loginError, setLoginError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectionLogs([]);
    setLoginError(false);

    const steps = [
      "Accessing Civic-Twin Persistence...",
      "Routing to Demo Environment...",
      "Verifying Gateway Token...",
      "Core Sync Initialized.",
      "Bypassing Legacy IDE Sync Shards..."
    ];

    for (const step of steps) {
      setConnectionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step}`]);
      await new Promise(r => setTimeout(r, 400));
    }

    if (username === 'admin' && password === 'Asw1Nnw2') {
      onLogin();
    } else {
      setIsConnecting(false);
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 opacity-40"></div>
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-[3rem] p-10 shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-700 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-6 shadow-2xl shadow-blue-950/40">🛰️</div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">CIVIC TWIN DEMO LOGIN</h2>
          <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-3">Authorized Access Required</p>
        </div>

        {!isConnecting ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-6 py-5 bg-slate-950 border border-slate-700 rounded-2xl text-white outline-none font-bold focus:border-blue-500 transition-colors"
                placeholder="Admin ID"
                required
              />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-5 bg-slate-950 border border-slate-700 rounded-2xl text-white outline-none font-bold focus:border-blue-500 transition-colors"
                placeholder="Access Token"
                required
              />
            </div>
            <button type="submit" className="w-full py-5 bg-blue-700 hover:bg-blue-600 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95 uppercase text-xs tracking-widest">
              Authorize Demo Session
            </button>
            
            <div className="pt-4 text-center">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Demo Access Credentials</p>
               <code className="text-[10px] text-blue-500/60 font-mono">ID: admin | Pass: Asw1Nnw2</code>
            </div>

            {loginError && <p className="text-center text-rose-500 text-[10px] font-black uppercase animate-pulse">Invalid Credentials</p>}
            
            <div className="pt-6 border-t border-slate-800 mt-6">
              <button 
                type="button"
                onClick={onReset}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[9px] font-black rounded-xl transition-all uppercase tracking-[0.2em]"
              >
                Force Cache Purge & Refresh
              </button>
              <p className="text-[8px] text-slate-600 text-center mt-2 uppercase tracking-widest">Use this if you see stale city data from a previous session</p>
            </div>
          </form>
        ) : (
          <div className="space-y-4 font-mono text-[10px] text-emerald-400 bg-slate-950 p-6 rounded-2xl h-[200px] overflow-y-auto border border-emerald-900/30">
            {connectionLogs.map((log, i) => <div key={i}>{log}</div>)}
            <div className="animate-pulse">_</div>
          </div>
        )}
      </div>
    </div>
  );
};
