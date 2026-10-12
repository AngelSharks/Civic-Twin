
import React, { useState, useEffect } from 'react';
import { TwinMetadata, NeighborhoodBLan, ConnectivityStatus, TrafficSimState, HydrologySimState } from '../types';
import { Map } from './Map';

interface GISAnalysisProps {
  metadata: TwinMetadata;
  connectivity: ConnectivityStatus;
}

type AnalysisModule = 'connectivity' | 'water' | 'traffic' | 'emergency';

export const GISAnalysis: React.FC<GISAnalysisProps> = ({ metadata, connectivity }) => {
  const [activeModule, setActiveModule] = useState<AnalysisModule>('water');
  const [simulationActive, setSimulationActive] = useState(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [targetCid, setTargetCid] = useState<string>('all');
  
  // Traffic Simulation State
  const [trafficSim, setTrafficSim] = useState<TrafficSimState>({
    publicTransportAvailability: 45,
    trafficDensity: 60,
    peakHourDelay: 22
  });

  // Watershed & Hydrology Simulation State
  const [hydrologySim, setHydrologySim] = useState<HydrologySimState>({
    rainfallIntensity: 35, // mm/hr
    soilPermeability: 58, // %
    retentionBasinCapacity: 80, // %
    projectedRunoff: 14.8, // m3/s
    floodRiskLevel: 'LOW'
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

  // Recalculate Peak Hour Delay based on traffic params
  useEffect(() => {
    const baseDelay = 10;
    const densityImpact = (trafficSim.trafficDensity / 100) * 40;
    const transportRelief = (trafficSim.publicTransportAvailability / 100) * 15;
    const calculatedDelay = Math.max(0, Math.round(baseDelay + densityImpact - transportRelief));
    
    setTrafficSim(prev => ({ ...prev, peakHourDelay: calculatedDelay }));
  }, [trafficSim.publicTransportAvailability, trafficSim.trafficDensity]);

  // Recalculate Watershed Runoff & Flood Risk based on hydrology params
  useEffect(() => {
    const { rainfallIntensity, soilPermeability, retentionBasinCapacity } = hydrologySim;
    const rawRunoff = (rainfallIntensity * 0.55) * (1 - (soilPermeability / 100) * 0.5) * (1 - (retentionBasinCapacity / 100) * 0.25);
    const runoff = Math.max(1.2, Math.round(rawRunoff * 10) / 10);
    
    let risk: HydrologySimState['floodRiskLevel'] = 'LOW';
    if (runoff > 40) risk = 'CRITICAL';
    else if (runoff > 28) risk = 'ELEVATED';
    else if (runoff > 18) risk = 'MODERATE';

    setHydrologySim(prev => ({ ...prev, projectedRunoff: runoff, floodRiskLevel: risk }));
  }, [hydrologySim.rainfallIntensity, hydrologySim.soilPermeability, hydrologySim.retentionBasinCapacity]);

  const addLog = (msg: string) => {
    setSimLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  };

  const handleTrafficChange = (param: keyof TrafficSimState, value: number) => {
    setTrafficSim(prev => ({ ...prev, [param]: value }));
    addLog(`Traffic Parameter Adjusted: ${param} -> ${value}%`);
  };

  const handleHydroChange = (param: keyof HydrologySimState, value: number) => {
    setHydrologySim(prev => ({ ...prev, [param]: value }));
    addLog(`Hydrology Sim Parameter: ${param} -> ${value}`);
  };

  const triggerWatershedProtocol = async () => {
    setSimulationActive(true);
    addLog(`INITIATING AUTOMATED WATERSHED DRAINAGE & RETENTION PROTOCOL...`);
    await new Promise(r => setTimeout(r, 900));
    addLog(`WATERSHED GATE ACTUATION: Sub-basin spillways HG-01 & HG-02 opened to 65% capacity.`);
    await new Promise(r => setTimeout(r, 700));
    addLog(`INUNDATION RELIEF: Projected catchment runoff buffered. Retention telemetry stabilized.`);
    setSimulationActive(false);
  };

  const broadcastCidAlert = async () => {
    setSimulationActive(true);
    const scope = targetCid === 'all' ? 'GLOBAL REGION' : `CID-${targetCid}`;
    addLog(`BROADCASTING TO ${scope} via B-LAN CORE...`);
    await new Promise(r => setTimeout(r, 1200));
    addLog(`ALERT DISPATCHED: "Emergency Fog Node optimization complete for ${scope}"`);
    setSimulationActive(false);
  };

  const getRiskBadge = (risk: HydrologySimState['floodRiskLevel']) => {
    switch (risk) {
      case 'CRITICAL': return 'bg-rose-950 text-rose-300 border-rose-600';
      case 'ELEVATED': return 'bg-amber-950 text-amber-300 border-amber-600';
      case 'MODERATE': return 'bg-yellow-950 text-yellow-300 border-yellow-600';
      case 'LOW': default: return 'bg-emerald-950 text-emerald-300 border-emerald-600';
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-slate-950 text-slate-200 overflow-hidden">
      <aside className="w-full lg:w-[440px] border-r border-slate-800 flex flex-col overflow-hidden">
        <header className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Tactical GIS Core</h2>
            <p className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              {isFogMode ? "FOG NETWORK ACTIVE" : "SYNCHRONIZED WITH CLOUD"}
            </p>
          </div>
          <div className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-xl text-[10px] font-black text-slate-300 uppercase tracking-widest">
            HUC-12 ACTIVE
          </div>
        </header>

        <nav className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-col gap-2">
          {/* Top Line: Water and Traffic */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveModule('water')}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                activeModule === 'water'
                  ? 'bg-cyan-950 text-cyan-200 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className="text-sm">🌊</span>
              <span>Water</span>
            </button>

            <button
              onClick={() => setActiveModule('traffic')}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                activeModule === 'traffic'
                  ? 'bg-blue-950 text-blue-200 border-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className="text-sm">🚦</span>
              <span>Traffic</span>
            </button>
          </div>

          {/* 2nd Line: Connectivity and Emergency */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveModule('connectivity')}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                activeModule === 'connectivity'
                  ? 'bg-indigo-950 text-indigo-200 border-indigo-500/80 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className="text-sm">📡</span>
              <span>Connectivity</span>
            </button>

            <button
              onClick={() => setActiveModule('emergency')}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                activeModule === 'emergency'
                  ? 'bg-amber-950 text-amber-200 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className="text-sm">🚨</span>
              <span>Emergency</span>
            </button>
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* WATERSHED & HYDROLOGY MODULE */}
          {activeModule === 'water' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span>🌊</span> Watershed & Drainage Basin
                  </h3>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getRiskBadge(hydrologySim.floodRiskLevel)}`}>
                    {hydrologySim.floodRiskLevel} RISK
                  </span>
                </div>

                <div className="space-y-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                      <span>Rainfall Intensity</span>
                      <span className="text-cyan-400">{hydrologySim.rainfallIntensity} mm/hr</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" max="120" 
                      value={hydrologySim.rainfallIntensity}
                      onChange={(e) => handleHydroChange('rainfallIntensity', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                      <span>Soil Permeability / Infiltration</span>
                      <span className="text-emerald-400">{hydrologySim.soilPermeability}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" max="100" 
                      value={hydrologySim.soilPermeability}
                      onChange={(e) => handleHydroChange('soilPermeability', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                      <span>Retention Basin Capacity</span>
                      <span className="text-blue-400">{hydrologySim.retentionBasinCapacity}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" max="100" 
                      value={hydrologySim.retentionBasinCapacity}
                      onChange={(e) => handleHydroChange('retentionBasinCapacity', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-slate-900 to-cyan-950/30 border border-cyan-900/50 rounded-2xl text-center shadow-xl">
                  <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Projected Peak Runoff Discharge</p>
                  <p className="text-4xl font-black text-white tracking-tighter">
                    {hydrologySim.projectedRunoff} <span className="text-sm text-cyan-400 uppercase font-mono">m³/s</span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2">HUC-12 Unit Catchment Model</p>
                </div>
              </section>

              {/* Sub-Basin Catchment Breakdown */}
              <section className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Catchment Sub-Basins</h4>
                <div className="space-y-2.5">
                  {[
                    { id: '1807010501', name: 'Upper Catchment Drainage', area: '18.4 km²', coeff: '0.68', status: 'Optimal' },
                    { id: '1807010502', name: 'Central Urban Runoff', area: '24.2 km²', coeff: '0.82', status: 'High Density' },
                    { id: '1807010503', name: 'Lower Wetland Infiltration', area: '15.7 km²', coeff: '0.45', status: 'Retention' }
                  ].map((basin) => (
                    <div key={basin.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">HUC-{basin.id}</span>
                        </div>
                        <p className="text-xs font-bold text-white mt-0.5">{basin.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-200">{basin.area}</span>
                        <p className="text-[9px] text-slate-400 font-semibold">{basin.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <button 
                onClick={triggerWatershedProtocol}
                disabled={simulationActive}
                className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-2xl shadow-xl transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-95"
              >
                <span>🌊</span> TRIGGER DRAINAGE RETENTION PROTOCOL
              </button>
            </div>
          )}

          {/* TRAFFIC SIMULATION MODULE */}
          {activeModule === 'traffic' && (
            <div className="space-y-6 animate-in fade-in duration-300">
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
                      onChange={(e) => handleTrafficChange('publicTransportAvailability', parseInt(e.target.value))}
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
                      onChange={(e) => handleTrafficChange('trafficDensity', parseInt(e.target.value))}
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

          {/* CONNECTIVITY MODULE */}
          {activeModule === 'connectivity' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <section className="space-y-4">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">B-LAN Mesh Node Telemetry</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Total Relays</p>
                    <p className="text-2xl font-black text-white mt-1">1,240</p>
                    <span className="text-[9px] text-emerald-400 font-bold">100% Operational</span>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Avg Mesh Latency</p>
                    <p className="text-2xl font-black text-white mt-1">4.2 <span className="text-xs text-slate-500">ms</span></p>
                    <span className="text-[9px] text-indigo-400 font-bold">Sub-gigabit Sync</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Solar-Powered Fog Pods</span>
                    <span className="text-amber-400">92% Charged</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[92%]"></div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* EMERGENCY ALERT MODULE */}
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

          {/* SIMULATION TELEMETRY LOGS */}
          <section className="pt-6 border-t border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Digital Twin Logs</h4>
              <span className="text-[9px] font-mono text-cyan-400 font-bold animate-pulse">● LIVE</span>
            </div>
            <div className="h-[220px] bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs space-y-2.5 overflow-y-auto">
              {simLogs.length === 0 ? (
                <div className="text-slate-600 italic">No telemetry events recorded yet. Adjust sliders or trigger protocols above.</div>
              ) : (
                simLogs.map((log, i) => (
                  <div key={i} className={`font-bold leading-relaxed ${log.includes('WATERSHED') ? 'text-cyan-300' : log.includes('ALERT') ? 'text-amber-400' : 'text-slate-400'}`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </aside>

      <div className="flex-1 relative overflow-hidden">
        <Map 
          location={metadata.location!} 
          name={`${metadata.name} | GIS & WATERSHED ANALYSIS`} 
          isExpanded={true} 
          gisLayers={metadata.gisLayers}
        />
        
        {simulationActive && (
          <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
            <div className="p-8 rounded-3xl border border-cyan-500/50 bg-slate-900 shadow-2xl animate-pulse text-center">
               <span className="text-4xl block mb-3">🌊</span>
               <h3 className="text-xl font-black text-white uppercase tracking-tight">Actuating Watershed Controls</h3>
               <p className="text-cyan-400 font-bold text-xs mt-1">Modulating spillway gates & stormwater retention basins...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
