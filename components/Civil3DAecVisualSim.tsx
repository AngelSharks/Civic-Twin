import React, { useState, useMemo, useRef } from 'react';
import {
  Civil3DAecModel,
  AECElement,
  SAMPLE_CIVIL3D_AEC_MODELS,
  simulateAecModelSolarYield,
  parseImportedCivil3DFile
} from '../services/autodeskAecDataModel';

interface Civil3DAecVisualSimProps {
  onCommitToTwin?: (model: Civil3DAecModel) => void;
  onExportLandXml?: () => void;
}

export const Civil3DAecVisualSim: React.FC<Civil3DAecVisualSimProps> = ({
  onCommitToTwin
}) => {
  // Model state
  const [selectedModel, setSelectedModel] = useState<Civil3DAecModel>(SAMPLE_CIVIL3D_AEC_MODELS[0]);
  const [activeElementId, setActiveElementId] = useState<string>(SAMPLE_CIVIL3D_AEC_MODELS[0].elements[0]?.id || '');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Simulation controls
  const [hourOfDay, setHourOfDay] = useState<number>(13.0); // 1:00 PM default
  const [ambientTempC, setAmbientTempC] = useState<number>(22.0);
  const [simVisualMode, setSimVisualMode] = useState<'irradiance' | 'categories' | 'stress' | 'shadows'>('irradiance');
  const [viewAngle, setViewAngle] = useState<'iso' | 'top' | 'front' | 'elevation'>('iso');
  const [isSimPlaying, setIsSimPlaying] = useState<boolean>(false);
  const playIntervalRef = useRef<number | null>(null);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Run dynamic solar simulation on current model
  const simResult = useMemo(() => {
    return simulateAecModelSolarYield(selectedModel, hourOfDay, ambientTempC);
  }, [selectedModel, hourOfDay, ambientTempC]);

  const activeElement = useMemo(() => {
    return simResult.simulatedModel.elements.find(el => el.id === activeElementId) || simResult.simulatedModel.elements[0];
  }, [simResult.simulatedModel.elements, activeElementId]);

  // Handle play/pause diurnal animation
  const togglePlay = () => {
    if (isSimPlaying) {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      setIsSimPlaying(false);
    } else {
      setIsSimPlaying(true);
      playIntervalRef.current = window.setInterval(() => {
        setHourOfDay(prev => {
          if (prev >= 17.5) return 6.5;
          return Number((prev + 0.25).toFixed(2));
        });
      }, 350);
    }
  };

  // Handle file import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedModel = parseImportedCivil3DFile(content, file.name);
        setSelectedModel(parsedModel);
        setActiveElementId(parsedModel.elements[0]?.id || '');
        setImportNotification(`Successfully imported "${file.name}" with ${parsedModel.elements.length} granular AEC elements!`);
        setTimeout(() => setImportNotification(null), 5000);
      } catch (err) {
        console.error('File parse error:', err);
        setImportNotification(`Error importing ${file.name}. Falling back to sample model.`);
        setTimeout(() => setImportNotification(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  // Export current model as Autodesk AEC Data Model JSON
  const handleExportAecJson = () => {
    const jsonStr = JSON.stringify(simResult.simulatedModel, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedModel.modelId}-autodesk-aec-datamodel.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Format hour for human display
  const formatTime = (h: number) => {
    const hour = Math.floor(h);
    const minutes = Math.round((h - hour) * 60);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Filter elements for inspector tree
  const filteredElements = useMemo(() => {
    if (filterCategory === 'ALL') return simResult.simulatedModel.elements;
    return simResult.simulatedModel.elements.filter(el => el.system === filterCategory);
  }, [simResult.simulatedModel.elements, filterCategory]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Autodesk AEC Data Model Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/30 rounded-3xl p-5 lg:p-6 shadow-2xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-400/40 rounded-full text-[10px] font-black uppercase tracking-wider">
                Autodesk AEC Data Model • Granular BIM Simulation
              </span>
              <a
                href="https://linktr.ee/autodeskdata"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-300 hover:text-amber-200 underline font-mono flex items-center gap-1"
              >
                <span>🔗</span> linktr.ee/autodeskdata
              </a>
              <a
                href="https://www.autodesk.com/blogs/aec/roadmap/aec-data-model-roadmap/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-purple-300 hover:text-purple-200 underline font-mono flex items-center gap-1"
              >
                <span>🗺️</span> AEC Roadmap
              </a>
            </div>
            <h3 className="text-xl lg:text-2xl font-black text-white mt-1 flex items-center gap-2.5">
              <span>🏗️</span> Civil 3D Solar Canopy Model Import &amp; Visual Simulation
            </h3>
            <p className="text-xs text-slate-300 max-w-4xl mt-0.5">
              Break down monolithic CAD files into granular, cloud-connected BIM elements. Inspect component-level property sets, structural ASTM specifications, drilled-shaft foundations, and live sun-angle irradiance simulation.
            </p>
          </div>

          {/* Action Buttons: Import & Export */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xml,.json,.dxf"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-sky-600/25 transition-all"
            >
              <span>📂</span> Import Civil 3D / AEC Model (.xml / .json)
            </button>
            <button
              type="button"
              onClick={handleExportAecJson}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
              title="Export complete model in Autodesk AEC Data Model v2 JSON schema"
            >
              <span>📥</span> Export AEC JSON
            </button>
            {onCommitToTwin && (
              <button
                type="button"
                onClick={() => onCommitToTwin(simResult.simulatedModel)}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all"
              >
                <span>💾</span> Commit to Twin
              </button>
            )}
          </div>
        </div>

        {/* Model Selector Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pre-Loaded Sample Models:
          </span>
          {SAMPLE_CIVIL3D_AEC_MODELS.map(m => (
            <button
              key={m.modelId}
              type="button"
              onClick={() => {
                setSelectedModel(m);
                setActiveElementId(m.elements[0]?.id || '');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedModel.modelId === m.modelId
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              {m.name.split('—')[0].trim()}
            </button>
          ))}
        </div>

        {importNotification && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center gap-2 font-mono animate-fade-in">
            <span>✅</span> {importNotification}
          </div>
        )}
      </div>

      {/* 4 Live Simulation Metric Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-3.5 shadow-lg">
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">Instant Solar Output</div>
          <div className="text-xl lg:text-2xl font-black text-amber-300 mt-0.5">
            {simResult.instantaneousTotalKw} <span className="text-sm font-normal text-slate-400">kWac</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {formatTime(hourOfDay)} • Sun El. {simResult.sunVector.elevationDeg}°
          </div>
        </div>

        <div className="bg-slate-900/90 border border-sky-500/40 rounded-2xl p-3.5 shadow-lg">
          <div className="text-[10px] font-black uppercase tracking-wider text-sky-400">Plane-of-Array Irradiance</div>
          <div className="text-xl lg:text-2xl font-black text-sky-300 mt-0.5">
            {simResult.totalIrradianceWm2} <span className="text-sm font-normal text-slate-400">W/m²</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Azimuth: {simResult.sunVector.azimuthDeg}° (Santa Barbara)
          </div>
        </div>

        <div className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-3.5 shadow-lg">
          <div className="text-[10px] font-black uppercase tracking-wider text-purple-400">Granular Elements</div>
          <div className="text-xl lg:text-2xl font-black text-purple-300 mt-0.5">
            {selectedModel.elements.length} <span className="text-sm font-normal text-slate-400">BIM Objects</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {selectedModel.metrics.concreteShaftsCount} Shafts • {selectedModel.metrics.evChargingPorts} EV Ports
          </div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-3.5 shadow-lg">
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Embodied Carbon</div>
          <div className="text-xl lg:text-2xl font-black text-emerald-300 mt-0.5">
            {selectedModel.metrics.totalEmbodiedCarbonTons} <span className="text-sm font-normal text-slate-400">Tons CO2e</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {selectedModel.metrics.structuralSteelTons} Tons Steel (ASTM A992)
          </div>
        </div>
      </div>

      {/* Main Simulation Studio: Left 3D Visualizer, Right AEC Data Model Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (7 cols): Interactive 3D Visual Simulation Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            
            {/* Canvas Header & View Switchers */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h4 className="text-sm font-black text-white">
                  3D Digital Twin Visualizer
                </h4>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  {selectedModel.coordinateSystem.split('-')[0].trim()}
                </span>
              </div>

              {/* View Angles & Shading Mode */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-[10px] font-bold">
                  {(['iso', 'top', 'front'] as const).map(angle => (
                    <button
                      key={angle}
                      type="button"
                      onClick={() => setViewAngle(angle)}
                      className={`px-2 py-1 rounded-lg uppercase transition-all ${
                        viewAngle === angle ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {angle}
                    </button>
                  ))}
                </div>

                <select
                  value={simVisualMode}
                  onChange={(e) => setSimVisualMode(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-xl px-2.5 py-1 text-xs"
                >
                  <option value="irradiance">☀️ Solar Irradiance (W/m²)</option>
                  <option value="categories">🎨 BIM Element Categories</option>
                  <option value="stress">⚙️ AISC Structural Stress</option>
                  <option value="shadows">🌑 Solar Shadow Rays</option>
                </select>
              </div>
            </div>

            {/* Interactive SVG 3D Canvas */}
            <div className="w-full h-96 relative my-2 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-center select-none overflow-hidden">
              
              {/* Sun Position Indicator */}
              <div
                className="absolute transition-all duration-300 z-20 pointer-events-none flex flex-col items-center"
                style={{
                  left: `${((hourOfDay - 6) / 12) * 85 + 7}%`,
                  top: `${Math.max(10, 85 - (simResult.sunVector.elevationDeg / 80) * 70)}%`
                }}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_25px_rgba(251,191,36,0.8)] flex items-center justify-center text-slate-950 text-sm font-bold animate-pulse">
                  ☀️
                </div>
                <span className="text-[9px] font-mono text-amber-300 font-bold bg-slate-950/80 px-1.5 py-0.5 rounded mt-1 border border-amber-500/30">
                  {formatTime(hourOfDay)} ({simResult.sunVector.elevationDeg}°)
                </span>
              </div>

              {/* 3D Geometric Representation */}
              <svg viewBox="-300 -180 600 360" className="w-full h-full overflow-visible font-mono">
                <defs>
                  {/* Grid / Ground pattern */}
                  <pattern id="asphaltGrid" width="40" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 0 10 L 20 0 L 40 10 L 20 20 Z" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                  </pattern>

                  {/* Shading gradients */}
                  <linearGradient id="pvSolarGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>

                  <linearGradient id="steelColGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#94a3b8" />
                  </linearGradient>
                </defs>

                {/* Ground Plane (Parking Lot Asphalt) */}
                <polygon
                  points="-260,80 0,160 260,80 0,0"
                  fill="#0b0f19"
                  stroke="#1e293b"
                  strokeWidth="2"
                />

                {/* Parking Stall Striping Lines */}
                {[-180, -120, -60, 0, 60, 120, 180].map((xOffset) => (
                  <line
                    key={xOffset}
                    x1={xOffset - 40}
                    y1={70 + (xOffset * 0.15)}
                    x2={xOffset + 30}
                    y2={110 + (xOffset * 0.15)}
                    stroke="#334155"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                ))}

                {/* Render Elements in Depth Order (Foundation -> Columns -> Truss -> PV Modules) */}
                {simResult.simulatedModel.elements.map((el) => {
                  const isSelected = el.id === activeElementId;
                  
                  // Coordinate transforms based on view angle
                  let posX = el.position.x * 2.8;
                  let posY = el.position.y * 1.5;
                  let posZ = el.position.z * 3.5;

                  if (viewAngle === 'iso') {
                    // Isometric projection
                    const isoX = posX - posY;
                    const isoY = (posX + posY) * 0.45 - posZ;

                    // 1. Foundation Drilled Shafts
                    if (el.category === 'Civil3D.Foundation.DrilledShaft') {
                      return (
                        <g
                          key={el.id}
                          onClick={() => setActiveElementId(el.id)}
                          className="cursor-pointer group"
                        >
                          {/* Shaft cylinder representation */}
                          <line
                            x1={isoX}
                            y1={isoY}
                            x2={isoX}
                            y2={isoY + 30}
                            stroke={isSelected ? '#38bdf8' : '#64748b'}
                            strokeWidth={isSelected ? 10 : 8}
                            strokeLinecap="round"
                            strokeOpacity={0.6}
                          />
                          <ellipse
                            cx={isoX}
                            cy={isoY}
                            rx={7}
                            ry={3.5}
                            fill={isSelected ? '#0284c7' : '#475569'}
                            stroke={isSelected ? '#ffffff' : '#334155'}
                            strokeWidth={1}
                          />
                        </g>
                      );
                    }

                    // 2. Superstructure Columns
                    if (el.category === 'Civil3D.Structural.CanopyColumn') {
                      return (
                        <g
                          key={el.id}
                          onClick={() => setActiveElementId(el.id)}
                          className="cursor-pointer group"
                        >
                          <line
                            x1={isoX}
                            y1={isoY}
                            x2={isoX}
                            y2={isoY + 50}
                            stroke={isSelected ? '#38bdf8' : simVisualMode === 'stress' ? '#eab308' : '#94a3b8'}
                            strokeWidth={isSelected ? 6 : 4}
                            strokeLinecap="round"
                          />
                          {/* Base plate */}
                          <polygon
                            points={`${isoX - 6},${isoY + 50} ${isoX + 6},${isoY + 50} ${isoX + 4},${isoY + 54} ${isoX - 4},${isoY + 54}`}
                            fill="#cbd5e1"
                          />
                        </g>
                      );
                    }

                    // 3. Superstructure Truss
                    if (el.category === 'Civil3D.Structural.PurlinTruss') {
                      return (
                        <g
                          key={el.id}
                          onClick={() => setActiveElementId(el.id)}
                          className="cursor-pointer"
                        >
                          <polygon
                            points={`${isoX - 110},${isoY - 10} ${isoX + 110},${isoY - 10} ${isoX + 115},${isoY + 6} ${isoX - 105},${isoY + 6}`}
                            fill={isSelected ? '#38bdf8' : '#334155'}
                            stroke={isSelected ? '#ffffff' : '#475569'}
                            strokeWidth={1.5}
                            fillOpacity={0.7}
                          />
                        </g>
                      );
                    }

                    // 4. Photovoltaic Array Modules
                    if (el.category === 'BIM.Electrical.PhotovoltaicArray') {
                      // Color based on simulation mode
                      let fillColor = '#0284c7';
                      if (simVisualMode === 'irradiance') {
                        const irr = el.simState?.irradianceWm2 || 0;
                        if (irr > 900) fillColor = '#f59e0b'; // Peak noon
                        else if (irr > 600) fillColor = '#eab308';
                        else if (irr > 300) fillColor = '#38bdf8';
                        else fillColor = '#1e3a8a'; // Morning / evening
                      } else if (simVisualMode === 'categories') {
                        fillColor = '#10b981';
                      } else if (simVisualMode === 'stress') {
                        fillColor = '#6366f1';
                      }

                      return (
                        <g
                          key={el.id}
                          onClick={() => setActiveElementId(el.id)}
                          className="cursor-pointer transition-all hover:opacity-90"
                        >
                          <polygon
                            points={`${isoX - 35},${isoY - 12} ${isoX + 35},${isoY - 12} ${isoX + 25},${isoY + 12} ${isoX - 45},${isoY + 12}`}
                            fill={fillColor}
                            stroke={isSelected ? '#ffffff' : '#0369a1'}
                            strokeWidth={isSelected ? 2.5 : 1}
                            fillOpacity={0.9}
                          />
                          {/* String Grid Lines */}
                          <line
                            x1={isoX - 5}
                            y1={isoY - 12}
                            x2={isoX - 10}
                            y2={isoY + 12}
                            stroke="#ffffff"
                            strokeWidth="0.5"
                            strokeOpacity={0.4}
                          />
                        </g>
                      );
                    }

                    // 5. EV Chargers
                    if (el.category === 'BIM.Infrastructure.EVCharger') {
                      return (
                        <g
                          key={el.id}
                          onClick={() => setActiveElementId(el.id)}
                          className="cursor-pointer"
                        >
                          <rect
                            x={isoX - 4}
                            y={isoY + 20}
                            width={8}
                            height={18}
                            rx={2}
                            fill={isSelected ? '#38bdf8' : '#10b981'}
                            stroke="#ffffff"
                            strokeWidth={1}
                          />
                          <circle cx={isoX} cy={isoY + 26} r={2} fill="#ffffff" />
                        </g>
                      );
                    }
                  }

                  return null;
                })}

                {/* Sun Ray Line overlay in shadow mode */}
                {simVisualMode === 'shadows' && (
                  <g stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" opacity="0.6">
                    <line x1="-150" y1="-80" x2="-60" y2="40" />
                    <line x1="0" y1="-100" x2="20" y2="30" />
                    <line x1="150" y1="-80" x2="80" y2="40" />
                  </g>
                )}
              </svg>

              {/* Floating Quick Legend */}
              <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-[10px] space-y-1 z-10 font-mono">
                <div className="text-slate-400 font-bold">Element Selection:</div>
                <div className="flex items-center gap-1.5 text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                  <span>{activeElement.name}</span>
                </div>
              </div>
            </div>

            {/* Diurnal Time Slider & Solar Controls */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSimPlaying
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>{isSimPlaying ? '⏸️ Pause' : '▶️ Play 24h Sun Cycle'}</span>
                  </button>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Solar Time: <strong className="text-white">{formatTime(hourOfDay)}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-amber-300">Sun El: {simResult.sunVector.elevationDeg}°</span>
                  <span className="text-sky-300">Azimuth: {simResult.sunVector.azimuthDeg}°</span>
                  <span className="text-emerald-300">Temp: {ambientTempC}°C</span>
                </div>
              </div>

              {/* Slider (6am to 6pm) */}
              <input
                type="range"
                min="6.0"
                max="18.0"
                step="0.25"
                value={hourOfDay}
                onChange={(e) => setHourOfDay(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>6:00 AM (Sunrise)</span>
                <span>9:00 AM</span>
                <span className="text-amber-400 font-bold">12:00 PM (Solar Noon Peak)</span>
                <span>3:00 PM</span>
                <span>6:00 PM (Sunset)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column (5 cols): Autodesk AEC Data Model Inspector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 lg:p-6 space-y-4 shadow-xl">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded text-[9px] font-mono font-bold uppercase tracking-wider">
                  Autodesk AEC Data Model Inspector
                </span>
                <h4 className="text-base font-black text-white mt-1">
                  Granular BIM Property Sets
                </h4>
                <p className="text-[11px] text-slate-400 font-mono break-all">
                  URN: {activeElement.urn}
                </p>
              </div>

              <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-sm">
                🔍
              </div>
            </div>

            {/* Filter by System Category */}
            <div className="flex flex-wrap gap-1 text-[10px]">
              {['ALL', 'Foundation', 'Superstructure', 'Photovoltaics', 'Electrical', 'Civil/Drainage'].map(sys => (
                <button
                  key={sys}
                  type="button"
                  onClick={() => setFilterCategory(sys)}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    filterCategory === sys
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {sys}
                </button>
              ))}
            </div>

            {/* Element Quick Switcher Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Selected Element ({filteredElements.length} visible):
              </label>
              <select
                value={activeElement.id}
                onChange={(e) => setActiveElementId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
              >
                {filteredElements.map(el => (
                  <option key={el.id} value={el.id}>
                    [{el.system}] {el.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Element Overview Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white">{activeElement.name}</span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {activeElement.system}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-slate-900">
                <div>
                  <span className="text-slate-500 block text-[9px]">Material:</span>
                  <span className="text-slate-300 font-medium">{activeElement.material.split('(')[0]}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">Embodied Carbon:</span>
                  <span className="text-amber-400 font-bold">{activeElement.embodiedCarbonKgCo2e} kg CO2e</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">Northing (CA Zone V):</span>
                  <span className="text-sky-300">{activeElement.position.northingStatePlaneFt.toFixed(2)} ft</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">Easting (CA Zone V):</span>
                  <span className="text-sky-300">{activeElement.position.eastingStatePlaneFt.toFixed(2)} ft</span>
                </div>
              </div>

              {/* Dynamic Live Simulation Properties if available */}
              {activeElement.simState && (
                <div className="p-2.5 bg-sky-950/40 rounded-xl border border-sky-800/50 space-y-1 text-[11px] font-mono">
                  <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                    Live Irradiance Telemetry ({formatTime(hourOfDay)}):
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Surface Irradiance:</span>
                    <span className="text-amber-300 font-bold">{activeElement.simState.irradianceWm2} W/m²</span>
                  </div>
                  {activeElement.simState.instantaneousKw > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">String Generation:</span>
                      <span className="text-emerald-300 font-bold">{activeElement.simState.instantaneousKw} kW</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cell Operating Temp:</span>
                    <span className="text-orange-300">{activeElement.simState.cellTempC}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">AISC Stress Envelope:</span>
                    <span className="text-purple-300 font-bold">{(activeElement.simState.structuralStressRatio * 100).toFixed(0)}% Capacity</span>
                  </div>
                </div>
              )}
            </div>

            {/* Granular Property Sets Table */}
            <div className="space-y-2">
              <h5 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                Granular Autodesk AEC Parameters
              </h5>

              <div className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 border border-slate-800 rounded-xl divide-y divide-slate-850">
                {activeElement.properties.map((prop, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 text-[11px] hover:bg-slate-850/50 transition-colors">
                    <div>
                      <span className="text-slate-400 block font-medium">{prop.name}</span>
                      <span className="text-[9px] font-mono text-purple-400">{prop.category}</span>
                    </div>
                    <div className="text-right font-mono font-bold text-white">
                      {prop.value.toString()} {prop.unit || ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Civil 3D Compliance Footnote */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-300">
                <span>📐</span> Autodesk Civil 3D 2026 Standards Compliance
              </div>
              <p>
                All elements conform to the open <strong>Autodesk AEC Data Model</strong> specification, permitting cross-discipline parameter sharing between Civil 3D site corridors and Revit structural models without IFC translation loss.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
