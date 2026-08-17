
import React, { useState, useEffect } from 'react';
import { TwinMetadata, NeighborhoodBLan, ConnectivityStatus, TrafficSimState } from '../types';
import { Map } from './Map';

interface GISAnalysisProps {
  metadata: TwinMetadata;
  connectivity: ConnectivityStatus;
}

type AnalysisModule = 'connectivity' | 'water' | 'traffic' | 'emergency';

export const GISAnalysis: React.FC<GISAnalysisProps> = ({ metadata, connectivity }) => {
  const [activeModule, setActiveModule] = useState<AnalysisModule>('connectivity');
  const [simulationActive, setSimulationActive] = useState(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [targetCid, setTargetCid] = useState<string>('all');
  
  // Traffic Simulation State
  const [trafficSim, setTrafficSim] = useState<TrafficSimState>({
    publicTransportAvailability: 45,
    trafficDensity: 60,
    peakHourDelay: 22
  });

  const isFogMode = connectivity === 'offline-fog';
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodBLan[]>([]);

  useEffect(() => {
    const generated = metadata.cids.map((cid) => ({
      name: cid.name,
      nodes: Math.floor(Math.random() * 200) + 50,
      health: cid.meshActive ? 95 : 40,
      status: (cid.meshActive ? 'stable' : 'degraded') as NeighborhoodBLan['status'],
      cid: cid.id
    }));
    setNeighborhoods(generated);
  }, [metadata]);

  // Recalculate Peak Hour Delay based on simulation params
  useEffect(() => {
    const baseDelay = 10;
    const densityImpact = (trafficSim.trafficDensity / 100) * 40;
    const transportRelief = (trafficSim.publicTransportAvailability / 100) * 15;
    const calculatedDelay = Math.max(0, Math.round(baseDelay + densityImpact - transportRelief));
    
    setTrafficSim(prev => ({ ...prev, peakHourDelay: calculatedDelay }));
  }, [trafficSim.publicTransportAvailability, trafficSim.trafficDensity]);

  const addLog = (msg: string) => {
    setSimLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15));
  };

  const handleSimChange = (param: keyof TrafficSimState, value: number) => {
    setTrafficSim(prev => ({ ...prev, [param]: value }));
    addLog(`Sim Parameter Changed: ${param} set to ${value}%`);
  };

  const broadcastCidAlert = async () => {
    setSimulationActive(true);
    const scope = targetCid === 'all' ? 'GLOBAL REGION' : `CID-${targetCid}`;
    addLog(`BROADCASTING TO ${scope} via B-LAN CORE...`);
    await new Promise(r => setTimeout(r, 1200));
    addLog(`ALERT DISPATCHED: "Emergency Fog Node optimization complete for ${scope}"`);
    setSimulationActive(false);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-slate-950 text-slate-200 overflow-hidden">
      <aside className="w-full lg:w-[420px] border-r border-slate-800 flex flex-col overflow-hidden">
        <header className="p-6 border-b border-slate-800 bg-slate-900/50">
           <h2 className="text-xl font-black text-white tracking-tight">Tactical GIS Core</h2>
           <p className="text-xs font-black text-amber-500 uppercase tracking-widest">
             {isFogMode ? "FOG NETWORK ACTIVE" : "SYNCHRONIZED WITH CLOUD"}
           </p>
        </header>

        <nav className="flex border-b border-slate-800 overflow-x-auto no-scrollbar">
          {(['connectivity', 'water', 'traffic', 'emergency'] as AnalysisModule[]).map(mod => (
            <button
              key={mod}
              onClick={() => setActiveModule(mod)}
              className={`flex-1 min-w-[100px] py-5 text-xs font-black uppercase tracking-widest transition-all ${
                activeModule === mod ? 'text-white border-b-2 border-amber-500 bg-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mod}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-800">
          
          {activeModule === 'traffic' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <section className="space-y-6">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">Urban Flow Parameters</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                      <span>Public Transport Availability</span>
                      <span className="text-blue-400">{trafficSim.publicTransportAvailability}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={trafficSim.publicTransportAvailability}
                      onChange={(e) => handleSimChange('publicTransportAvailability', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                      <span>Traffic Density</span>
                      <span className="text-rose-400">{trafficSim.trafficDensity}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={trafficSim.trafficDensity}
                      onChange={(e) => handleSimChange('trafficDensity', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                </div>

                <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2rem] text-center shadow-xl">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Projected Peak Hour Delay</p>
                  <p className="text-5xl font-black text-white tracking-tighter">
                    {trafficSim.peakHourDelay} <span className="text-sm text-slate-500 uppercase">min</span>
                  </p>
                  <p className="text-[9px] font-bold text-blue-400 mt-2 italic">Calculated via Civic Twin Simulation Engine</p>
                </div>
              </section>
            </div>
          )}

          {activeModule === 'emergency' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left duration-300">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest">B-LAN CID Targeting</h3>
                  <select 
                    value={targetCid}
                    onChange={(e) => setTargetCid(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] font-black text-blue-400 outline-none"
                  >
                    <option value="all">Global Broadcast</option>
                    {metadata.cids.map(c => <option key={c.id} value={c.id}>CID-{c.id} ({c.name})</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {neighborhoods.map(n => (
                    <div key={n.cid} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CID-{n.cid}</span>
                        <span className={`w-2 h-2 rounded-full ${n.status === 'stable' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      </div>
                      <p className="text-sm font-black text-white truncate mb-4">{n.name}</p>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${n.health}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <button 
                onClick={broadcastCidAlert}
                disabled={simulationActive}
                className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-95"
              >
                📡 BROADCAST TARGETED ALERT
              </button>
            </div>
          )}

          <section className="pt-8 border-t border-slate-800 space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Digital Twin Logs (Fog Active)</h4>
            <div className="h-[250px] bg-slate-950 border border-slate-800 rounded-2xl p-5 font-mono text-xs space-y-3 overflow-y-auto">
              {simLogs.map((log, i) => (
                <div key={i} className={`font-bold ${log.includes('ALERT') ? 'text-amber-400' : 'text-slate-400'}`}>
                  {log}
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>

      <div className="flex-1 relative overflow-hidden">
        <Map location={metadata.location!} name={`${metadata.name} | B-LAN ANALYSIS`} isExpanded={true} />
        
        {simulationActive && (
          <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
            <div className="p-10 rounded-3xl border border-amber-500/50 bg-slate-900 shadow-2xl animate-pulse text-center">
               <h3 className="text-2xl font-black text-white uppercase tracking-tight">Syncing B-LAN Hubs</h3>
               <p className="text-amber-400 font-bold">CID Communities within Mesh network...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
