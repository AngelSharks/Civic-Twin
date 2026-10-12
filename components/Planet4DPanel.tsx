import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Calendar, FileText, AlertCircle, Search, Layers, Clock, ArrowRight, CheckCircle2, MapPin, RefreshCw, Check } from 'lucide-react';
import Markdown from 'react-markdown';
import { TwinMetadata } from '../types';
import { generatePlanetAiReport } from '../services/geminiService';

interface Planet4DPanelProps {
  metadata: TwinMetadata;
  onUpdateMetadata: (metadata: TwinMetadata) => void;
}

export const Planet4DPanel: React.FC<Planet4DPanelProps> = ({ metadata, onUpdateMetadata }) => {
  const [activeTab, setActiveTab] = useState<'order' | '4d' | 'report'>('order');
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'none' | 'pending' | 'completed'>(metadata.planetOrderId ? 'completed' : 'none');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState<string | null>(metadata.planetAiReport || null);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  
  // Geocoding & Reverse Lookup State
  const [searchAddress, setSearchAddress] = useState(metadata.address || '');
  const [resolvedLocation, setResolvedLocation] = useState<{ lat: number; lng: number; displayName: string } | null>(
    metadata.location ? { lat: metadata.location.lat, lng: metadata.location.lng, displayName: metadata.location.displayName || metadata.address } : null
  );
  const [inputLat, setInputLat] = useState<string>(metadata.location?.lat ? metadata.location.lat.toString() : '');
  const [inputLng, setInputLng] = useState<string>(metadata.location?.lng ? metadata.location.lng.toString() : '');
  const [lookupMode, setLookupMode] = useState<'address' | 'coordinates'>('address');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavedToTwin, setIsSavedToTwin] = useState(false);

  // Sync state if metadata changes externally
  useEffect(() => {
    if (metadata.address && !searchAddress) {
      setSearchAddress(metadata.address);
    }
    if (metadata.location) {
      setResolvedLocation({
        lat: metadata.location.lat,
        lng: metadata.location.lng,
        displayName: metadata.location.displayName || metadata.address
      });
      setInputLat(metadata.location.lat.toString());
      setInputLng(metadata.location.lng.toString());
    }
  }, [metadata]);

  // Forward Address Lookup
  const handleAddressLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchAddress.trim() || isLookingUp) return;

    setIsLookingUp(true);
    setLookupMessage(null);
    setIsSavedToTwin(false);

    try {
      const encoded = encodeURIComponent(searchAddress.trim());
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&addressdetails=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        const item = data[0];
        const newLat = parseFloat(item.lat);
        const newLng = parseFloat(item.lon);
        const newDisplayName = item.display_name;

        const loc = { lat: newLat, lng: newLng, displayName: newDisplayName };
        setResolvedLocation(loc);
        setInputLat(newLat.toFixed(6));
        setInputLng(newLng.toFixed(6));

        // Automatically update the Civic Twin metadata
        onUpdateMetadata({
          ...metadata,
          address: searchAddress.trim(),
          location: loc
        });

        setLookupMessage({ type: 'success', text: `Resolved: ${newDisplayName}` });
        setIsSavedToTwin(true);
      } else {
        setLookupMessage({ type: 'error', text: 'No matching location found. Try adding a city or postal code.' });
      }
    } catch (err) {
      console.error('Address lookup failed:', err);
      setLookupMessage({ type: 'error', text: 'Lookup error. Check network connection.' });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Reverse Coordinates Lookup (Lat/Lng -> Address)
  const handleCoordinatesReverseLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);

    if (isNaN(lat) || isNaN(lng) || isLookingUp) {
      setLookupMessage({ type: 'error', text: 'Please enter valid numerical Latitude and Longitude values.' });
      return;
    }

    setIsLookingUp(true);
    setLookupMessage(null);
    setIsSavedToTwin(false);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();

      if (data && data.display_name) {
        const loc = { lat, lng, displayName: data.display_name };
        setResolvedLocation(loc);
        setSearchAddress(data.display_name);

        onUpdateMetadata({
          ...metadata,
          address: data.display_name,
          location: loc
        });

        setLookupMessage({ type: 'success', text: `Reverse resolved: ${data.display_name}` });
        setIsSavedToTwin(true);
      } else {
        setLookupMessage({ type: 'error', text: 'No address resolved for these coordinates.' });
      }
    } catch (err) {
      console.error('Reverse lookup failed:', err);
      setLookupMessage({ type: 'error', text: 'Reverse geocode error. Check network connection.' });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleOrder = async () => {
    setIsOrdering(true);
    // Mock Planet API order generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    const mockOrderId = `PL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    try {
      await fetch('/api/planet-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata, orderId: mockOrderId })
      });
      
      const currentLat = resolvedLocation?.lat || metadata.location?.lat || 0;
      const currentLng = resolvedLocation?.lng || metadata.location?.lng || 0;
      const currentAddr = searchAddress || metadata.address;

      const sqlLine = `INSERT INTO planet_orders (order_id, address, lat, lng, timestamp) VALUES ('${mockOrderId}', '${currentAddr}', ${currentLat}, ${currentLng}, '${new Date().toISOString()}');\n`;
      
      onUpdateMetadata({
        ...metadata,
        address: currentAddr,
        location: resolvedLocation || metadata.location,
        planetOrderId: mockOrderId,
        planetOrdersSql: (metadata.planetOrdersSql || '') + sqlLine
      });
      setOrderStatus('pending');
    } catch (err) {
      console.error("Order API failed:", err);
    } finally {
      setIsOrdering(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const result = await generatePlanetAiReport(metadata, dateRange);
      setReport(result);
      onUpdateMetadata({
        ...metadata,
        planetAiReport: result
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
      <header className="p-8 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-900/20">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">PlanetScope 4D Intelligence</h2>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Angel Shark Civic Twin | Daily Satellite Integration</p>
          </div>
        </div>

        <nav className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
          {[
            { id: 'order', label: 'Order Scope', icon: Search },
            { id: '4d', label: '4D Time Window', icon: Clock },
            { id: 'report', label: 'AI Analysis', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-thin scrollbar-thumb-slate-800 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'order' && (
            <motion.div
              key="order"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-10"
            >
              <div className="bg-indigo-900/10 border border-indigo-500/20 p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-3 text-indigo-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Planet Labs Integration Requirements</span>
                </div>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  To generate a high-resolution PlanetScope order, verify your community's geographic shard. 
                  This feature requires an active **Angel Shark Civic Twin Paid Account**.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      Geographic Shard & Lookup
                    </h3>
                    <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[9px] font-black uppercase">
                      <button
                        type="button"
                        onClick={() => { setLookupMode('address'); setLookupMessage(null); }}
                        className={`px-2.5 py-1 rounded-md transition-all ${lookupMode === 'address' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Address
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLookupMode('coordinates'); setLookupMessage(null); }}
                        className={`px-2.5 py-1 rounded-md transition-all ${lookupMode === 'coordinates' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Lat / Lng
                      </button>
                    </div>
                  </div>

                  {lookupMode === 'address' ? (
                    <form onSubmit={handleAddressLookup} className="space-y-4">
                      <div className="relative">
                        <input 
                          type="text" 
                          value={searchAddress}
                          onChange={(e) => {
                            setSearchAddress(e.target.value);
                            setIsSavedToTwin(false);
                          }}
                          className="w-full px-5 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all font-bold text-sm pr-24"
                          placeholder="Type city, street, or landmark..."
                        />
                        <button
                          type="submit"
                          disabled={isLookingUp || !searchAddress.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                        >
                          {isLookingUp ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Search className="w-3 h-3" />
                              <span>Lookup</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Enter any municipality address or location to resolve coordinates and satellite bounding box.
                      </p>
                    </form>
                  ) : (
                    <form onSubmit={handleCoordinatesReverseLookup} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Latitude</label>
                          <input 
                            type="text" 
                            value={inputLat}
                            onChange={(e) => { setInputLat(e.target.value); setIsSavedToTwin(false); }}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-mono text-xs"
                            placeholder="e.g. 43.083100"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Longitude</label>
                          <input 
                            type="text" 
                            value={inputLng}
                            onChange={(e) => { setInputLng(e.target.value); setIsSavedToTwin(false); }}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-mono text-xs"
                            placeholder="e.g. -73.784600"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLookingUp || !inputLat || !inputLng}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg"
                      >
                        {isLookingUp ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Search className="w-3 h-3" />
                            <span>Reverse Lookup Address</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* Feedback Message */}
                  {lookupMessage && (
                    <div className={`p-4 rounded-xl text-xs font-bold flex items-start gap-2 ${
                      lookupMessage.type === 'success' 
                        ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300' 
                        : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
                    }`}>
                      {lookupMessage.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <span className="leading-tight">{lookupMessage.text}</span>
                    </div>
                  )}

                  {/* Live Resolved Details Card */}
                  <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                      <span>Resolved Spatial Coordinates</span>
                      {resolvedLocation ? (
                        <span className="text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                          <Check className="w-3 h-3" /> Synced
                        </span>
                      ) : (
                        <span className="text-amber-400">Pending</span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        <span className="text-slate-500 font-sans font-bold block text-[10px] uppercase mb-1">Coordinates (WGS84):</span>
                        LAT: <span className="text-indigo-400 font-bold">{resolvedLocation?.lat.toFixed(6) ?? (metadata.location?.lat ? metadata.location.lat.toFixed(6) : 'N/A')}</span> <br/>
                        LNG: <span className="text-indigo-400 font-bold">{resolvedLocation?.lng.toFixed(6) ?? (metadata.location?.lng ? metadata.location.lng.toFixed(6) : 'N/A')}</span>
                      </p>
                      
                      {resolvedLocation?.displayName && (
                        <p className="text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
                          <span className="text-slate-500 font-bold block text-[9px] uppercase mb-0.5">Matched Shard Address:</span>
                          {resolvedLocation.displayName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    Order Parameters
                  </h3>
                  <div className="space-y-4">
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Product Type</span>
                        <span className="text-[10px] font-black text-white uppercase bg-indigo-600 px-2 py-0.5 rounded">PlanetScope Daily</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Resolution</span>
                        <span className="text-[10px] font-black text-white uppercase">3.0 Meters</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Account Tier</span>
                        <span className="text-[10px] font-black text-amber-500 uppercase">Angel Shark Premium</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleOrder}
                      disabled={isOrdering || orderStatus !== 'none'}
                      className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${orderStatus === 'none' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                    >
                      {isOrdering ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : orderStatus === 'none' ? (
                        <>Generate PlanetScope Order <ArrowRight className="w-4 h-4" /></>
                      ) : (
                        <>Order Active: {metadata.planetOrderId}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === '4d' && (
            <motion.div
              key="4d"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="w-24 h-24 bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-500 mb-4">
                <Clock className="w-12 h-12 animate-pulse" />
              </div>
              <div className="space-y-4 max-w-md">
                <h3 className="text-3xl font-black text-white tracking-tight">4D Temporal Analysis</h3>
                <div className="p-8 bg-indigo-950/40 border border-indigo-500/30 rounded-[2.5rem] shadow-2xl">
                  <p className="text-lg font-bold text-indigo-300 leading-relaxed">
                    This is a <span className="text-white">paid feature</span>. 
                  </p>
                  <p className="text-sm text-indigo-400/80 mt-4 font-medium">
                    Please allow <span className="text-white font-black">3 days</span> for your daily satellite photos to appear.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6 w-full max-w-2xl mt-12">
                {['T-Minus 72h', 'T-Minus 48h', 'T-Minus 24h'].map((time, i) => (
                  <div key={i} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl opacity-40 grayscale flex flex-col items-center gap-3">
                    <Calendar className="w-6 h-6 text-slate-500" />
                    <span className="text-[10px] font-black uppercase text-slate-600">{time}</span>
                    <div className="w-full h-24 bg-slate-950 rounded-lg flex items-center justify-center text-[9px] font-black text-slate-800 uppercase">Pending Sync</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'report' && (
            <motion.div
              key="report"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto space-y-10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">AI Intelligence Report</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Derived from PlanetScope Daily Imagery</p>
                </div>
                <button 
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport || !metadata.planetOrderId}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
                >
                  {isGeneratingReport ? 'Analyzing Shards...' : 'Regenerate Report'}
                </button>
              </div>

              {!metadata.planetOrderId ? (
                <div className="p-20 bg-slate-900 border border-slate-800 rounded-[3rem] text-center space-y-6">
                  <FileText className="w-16 h-16 text-slate-700 mx-auto" />
                  <p className="text-slate-500 font-bold italic">No active PlanetScope order found. Generate an order to enable AI analysis.</p>
                </div>
              ) : isGeneratingReport ? (
                <div className="p-20 bg-slate-900 border border-slate-800 rounded-[3rem] flex flex-col items-center justify-center space-y-6">
                  <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="text-indigo-400 font-black uppercase text-xs tracking-widest animate-pulse">Processing Satellite Shards...</p>
                </div>
              ) : report ? (
                <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 lg:p-16 shadow-2xl relative">
                  <div className="absolute top-8 right-8">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-50" />
                  </div>
                  <div className="prose prose-invert prose-slate max-w-none">
                    <Markdown>{report}</Markdown>
                  </div>
                </div>
              ) : (
                <div className="p-20 bg-slate-900 border border-slate-800 rounded-[3rem] text-center space-y-6">
                  <button 
                    onClick={handleGenerateReport}
                    className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-2xl"
                  >
                    Generate Initial AI Report
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Order Button at Bottom Left */}
        <div className="absolute bottom-8 left-8 z-50">
          <button 
            onClick={handleOrder}
            disabled={isOrdering}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-[9px] uppercase tracking-widest transition-all shadow-2xl flex items-center gap-2 border border-blue-400/30"
          >
            {isOrdering ? 'Processing...' : 'Generate PlanetScope Order send it as an email to billing@angelsharks.net'}
          </button>
        </div>
      </div>
    </div>
  );
};
