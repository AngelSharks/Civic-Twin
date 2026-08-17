
import React, { useState } from 'react';
import { SmartCityInsight } from '../types';

interface DataLayerCardProps {
  insight: SmartCityInsight;
}

export const DataLayerCard: React.FC<DataLayerCardProps> = ({ insight }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'optimal': return { color: 'text-emerald-800 bg-emerald-100 border-emerald-300', icon: 'check_circle', glow: 'shadow-emerald-200/50' };
      case 'warning': return { color: 'text-amber-900 bg-amber-100 border-amber-300', icon: 'error_outline', glow: 'shadow-amber-200/50' };
      case 'critical': return { color: 'text-rose-900 bg-rose-100 border-rose-300', icon: 'report_problem', glow: 'shadow-rose-200/50' };
      default: return { color: 'text-slate-800 bg-slate-100 border-slate-300', icon: 'help_outline', glow: 'shadow-slate-200/50' };
    }
  };

  const config = getStatusConfig(insight.status);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 2000);
  };

  return (
    <>
      <div 
        role="button"
        tabIndex={0}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
        className="bg-white border border-slate-300 rounded-[2rem] p-6 sm:p-8 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col cursor-pointer h-full focus-visible:ring-4 focus-visible:ring-blue-600/30"
        aria-label={`View ${insight.layer} details. Status: ${insight.status}`}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 min-w-0 mr-3">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-1 truncate">{insight.layer}</h3>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter truncate">{insight.value}</p>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-xs font-black border tracking-wider shrink-0 shadow-sm ${config.color}`}>
            {insight.status.toUpperCase()}
          </div>
        </div>
        
        <p className="text-sm sm:text-base text-slate-700 mb-8 leading-relaxed font-bold line-clamp-3">
          {insight.summary}
        </p>

        <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest">Digital Twin Guidance</h4>
            <span className="text-blue-700 text-xs font-black group-hover:translate-x-1 transition-transform" aria-hidden="true">Details →</span>
          </div>
          <div className="space-y-3">
            {insight.recommendations.slice(0, 2).map((rec, i) => (
              <div key={i} className="flex items-start gap-4 group/item">
                <div className="w-5 h-5 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-black text-blue-700 shrink-0 transition-colors">
                  {i + 1}
                </div>
                <p className="text-xs text-slate-700 font-bold leading-tight pt-0.5 line-clamp-1">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div 
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl animate-in fade-in duration-300" 
            onClick={() => setIsModalOpen(false)} 
          />
          
          <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            {/* Header */}
            <div className={`px-8 py-6 border-b flex items-center justify-between ${config.color}`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/50 rounded-2xl shadow-sm" aria-hidden="true">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h2 id="modal-title" className="text-xl font-black tracking-tight">{insight.layer} Simulation Core</h2>
                  <p className="text-xs font-black opacity-80 uppercase tracking-widest">NIST Smart City Layer Interface</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 hover:bg-black/5 rounded-full transition-colors text-slate-900 font-black text-xl"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12">
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Live Telemetry</h3>
                    <div className="flex items-baseline gap-4">
                      <p className="text-6xl font-black text-slate-900 tracking-tighter">{insight.value}</p>
                      <span className={`px-4 py-1.5 rounded-lg text-xs font-black border uppercase ${config.color}`}>
                        {insight.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                    <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">AI Engine Summary</h4>
                    <p className="text-lg text-slate-800 leading-relaxed font-bold">
                      {insight.summary}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">Interactive Controls</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={handleRunSimulation}
                      disabled={isSimulating}
                      className="w-full p-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-between hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-slate-900/30"
                    >
                      <span className="flex items-center gap-3">
                        {isSimulating ? '🔄 Running...' : '🚀 Run Stress Test'}
                      </span>
                      {!isSimulating && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded uppercase tracking-widest font-black">AI SIM</span>}
                    </button>
                    <button className="w-full p-5 bg-blue-50 text-blue-800 border border-blue-300 rounded-2xl font-black flex items-center justify-between hover:bg-blue-100 transition-all active:scale-[0.98]">
                      <span>📡 Toggle Mesh Relay</span>
                      <div className="w-10 h-5 bg-blue-200 rounded-full relative" aria-hidden="true">
                        <div className="absolute left-1 top-1 w-3 h-3 bg-blue-700 rounded-full"></div>
                      </div>
                    </button>
                    <button className="w-full p-5 bg-slate-100 text-slate-500 border border-slate-300 rounded-2xl font-black flex items-center justify-between cursor-not-allowed opacity-60">
                      <span>🏛️ Local Gov Override</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Locked</span>
                    </button>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-xs font-black text-blue-800 uppercase tracking-widest">Strategic Recommendations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {insight.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-4 p-6 bg-blue-50 border border-blue-200 rounded-3xl hover:bg-blue-100 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-slate-900 font-black leading-relaxed text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="p-8 bg-slate-900 rounded-[2rem] text-white flex flex-col lg:flex-row items-center justify-between gap-8">
                <div>
                  <h4 className="text-xl font-black mb-2">Historical Drift Analysis</h4>
                  <p className="text-slate-300 font-bold leading-relaxed">Predictive modeling suggests a 12% increase in efficiency if layer-3 BIM nodes are synchronized.</p>
                </div>
                <div className="flex gap-2" aria-hidden="true">
                  <div className="w-1.5 h-12 bg-emerald-500 rounded-full opacity-30"></div>
                  <div className="w-1.5 h-12 bg-emerald-500 rounded-full opacity-50"></div>
                  <div className="w-1.5 h-12 bg-emerald-500 rounded-full"></div>
                  <div className="w-1.5 h-12 bg-emerald-500 rounded-full opacity-60"></div>
                  <div className="w-1.5 h-12 bg-rose-500 rounded-full"></div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
