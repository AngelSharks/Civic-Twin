
import React, { useState, useEffect, useMemo } from 'react';
import { TwinMetadata, SmartCityInsight, MeshNode, TacticalAlert, ConnectivityStatus, CIDUser } from '../types';
import { Map } from './Map';
import { DataLayerCard } from './DataLayerCard';
import { BLanTacticalPanel } from './BLanTacticalPanel';
import { VoiceBroadcast } from './VoiceBroadcast';
import { FeedbackModal } from './FeedbackModal';
import { PRManager } from './PRManager';
import { generatePRSummary } from '../services/geminiService';

interface DashboardProps {
  metadata: TwinMetadata;
  insights: SmartCityInsight[];
  isLoading: boolean;
  onRefresh: () => void;
  onReset: () => void;
  connectivity: ConnectivityStatus;
  user: CIDUser;
  isTacticalLocked?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ metadata, insights, isLoading, onRefresh, onReset, connectivity, user, isTacticalLocked }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isPRManagerOpen, setIsPRManagerOpen] = useState(false);
  const [prContent, setPrContent] = useState<{ title: string; body: string } | null>(null);
  const [isGeneratingPR, setIsGeneratingPR] = useState(false);
  
  const isFogMode = connectivity === 'offline-fog';
  const hasAuthority = user.role === 'MAYOR' || user.role === 'CITY_MANAGER';
  const isGuest = user.id === 'GUEST';

  const meshNodes = useMemo<MeshNode[]>(() => [
    { id: 'FOG-PRIMARY-01', status: 'active', signal: 98, type: 'Fog', cidRef: metadata.cids[0]?.id },
    { id: 'B-LAN-RELAY-A', status: 'active', signal: 72, type: 'Static', cidRef: metadata.cids[1]?.id },
    { id: 'MOBILE-HUB-X', status: 'relay', signal: 55, type: 'Mobile', cidRef: metadata.cids[2]?.id },
  ], [metadata.cids]);

  const tacticalAlerts = useMemo<TacticalAlert[]>(() => {
    if (isFogMode || metadata.isEmergencyMode) {
      return [
        { timestamp: 'L-14:22', sender: 'FOG-COORD', message: 'Internet disrupted. B-lan Core syncing CID Community networks.', priority: 'high' },
        { timestamp: 'L-14:30', sender: 'B-LAN-SYS', message: 'PID Shard Auth active across CID-772.', priority: 'critical' },
      ];
    }
    return [];
  }, [isFogMode, metadata.isEmergencyMode]);

  const handleStagePR = async () => {
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

  return (
    <div className={`flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative ${isFogMode || metadata.isEmergencyMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Sidebar with Shard Persistence Status */}
      <aside className={`
        fixed inset-y-0 left-0 z-[1800] w-full max-w-[300px] border-r transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isFogMode || metadata.isEmergencyMode ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/50' : 'bg-white border-slate-200'}
      `} aria-label="City Metadata Sidebar">
        <div className="h-full flex flex-col p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300">
          
          <div className="mb-8">
            <div className={`flex items-center gap-2 text-[10px] font-black mb-2 uppercase tracking-[0.2em] ${isFogMode ? 'text-amber-500' : 'text-emerald-700'}`}>
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isFogMode ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-emerald-600'}`}></span>
              {isFogMode ? 'FOG SHARED SHARD ACTIVE' : 'CLOUD SYNCHRONIZED'}
            </div>
            <h2 className="text-2xl font-black leading-tight mb-2">{metadata.name}</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700">
                {metadata.version || 'v2'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${isGuest ? 'bg-slate-200 text-slate-500' : isFogMode ? 'bg-amber-900/40 text-amber-300' : 'bg-slate-200 text-slate-700'}`}>
                {isGuest ? 'PUBLIC VIEWER' : user.role}
              </span>
              {!isGuest && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-blue-900/40 text-blue-300">
                  CID-{user.cid}
                </span>
              )}
            </div>
          </div>

          <nav className="space-y-8 flex-1">
            <section className={`p-4 bg-slate-950 border border-slate-800 rounded-2xl`}>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Mesh Telemetry</h3>
              <div className="space-y-2 text-[11px] font-bold">
                <div className="flex justify-between">
                  <span>Shard Persistence</span>
                  <span className="text-emerald-500">100%</span>
                </div>
                <div className="flex justify-between">
                  <span>PID Member Count</span>
                  <span className="text-blue-400">1,240</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Regional CIDs</h3>
              <div className="space-y-2">
                {metadata.cids.map(cid => (
                  <div key={cid.id} className={`p-3 rounded-xl border flex items-center justify-between ${isFogMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">CID-{cid.id}</p>
                      <p className="text-xs font-bold text-slate-300 truncate w-32">{cid.name}</p>
                    </div>
                    <span className={`w-1.5 h-1.5 rounded-full ${cid.meshActive ? 'bg-emerald-500' : 'bg-rose-500 opacity-30'}`}></span>
                  </div>
                ))}
              </div>
            </section>

            {/* SYSTEM CONTROL - Visible to all for demo/dev purposes */}
            <section className="pt-6 border-t border-slate-800 space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">System Control</h3>
              
              {/* PR STAGING - Allow publishing if a token is present or for any user in this dev build */}
              <button 
                onClick={handleStagePR}
                className="w-full py-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <span>📦</span> Daily Backup / Stage PR
              </button>

              <a 
                href="https://github.com/AngelSharks/Civic-Twin/archive/refs/heads/main.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <span>📥</span> Download Latest Main (ZIP)
              </a>

              <a 
                href="/api/download/civic-twin-wp-plugin"
                target="_blank"
                rel="noopener noreferrer"
                download="Civic_twin_plugin_v.4.0.1.zip"
                className="w-full py-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <span>🔌</span> WP Plugin V.4.0.1 (ZIP)
              </a>
              
              <button 
                onClick={onRefresh}
                className="w-full py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <span>🔄</span> Force Cloud Sync
              </button>

              <div className="pt-4 border-t border-slate-800">
                <button 
                  onClick={onReset}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2"
                >
                  <span>🚀</span> RESTART / NEW CITY
                </button>
              </div>
            </section>
          </nav>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <button
              onClick={onRefresh}
              disabled={isLoading || isFogMode}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-30 transition-all ${isFogMode ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-slate-900 text-white'}`}
            >
              {isFogMode ? 'SYNC BLOCKED (FOG)' : isLoading ? 'REFRESHING...' : 'FORCE CLOUD SYNC'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative" role="main">
        {isFogMode && (
          <div className="bg-amber-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-center shadow-lg relative z-10 animate-pulse">
            B-LAN SHARED SHARD SPACE ACTIVE: SECURE LOCAL PERSISTENCE
          </div>
        )}

        <div className="flex-1 flex flex-col xl:flex-row overflow-hidden relative">
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <div className={`transition-all duration-500 p-4 lg:p-6 relative h-[60vh] pb-0`}>
              <div className="h-full rounded-3xl overflow-hidden relative shadow-2xl border-4 border-white group">
                {metadata.location && (
                  <Map 
                    location={metadata.location} 
                    name={metadata.name} 
                    isExpanded={false} 
                    gisLayers={metadata.gisLayers}
                  />
                )}
                {/* Full Screen Trigger Overlay */}
                <button 
                  onClick={() => setIsMapModalOpen(true)}
                  className="absolute bottom-6 right-6 z-[1001] bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-200 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                  aria-label="Open Full Screen Map"
                >
                  <span className="text-lg">↗</span> Full Screen Analysis
                </button>
              </div>
            </div>

            <div className={`p-4 sm:p-6 lg:p-10 transition-all duration-500`}>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 space-y-8">
                  <header className="flex items-end justify-between">
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">Intelligence Matrix</h3>
                      <p className="text-xs font-black uppercase tracking-widest opacity-60">NIST Data Layers</p>
                    </div>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {insights.map((insight, idx) => (
                      <DataLayerCard key={idx} insight={insight} />
                    ))}
                  </div>
                </div>

                <div className={`space-y-10 transition-all duration-500 ${isGuest ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                  {hasAuthority && <VoiceBroadcast user={user} />}
                  <BLanTacticalPanel nodes={meshNodes} alerts={tacticalAlerts} metadata={metadata} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL SCREEN MAP MODAL (POP-UP) */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-[9000] flex flex-col bg-slate-900 animate-in fade-in duration-300">
          <header className="absolute top-6 left-1/2 -translate-x-1/2 z-[9100] w-[95%] max-w-5xl px-8 py-4 bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-white/50 shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">🗺️</div>
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Immersive Analysis Mode</p>
                <h4 className="text-xs font-black text-slate-900">{metadata.name} Spatial Twin</h4>
              </div>
            </div>
            <button 
              onClick={() => setIsMapModalOpen(false)}
              className="px-6 py-2.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              Exit Immersive
            </button>
          </header>
          
          <div className="flex-1 w-full h-full relative">
            {metadata.location && (
              <Map 
                location={metadata.location} 
                name={metadata.name} 
                isExpanded={true} 
                gisLayers={metadata.gisLayers}
              />
            )}
          </div>
        </div>
      )}

      {isFeedbackOpen && (
        <FeedbackModal onClose={() => setIsFeedbackOpen(false)} />
      )}

      {isPRManagerOpen && (
        <PRManager 
          metadata={metadata}
          insights={insights}
          prContent={prContent}
          isGenerating={isGeneratingPR}
          onClose={() => setIsPRManagerOpen(false)}
        />
      )}
    </div>
  );
};
