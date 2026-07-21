
import React, { useState, useEffect } from 'react';
import { MeshNode, TacticalAlert, TwinMetadata, DTNMetadata, InferenceTask } from '../types';
import { bLanService } from '../services/BLanService';

interface BLanTacticalPanelProps {
  nodes: MeshNode[];
  alerts: TacticalAlert[];
  metadata?: TwinMetadata | null;
}

export const BLanTacticalPanel: React.FC<BLanTacticalPanelProps> = ({ nodes, alerts, metadata }) => {
  const [meshPeers, setMeshPeers] = useState<DTNMetadata[]>([]);
  const [inferenceQueue, setInferenceQueue] = useState<InferenceTask[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMeshPeers(bLanService.getMeshStatus());
      setInferenceQueue(bLanService.getQueue());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in slide-in-from-right duration-500">
      {/* Mesh Status */}
      <section className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 shadow-lg shadow-rose-900/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Mesh Discovery (B-lan)</h3>
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        </div>
        
        <div className="space-y-3">
          {meshPeers.map(peer => (
            <div key={peer.node_id} className="flex flex-col bg-slate-950/50 p-3 rounded-xl border border-slate-800 gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full bg-emerald-500"></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-100 uppercase">{peer.node_id}</p>
                    <p className="text-[9px] text-slate-500 font-bold italic">{peer.hardware.npu_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-rose-400">{peer.hardware.vram_available_mb}MB VRAM</p>
                </div>
              </div>
              <div className="flex justify-between text-[8px] font-black uppercase text-slate-600 tracking-tighter">
                <span>Latency: {peer.network.avg_latency_ms}ms</span>
                <span>Hops: {peer.network.mesh_hops_to_gateway}</span>
                <span>Power: {peer.hardware.power_source} ({Math.round(peer.hardware.battery_level * 100)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Inference Queue */}
      <section className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4">
        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Distributed Inference Queue</h3>
        <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {inferenceQueue.length === 0 ? (
            <p className="text-[9px] text-slate-600 italic">No pending mesh tasks.</p>
          ) : (
            inferenceQueue.map(task => (
              <div key={task.id} className="p-2 bg-slate-950/50 border border-slate-800 rounded-lg flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase">{task.id}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                    task.status === 'COMPLETED' ? 'bg-emerald-900/40 text-emerald-400' :
                    task.status === 'CLAIMED' ? 'bg-blue-900/40 text-blue-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 truncate">{task.input_data}</p>
                {task.worker_id && (
                  <p className="text-[8px] text-slate-500 italic">Processed by: {task.worker_id}</p>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Tactical Comms */}
      <section className="flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Emergency Comms Log</h3>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
          {alerts.map((alert, i) => (
            <div key={i} className={`p-3 rounded-xl text-xs font-medium border-l-2 ${
              alert.priority === 'critical' ? 'bg-rose-950/20 border-rose-600 text-rose-200' : 'bg-slate-950/40 border-slate-700 text-slate-300'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-[9px] uppercase tracking-wider text-slate-500">{alert.sender}</span>
                <span className="text-[9px] font-mono text-slate-600">{alert.timestamp}</span>
              </div>
              <p className="leading-relaxed">{alert.message}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800">
          <input 
            type="text" 
            placeholder="Broadcast to Resident Mesh..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-rose-500/50 transition-colors"
          />
        </div>
      </section>
    </div>
  );
};
