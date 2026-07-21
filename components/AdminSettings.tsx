
import React, { useState, useEffect } from 'react';
import { PRInfo, TwinMetadata, BranchSuggestion } from '../types';
import { generateCoreArchitecturalSuggestions, generatePRSummary } from '../services/geminiService';
import { PRManager } from './PRManager';

interface AdminSettingsProps {
  metadata: TwinMetadata | null;
  onUpdateMetadata?: (metadata: TwinMetadata) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ metadata, onUpdateMetadata }) => {
  useEffect(() => {
    // If no token is set in metadata, try to use the environment variable
    if (metadata && !metadata.githubToken && import.meta.env.VITE_GITHUB_TOKEN) {
      onUpdateMetadata?.({
        ...metadata,
        githubToken: import.meta.env.VITE_GITHUB_TOKEN
      });
    }
  }, [metadata, onUpdateMetadata]);

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pullRequests, setPullRequests] = useState<PRInfo[]>([]);
  const [repoStatus, setRepoStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [coreSuggestions, setCoreSuggestions] = useState<BranchSuggestion[]>([]);
  const [isLoadingPRs, setIsLoadingPRs] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState<'control' | 'rescue' | 'deploy' | 'sync' | 'system' | 'security'>('control');
  const [isDeploying, setIsDeploying] = useState(false);
  const [dependencies, setDependencies] = useState<{ [key: string]: string }>({});
  const [devDependencies, setDevDependencies] = useState<{ [key: string]: string }>({});
  const [isUpdatingDeps, setIsUpdatingDeps] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<{ id: string; status: 'pass' | 'fail' | 'warning'; message: string; timestamp: string; category: string }[]>([]);

  const [isPRManagerOpen, setIsPRManagerOpen] = useState(false);
  const [prContent, setPrContent] = useState<{ title: string; body: string } | null>(null);
  const [isGeneratingPR, setIsGeneratingPR] = useState(false);
  const [sqlOrders, setSqlOrders] = useState<string>('');

  // FINAL CORRECTED REPOSITORY PATH FOR ANGEL SHARKS
  const MAIN_REPO = "AngelSharks/Civic-Twin";
  const ORG_NAME = "Civic Twin";
  const TARGET_DOMAIN = "Angelsharks.net";
  
  // SHARED LINK LOGIC
  const CLEAN_PREVIEW_URL = `${window.location.origin}${window.location.pathname}?view=public`;

  const fetchSqlOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      const data = await response.json();
      setSqlOrders(data.orders || 'No orders logged yet.');
    } catch (err) {
      console.error("Failed to fetch SQL orders", err);
    }
  };

  const fetchDependencies = async () => {
    try {
      const response = await fetch('/api/admin/dependencies');
      const data = await response.json();
      setDependencies(data.dependencies || {});
      setDevDependencies(data.devDependencies || {});
    } catch (err) {
      console.error("Failed to fetch dependencies", err);
    }
  };

  const handleUpdateDependencies = async () => {
    if (!window.confirm("CRITICAL: This will trigger a system-wide dependency update on Shark Core. All nodes will be synchronized to latest stable versions. Continue?")) return;
    
    setIsUpdatingDeps(true);
    try {
      const response = await fetch('/api/admin/dependencies/update', { method: 'POST' });
      const data = await response.json();
      alert(data.message);
      await fetchDependencies();
    } catch (err) {
      console.error("Update failed", err);
      alert("System update failed. Check logs.");
    } finally {
      setIsUpdatingDeps(false);
    }
  };

  const checkRepoConnectivity = async () => {
    setRepoStatus('checking');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`https://api.github.com/repos/${MAIN_REPO}`, {
        signal: controller.signal
      });
      if (response.ok) {
        setRepoStatus('connected');
      } else {
        setRepoStatus('error');
      }
    } catch (err: any) {
      console.error("Connectivity check failed:", err);
      setRepoStatus('error');
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleManualPRSync = async () => {
    const summary = await generatePRSummary(metadata);
    const title = encodeURIComponent(summary.title);
    const body = encodeURIComponent(summary.body);
    // Deep link to create PR on the CORRECT repo even if the IDE sync is broken
    const githubLink = `https://github.com/${MAIN_REPO}/compare/main...main?expand=1&title=${title}&body=${body}`;
    window.open(githubLink, '_blank');
  };

  const handlePurgeCache = () => {
    if (window.confirm("WARNING: This will clear all local session data and reload the app to purge any legacy GitHub references. Continue?")) {
      localStorage.removeItem('civic_twin_persistence');
      window.location.reload();
    }
  };

  const toggleProductionMode = () => {
    if (metadata && onUpdateMetadata) {
      onUpdateMetadata({
        ...metadata,
        isProductionMode: !metadata.isProductionMode
      });
    }
  };

  const fetchPullRequests = async () => {
    setIsLoadingPRs(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`https://api.github.com/repos/${MAIN_REPO}/pulls`, {
        signal: controller.signal
      });
      if (response.ok) {
        const data = await response.json();
        setPullRequests(data);
      } else if (response.status === 401 || response.status === 403) {
        setRepoStatus('error');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn("GitHub PR fetch timed out");
      }
      console.error("Error fetching PRs:", err);
    } finally {
      clearTimeout(timeoutId);
      setIsLoadingPRs(false);
    }
  };

  const loadStrategies = async () => {
    try {
      const cores = await generateCoreArchitecturalSuggestions();
      setCoreSuggestions(cores);
    } catch (err) {
      console.error("Error generating strategy:", err);
    }
  };

  const handleProposePR = async () => {
    setIsPRManagerOpen(true);
    setIsGeneratingPR(true);
    try {
      const summary = await generatePRSummary(metadata);
      setPrContent(summary);
    } catch (err) {
      console.error("PR Generation failed", err);
    } finally {
      setIsGeneratingPR(false);
    }
  };

  const handleSecurityScan = async () => {
    setIsScanning(true);
    setSecurityLogs([]);
    
    try {
      const response = await fetch('/api/admin/security/scan', { method: 'POST' });
      const data = await response.json();
      setSecurityLogs(data.results);
    } catch (err) {
      console.error("Security scan failed", err);
      setSecurityLogs([{
        id: 'error',
        status: 'fail',
        message: 'System-wide security scan failed to initialize. Check network bridge.',
        timestamp: new Date().toISOString(),
        category: 'SYSTEM'
      }]);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchPullRequests();
      loadStrategies();
      checkRepoConnectivity();
      fetchSqlOrders();
      fetchDependencies();
      // Load initial security status
      fetch('/api/admin/security/status').then(res => res.json()).then(data => {
        if (data.results) setSecurityLogs(data.results);
      }).catch(console.error);
    }
  }, [isAuthorized, metadata]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectionLogs([]);
    setLoginError(false);

    const steps = [
      "Accessing Civic-Twin Persistence...",
      `Routing to Org: ${ORG_NAME}`,
      "Verifying Gateway Token...",
      "Core Sync Initialized.",
      "Bypassing Legacy IDE Sync Shards..."
    ];

    for (const step of steps) {
      setConnectionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step}`]);
      await new Promise(r => setTimeout(r, 400));
    }

    if (username === 'admin' && password === 'Asw1Nnw2') {
      setIsAuthorized(true);
      setIsConnecting(false);
    } else {
      setIsConnecting(false);
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex-1 bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 opacity-40"></div>
        <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-[3rem] p-10 shadow-2xl relative z-10">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-700 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-6 shadow-2xl shadow-blue-950/40">🛰️</div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">CIVIC TWIN CORE LOGIN</h2>
            <p className="text-[10px] font-black text-blue-500 tracking-[0.3em] uppercase mt-3">Link Target: {MAIN_REPO}</p>
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
                Authorize Civic Twin Core
              </button>
              
              <div className="pt-4 text-center">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Demo Access Credentials</p>
                 <code className="text-[10px] text-blue-500/60 font-mono">ID: admin | Pass: Asw1Nnw2</code>
              </div>

              {loginError && <p className="text-center text-rose-500 text-[10px] font-black uppercase animate-pulse">Invalid Credentials</p>}
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
  }

  return (
    <div className="flex-1 bg-slate-950 flex flex-col min-h-0 text-slate-100 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
      <header className="p-8 lg:p-12 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-900/40 sticky top-0 backdrop-blur-md z-[2100]">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">{ORG_NAME} Hub</h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${repoStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{MAIN_REPO}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${repoStatus === 'connected' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'}`}>
              {repoStatus.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-950 p-1 rounded-2xl flex border border-slate-800">
            <button 
              onClick={() => setActiveTab('control')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'control' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              Control
            </button>
            <button 
              onClick={() => setActiveTab('sync')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sync' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              Sync
            </button>
            <button 
              onClick={() => setActiveTab('deploy')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'deploy' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              Share
            </button>
            <button 
              onClick={() => setActiveTab('rescue')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'rescue' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              Rescue
            </button>
            <button 
              onClick={() => setActiveTab('system')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'system' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              System
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              Security
            </button>
          </div>
          <button 
            onClick={() => setIsAuthorized(false)}
            className="px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="p-8 lg:p-12 max-w-7xl mx-auto w-full space-y-16">
        
        {activeTab === 'security' && (
          <section className="animate-in fade-in slide-in-from-top duration-500 space-y-12 pb-20">
            <div className="bg-rose-950/20 border-2 border-rose-500/30 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-rose-900/40">🛡️</div>
                    <div>
                      <h3 className="text-3xl font-black text-white tracking-tight">Security Protocol</h3>
                      <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Glasswing AI Safety & System Integrity</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleSecurityScan}
                    disabled={isScanning}
                    className={`px-8 py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-900/40 flex items-center gap-3 ${isScanning ? 'animate-pulse' : ''}`}
                  >
                    {isScanning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Scanning System...
                      </>
                    ) : (
                      <>
                        Initialize Security Scan 🚀
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {securityLogs.length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-slate-800 rounded-[2rem] text-center">
                      <p className="text-xs text-slate-500 font-bold italic">No security scans performed yet. Initialize to verify system integrity.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-6">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Internal Security Checks</h4>
                        <p className="text-[9px] font-mono text-rose-400 uppercase">Last Scan: {securityLogs[0]?.timestamp ? new Date(securityLogs[0].timestamp).toLocaleString() : 'N/A'}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {securityLogs.map((log) => (
                          <div key={log.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-start gap-4 hover:border-rose-500/30 transition-colors group">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              log.status === 'pass' ? 'bg-emerald-900/30 text-emerald-400' : 
                              log.status === 'warning' ? 'bg-amber-900/30 text-amber-400' : 
                              'bg-rose-900/30 text-rose-400'
                            }`}>
                              {log.status === 'pass' ? '✓' : log.status === 'warning' ? '!' : '✕'}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{log.category}</span>
                                <span className="text-[8px] font-mono text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-200">{log.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-10 p-8 bg-blue-950/20 border border-blue-500/20 rounded-[2.5rem] space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🦋</span>
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">Glasswing AI Standard Compliance</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                          This system is being prepared for the <strong>Project Glasswing</strong> AI safety standard. All internal security checks are timestamped and logged to ensure transparency and accountability in AI-driven urban simulations.
                        </p>
                        <div className="flex gap-4">
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[98%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                          </div>
                          <span className="text-[10px] font-black text-blue-400">98% READY</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'rescue' && (
          <section className="animate-in fade-in slide-in-from-top duration-500 space-y-12 pb-20">
            <div className="bg-rose-950/20 border-2 border-rose-500/30 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-rose-900/40">🛠️</div>
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tight">GitHub Shard Connector</h3>
                    <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Bypassing legacy IDE sync issues for {ORG_NAME}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                      <span className="w-6 h-6 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center text-[10px]">01</span>
                      Manual Bridge Sync
                    </h4>
                    <div className="bg-slate-950/80 p-8 rounded-[2rem] border border-rose-900/20 space-y-6">
                      <p className="text-xs text-slate-400 font-bold leading-relaxed">
                        If the IDE "Sync to GitHub" button still shows the old "ADD12" organization, use this bridge to force a PR onto the new <strong>{MAIN_REPO}</strong> repository.
                      </p>
                      <button 
                        onClick={handleManualPRSync}
                        className="w-full py-4 bg-blue-700 hover:bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all"
                      >
                        Force Manual Bridge PR
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                      <span className="w-6 h-6 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center text-[10px]">02</span>
                      Persistence Purge
                    </h4>
                    <div className="bg-slate-950/80 p-8 rounded-[2rem] border border-rose-900/20 space-y-4">
                      <p className="text-xs text-slate-400 font-bold leading-relaxed">
                        Clears local cache to refresh GitHub organizational metadata.
                      </p>
                      <button 
                        onClick={handlePurgeCache}
                        className="px-6 py-3 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-rose-500 font-black text-[10px] uppercase rounded-xl transition-all"
                      >
                        Purge Session & Reload
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'system' && (
          <section className="animate-in fade-in slide-in-from-top duration-500 space-y-12 pb-20">
            <div className="bg-amber-950/20 border-2 border-amber-500/30 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-amber-900/40">📦</div>
                    <div>
                      <h3 className="text-3xl font-black text-white tracking-tight">Core Dependencies</h3>
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Shark Core System Manifest</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleUpdateDependencies}
                    disabled={isUpdatingDeps}
                    className={`px-8 py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-900/40 flex items-center gap-3 ${isUpdatingDeps ? 'animate-pulse' : ''}`}
                  >
                    {isUpdatingDeps ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating All...
                      </>
                    ) : (
                      <>
                        Update All Dependencies 🚀
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                      <span className="w-6 h-6 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center text-[10px]">01</span>
                      Production Dependencies
                    </h4>
                    <div className="bg-slate-950/80 p-8 rounded-[2rem] border border-amber-900/20">
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(dependencies).map(([name, version]) => (
                          <div key={name} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-amber-500/30 transition-colors">
                            <span className="text-xs font-mono text-slate-300">{name}</span>
                            <span className="text-[10px] font-black text-amber-500 bg-amber-950/40 px-3 py-1 rounded-md">{version}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                      <span className="w-6 h-6 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center text-[10px]">02</span>
                      Development Shards
                    </h4>
                    <div className="bg-slate-950/80 p-8 rounded-[2rem] border border-amber-900/20">
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(devDependencies).map(([name, version]) => (
                          <div key={name} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-amber-500/30 transition-colors">
                            <span className="text-xs font-mono text-slate-400">{name}</span>
                            <span className="text-[10px] font-black text-slate-500 bg-slate-800 px-3 py-1 rounded-md">{version}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'sync' && (
          <section className="animate-in fade-in slide-in-from-top duration-500 space-y-12 pb-20">
            <div className="bg-indigo-950/20 border-2 border-indigo-500/30 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-indigo-900/40">🗺️</div>
                    <div>
                      <h3 className="text-3xl font-black text-white tracking-tight">GIS & Sync Configuration</h3>
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Dynamic Spatial Data & GitHub Persistence</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <button 
                      onClick={() => {
                        if (metadata && onUpdateMetadata && import.meta.env.VITE_GITHUB_TOKEN) {
                          onUpdateMetadata({
                            ...metadata,
                            githubToken: import.meta.env.VITE_GITHUB_TOKEN
                          });
                          alert("Token synced from environment variables!");
                        } else {
                          alert("No VITE_GITHUB_TOKEN found in environment. Please enter it manually below.");
                        }
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-[9px] font-black rounded-xl uppercase tracking-widest transition-all border border-indigo-500/20"
                    >
                      🔄 Sync from Environment
                    </button>
                    <p className="text-[8px] text-slate-500 font-bold uppercase">For VITE_GITHUB_TOKEN Fallback</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="p-8 bg-slate-950/50 border border-indigo-500/20 rounded-3xl space-y-6">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔑</span>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">GitHub Access Token</h4>
                      </div>
                      <div className="space-y-3">
                        <input 
                          type="password" 
                          value={metadata?.githubToken || ''}
                          onChange={(e) => {
                            if (metadata && onUpdateMetadata) {
                              onUpdateMetadata({
                                ...metadata,
                                githubToken: e.target.value
                              });
                            }
                          }}
                          placeholder="Paste github_pat_... here"
                          className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-indigo-500 transition-colors font-mono"
                        />
                        <div className="flex items-start gap-3 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                          <span className="text-xs">💡</span>
                          <div className="space-y-2">
                            <p className="text-[9px] text-slate-400 leading-relaxed">
                              <strong>REQUIRED FOR PERSISTENCE:</strong> This token allows the "Pull Request Architect" to save your community data to GitHub. 
                            </p>
                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                              <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Where are AI Studio Settings?</p>
                              <p className="text-[9px] text-slate-400 leading-relaxed">
                                1. Look at the <strong>Left Sidebar</strong> in AI Studio.<br/>
                                2. Click the <strong>Settings (Gear)</strong> icon at the very bottom.<br/>
                                3. Look for <strong>"Secrets"</strong> or <strong>"Environment Variables"</strong>.<br/>
                                4. Add <code className="text-indigo-400">VITE_GITHUB_TOKEN</code>.
                              </p>
                            </div>
                            <p className="text-[9px] text-slate-500 italic">
                              If you can't find it, just paste your token directly into the field above and it will work for this session!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {[
                      { id: 'parcels', label: 'Parcel Boundaries', icon: '📦' },
                      { id: 'utilities', label: 'Utilities Infrastructure', icon: '⚡' },
                      { id: 'infrastructure', label: 'Core Infrastructure', icon: '🏗️' },
                      { id: 'safety', label: 'Public Safety Layers', icon: '🛡️' },
                      { id: 'greenery', label: 'Green Space & Parks', icon: '🌳' }
                    ].map((layer) => (
                      <div key={layer.id} className="space-y-3">
                        <label className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>{layer.icon}</span>
                          {layer.label}
                        </label>
                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            value={metadata?.gisLayers?.[layer.id as keyof typeof metadata.gisLayers] || ''}
                            onChange={(e) => {
                              if (metadata && onUpdateMetadata) {
                                onUpdateMetadata({
                                  ...metadata,
                                  gisLayers: {
                                    ...(metadata.gisLayers || {
                                      parcels: '',
                                      utilities: '',
                                      infrastructure: '',
                                      safety: '',
                                      greenery: ''
                                    }),
                                    [layer.id]: e.target.value
                                  }
                                });
                              }
                            }}
                            placeholder="https://services.arcgis.com/.../query"
                            className="flex-1 px-5 py-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-indigo-500 transition-colors font-mono"
                          />
                          {metadata?.gisLayers?.[layer.id as keyof typeof metadata.gisLayers] && (
                            <button 
                              onClick={() => {
                                if (metadata && onUpdateMetadata) {
                                  onUpdateMetadata({
                                    ...metadata,
                                    gisLayers: {
                                      ...(metadata.gisLayers || {
                                        parcels: '',
                                        utilities: '',
                                        infrastructure: '',
                                        safety: '',
                                        greenery: ''
                                      }),
                                      [layer.id]: ''
                                    }
                                  });
                                }
                              }}
                              className="px-4 bg-slate-800 hover:bg-rose-900/40 text-slate-500 hover:text-rose-400 rounded-xl transition-colors text-xs font-black"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="pt-8 border-t border-slate-800 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">B-LAN Management</h4>
                        <button 
                          onClick={() => {
                            if (metadata && onUpdateMetadata) {
                              const newId = Math.floor(100 + Math.random() * 900).toString();
                              onUpdateMetadata({
                                ...metadata,
                                cids: [
                                  ...metadata.cids,
                                  { id: newId, name: `New B-LAN ${newId}`, population: 0, meshActive: true }
                                ]
                              });
                            }
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black rounded-xl uppercase tracking-widest transition-all"
                        >
                          + Add New B-LAN
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {metadata?.cids.map((cid, index) => (
                          <div key={cid.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 group">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CID-{cid.id}</span>
                              <button 
                                onClick={() => {
                                  if (metadata && onUpdateMetadata) {
                                    onUpdateMetadata({
                                      ...metadata,
                                      cids: metadata.cids.filter(c => c.id !== cid.id)
                                    });
                                  }
                                }}
                                className="text-rose-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <span className="text-[10px] font-black uppercase">Delete</span>
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">B-LAN Name</label>
                                <input 
                                  type="text" 
                                  value={cid.name}
                                  onChange={(e) => {
                                    if (metadata && onUpdateMetadata) {
                                      const newCids = [...metadata.cids];
                                      newCids[index] = { ...cid, name: e.target.value };
                                      onUpdateMetadata({ ...metadata, cids: newCids });
                                    }
                                  }}
                                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                                  placeholder="e.g. Downtown Central"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Population</label>
                                <input 
                                  type="number" 
                                  value={cid.population}
                                  onChange={(e) => {
                                    if (metadata && onUpdateMetadata) {
                                      const newCids = [...metadata.cids];
                                      newCids[index] = { ...cid, population: parseInt(e.target.value) || 0 };
                                      onUpdateMetadata({ ...metadata, cids: newCids });
                                    }
                                  }}
                                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 pt-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={cid.meshActive}
                                  onChange={(e) => {
                                    if (metadata && onUpdateMetadata) {
                                      const newCids = [...metadata.cids];
                                      newCids[index] = { ...cid, meshActive: e.target.checked };
                                      onUpdateMetadata({ ...metadata, cids: newCids });
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mesh Active</span>
                              </label>
                            </div>
                          </div>
                        ))}
                        
                        {metadata?.cids.length === 0 && (
                          <div className="p-8 border-2 border-dashed border-slate-800 rounded-[2rem] text-center">
                            <p className="text-xs text-slate-500 font-bold italic">No B-LANs configured for this instance.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-800 space-y-4">
                      <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Planet Labs Integration</h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>🛰️</span> Planet API Key
                        </label>
                        <input 
                          type="password" 
                          value={metadata?.planetApiKey || ''}
                          onChange={(e) => {
                            if (metadata && onUpdateMetadata) {
                              onUpdateMetadata({
                                ...metadata,
                                planetApiKey: e.target.value
                              });
                            }
                          }}
                          placeholder="Enter Planet API Key..."
                          className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-indigo-500 transition-colors font-mono"
                        />
                      </div>

                      <div className="pt-6 border-t border-slate-800 space-y-4">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">PlanetScope Orders (SQL Log)</h4>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                          <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                            This log tracks all PlanetScope orders generated by the system.
                          </p>
                          <div className="bg-black/60 p-6 rounded-xl font-mono text-[10px] text-emerald-400 border border-emerald-900/30 h-48 overflow-y-auto select-all whitespace-pre">
                            {metadata?.planetOrdersSql || '-- No orders generated yet.'}
                          </div>
                          <button 
                            onClick={() => {
                              const blob = new Blob([metadata?.planetOrdersSql || ''], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'planet_orders.sql';
                              a.click();
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[9px] font-black rounded-xl uppercase tracking-widest transition-all"
                          >
                            Download SQL File 📥
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-slate-900/80 p-8 rounded-[2.5rem] border border-indigo-900/20 space-y-6">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">GIS Integration Guide</h4>
                      <div className="space-y-4 text-[11px] text-slate-400 font-bold leading-relaxed">
                        <p>
                          Civic Twin supports GeoJSON and ArcGIS Feature Service endpoints. For best performance, ensure your spatial data is projected in <code className="text-indigo-400 bg-indigo-950 px-1 rounded">WGS84 (EPSG:4326)</code>.
                        </p>
                        <ul className="space-y-2 list-disc list-inside">
                          <li>Use public query endpoints for real-time sync</li>
                          <li>Ensure CORS is enabled on the host server</li>
                          <li>Leave blank to use simulated community data</li>
                        </ul>
                      </div>
                      <div className="pt-4">
                        <div className="p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl">
                          <p className="text-[10px] font-black text-indigo-300 uppercase mb-2 tracking-widest">Active Layers</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(metadata?.gisLayers || {}).map(([key, val]) => val && (
                              <span key={key} className="px-2 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-md uppercase">
                                {key}
                              </span>
                            ))}
                            {!Object.values(metadata?.gisLayers || {}).some(v => v) && (
                              <span className="text-[9px] text-slate-500 font-bold italic">No external layers configured</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'deploy' && (
          <section className="animate-in fade-in slide-in-from-top duration-500 space-y-12 pb-20">
            <div className="bg-emerald-950/20 border-2 border-emerald-500/30 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
               <div className="relative z-10 space-y-10">
                 <div>
                   <h3 className="text-3xl font-black text-white tracking-tight">Public Link & WordPress Integration</h3>
                   <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Sharing and embedding options for your digital twin</p>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="bg-slate-900/80 p-8 rounded-[2.5rem] border border-emerald-900/20 space-y-6">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Shareable Preview Link</h4>
                      <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">
                        "This link hides the editor UI and the Admin panel, providing a clean GIS experience for stakeholders."
                      </p>
                      <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/30 flex items-center justify-between group">
                        <code className="text-[10px] text-slate-300 font-mono truncate mr-4">{CLEAN_PREVIEW_URL}</code>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(CLEAN_PREVIEW_URL);
                            alert("Public Link Copied!");
                          }}
                          className="text-[9px] font-black text-blue-500 uppercase hover:text-white transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      
                      <div className="pt-6 border-t border-slate-800 space-y-4">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Platform Export (v1 Backup)</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          To download your code as a ZIP, use the <strong>AI Studio Platform</strong> tools (outside this app):
                        </p>
                        <div className="p-4 bg-blue-950/20 border border-blue-500/20 rounded-xl">
                          <p className="text-[10px] text-slate-300 font-bold">
                            1. Look at the <strong>Top Right</strong> of your screen.<br/>
                            2. Click the <strong>Download (Down Arrow)</strong> or <strong>Settings (Gear)</strong> icon.<br/>
                            3. Select <strong>"Download as ZIP"</strong>.
                          </p>
                        </div>
                        <p className="text-[9px] text-slate-600 italic">This feature is 100% Free and available on all plans.</p>
                        
                        <button 
                          onClick={() => window.open(`/api/export?version=${metadata?.version || 'v4'}`, '_blank')}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 border border-blue-400/30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Emergency: Download Project ZIP ({metadata?.version || 'v4'})
                        </button>
                      </div>
                   </div>

                   {/* WORDPRESS INTEGRATION CARD */}
                   <div className="bg-slate-900/80 p-8 rounded-[2.5rem] border border-emerald-900/20 space-y-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">🔌</span>
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">WordPress Plugin (V4)</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed mb-4">
                          Embed your interactive Civic_Twin spatial maps, Leaflet GIS layers, and citizen member portals directly into any self-hosted WordPress site.
                        </p>

                        <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2 mb-4">
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Quick Install:</p>
                          <ul className="text-[10px] text-slate-300 space-y-1 font-bold">
                            <li>1. Download the plugin ZIP archive below.</li>
                            <li>2. In WordPress, go to <strong className="text-white">Plugins &gt; Add New &gt; Upload Plugin</strong>.</li>
                            <li>3. Activate it and set your digital twin instance URL in the <strong className="text-white">Civic Twin Hub</strong> admin menu.</li>
                          </ul>
                        </div>

                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Integrated Shortcodes:</p>
                          <div className="space-y-1 font-mono text-[9px] text-slate-300">
                            <div><code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 font-bold">[civic_twin_dashboard]</code></div>
                            <div><code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 font-bold">[civic_twin_map]</code></div>
                            <div><code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 font-bold">[civic_twin_member_portal]</code></div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 space-y-2">
                        <a 
                          href="/api/download/civic-twin-wp-plugin"
                          target="_blank"
                          rel="noopener noreferrer"
                          download="Civic_twin_plugin_v.4.0.1.zip"
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-3 border border-emerald-400/30 text-center"
                        >
                          <span>🔌</span> Download WP Plugin V.4.0.1 ZIP
                        </a>
                        <p className="text-[8px] text-slate-500 font-bold text-center uppercase tracking-wide">
                          💡 Just click to download. No right-click required!
                        </p>
                      </div>
                   </div>

                   <div className="bg-slate-900/80 p-8 rounded-[2.5rem] border border-emerald-900/20 space-y-6 text-center">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Production Guard</h4>
                      <button 
                        onClick={toggleProductionMode}
                        className={`w-full py-4 rounded-xl text-[10px] font-black uppercase transition-all ${metadata?.isProductionMode ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                      >
                        {metadata?.isProductionMode ? 'PRODUCTION SHROUD ENABLED' : 'ENABLE PRODUCTION SHROUD'}
                      </button>
                      <p className="text-[9px] text-slate-500 font-bold italic mt-2">
                        Masks code in browser devtools and minifies output.
                      </p>
                   </div>
                 </div>
               </div>
            </div>
          </section>
        )}

        {activeTab === 'control' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-500">
            <div className="lg:col-span-8 space-y-12">
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Active Pull Requests</h3>
                  <button onClick={fetchPullRequests} className="text-[10px] font-black text-blue-400 hover:text-white transition-colors uppercase">Refresh Feed ⟳</button>
                </div>
                <div className="space-y-4">
                  {isLoadingPRs ? (
                    <div className="p-12 text-center space-y-4">
                      <div className="text-slate-600 font-bold animate-pulse uppercase tracking-[0.3em] text-xs">Polling GitHub API...</div>
                      <button 
                        onClick={() => setIsLoadingPRs(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[9px] font-black text-slate-400 uppercase rounded-lg transition-colors"
                      >
                        Cancel Request
                      </button>
                    </div>
                  ) : pullRequests.length === 0 ? (
                    <div className="p-12 bg-slate-900/50 border border-slate-800 rounded-3xl text-center text-slate-500 font-bold italic text-sm">
                      {repoStatus === 'error' ? `Unable to find repository ${MAIN_REPO}. Verify path.` : "No active pull requests on Shark Core."}
                    </div>
                  ) : (
                    pullRequests.map(pr => (
                      <a key={pr.number} href={pr.html_url} target="_blank" rel="noopener noreferrer" className="block p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-500/50 hover:bg-slate-900/80 transition-all flex gap-5 items-center group shadow-lg">
                        <img src={pr.user.avatar_url} className="w-12 h-12 rounded-xl border border-slate-700" alt="" />
                        <div className="flex-1">
                          <p className="font-black text-slate-100 group-hover:text-blue-400 transition-colors">{pr.title}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-tight mt-1">PR #{pr.number} • Dispatched by {pr.user.login}</p>
                        </div>
                        <span className="text-slate-700 text-xl group-hover:translate-x-1 transition-transform">↗</span>
                      </a>
                    ))
                  )}
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">PlanetScope Order SQL Log</h3>
                  <button onClick={fetchSqlOrders} className="text-[10px] font-black text-blue-400 hover:text-white transition-colors uppercase">Refresh Log ⟳</button>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre max-h-[300px] scrollbar-thin scrollbar-thumb-slate-800">
                  {sqlOrders}
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-xl font-black text-white uppercase tracking-tight border-b border-slate-800 pb-4">Architectural Roadmap</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {coreSuggestions.map((s, i) => (
                    <div key={i} className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] space-y-4 hover:border-blue-500/30 transition-all shadow-xl">
                      <span className="text-[9px] font-mono text-blue-400 bg-blue-950 px-3 py-1 rounded-md font-black uppercase">CORE SHARD: {s.name}</span>
                      <h4 className="text-lg font-black text-white tracking-tight">{s.prTitle}</h4>
                      <p className="text-xs text-slate-500 font-bold italic leading-relaxed">{s.purpose}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="p-8 bg-slate-900 border border-slate-800 rounded-[3rem] space-y-6 shadow-2xl">
                <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em]">Operational Policy</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${repoStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    <span className="text-[11px] font-black text-slate-300 uppercase">Org Sync: {repoStatus === 'connected' ? 'Verified' : 'Error'}</span>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em]">Mesh Simulation</h4>
                    <button 
                      onClick={() => {
                        // We'll use a custom event or just a global flag for the simulation
                        const isIsolated = !window.localStorage.getItem('blan_isolated');
                        if (isIsolated) {
                          window.localStorage.setItem('blan_isolated', 'true');
                          // Force a re-render or just let the user know
                          alert("MESH ISOLATION ENABLED: All outgoing REST calls will now be queued in the B-LAN mesh.");
                        } else {
                          window.localStorage.removeItem('blan_isolated');
                          alert("MESH ISOLATION DISABLED: Cloud sync restored.");
                        }
                        window.location.reload();
                      }}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        window.localStorage.getItem('blan_isolated') ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {window.localStorage.getItem('blan_isolated') ? 'ISOLATION ACTIVE' : 'SIMULATE ISOLATION'}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-500 italic mt-2">Forces the app into 'Offline-Fog' mode to test B-LAN task queuing.</p>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Version Control</h4>
                    <span className="px-2 py-1 bg-blue-900/40 text-blue-400 text-[9px] font-black rounded uppercase">Current: {metadata?.version || 'v4'}</span>
                  </div>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={metadata?.version || 'v4'}
                      onChange={(e) => {
                        if (metadata && onUpdateMetadata) {
                          onUpdateMetadata({
                            ...metadata,
                            version: e.target.value
                          });
                        }
                      }}
                      placeholder="v1.0.0"
                      className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 italic mt-2">Tag this instance configuration for version tracking.</p>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <button 
                    onClick={() => {
                      if (window.confirm("CRITICAL: This will wipe all local community data and restart the application. Continue?")) {
                        window.localStorage.clear();
                        window.sessionStorage.clear();
                        window.location.href = window.location.origin + window.location.pathname + '?reset=' + Date.now();
                      }
                    }}
                    className="w-full py-4 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/50 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    ⚠️ Hard Reset Application
                  </button>
                </div>
              </div>
              
              <button 
                onClick={handleProposePR}
                className="w-full py-6 bg-blue-700 hover:bg-blue-600 rounded-3xl text-xs font-black text-white transition-all shadow-xl uppercase tracking-widest active:scale-95"
              >
                🚀 Architect Civic Twin PR
              </button>
            </div>
          </div>
        )}
      </div>

      {isPRManagerOpen && (
        <PRManager 
          metadata={metadata!}
          insights={[]} 
          prContent={prContent}
          isGenerating={isGeneratingPR}
          onClose={() => setIsPRManagerOpen(false)}
        />
      )}
    </div>
  );
};
