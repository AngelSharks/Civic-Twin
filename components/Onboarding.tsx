
import React, { useState } from 'react';
import { TwinMetadata, GISLayerEndpoints, CID } from '../types';
import { findOfficialGISPortals } from '../services/geminiService';

interface OnboardingProps {
  onComplete: (metadata: TwinMetadata) => void;
  onReset: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onReset }) => {
  const [step, setStep] = useState<1 | 1.5 | 2 | 3 | 4 | 5>(1);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'City' as TwinMetadata['type'],
    officialUrl: ''
  });
  const [gisLayers, setGisLayers] = useState<GISLayerEndpoints>({
    parcels: '',
    utilities: '',
    infrastructure: '',
    safety: '',
    greenery: ''
  });
  const [cids, setCids] = useState<CID[]>([]);
  const [newCidName, setNewCidName] = useState('');
  const [tempLocation, setTempLocation] = useState<TwinMetadata['location']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedPortals, setSuggestedPortals] = useState<string[]>([]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const encodedAddress = encodeURIComponent(formData.address);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        setTempLocation({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name
        });
        
        // Use Gemini to find official portals
        setStep(1.5);
        const gisData = await findOfficialGISPortals(formData.name, formData.address);
        setSuggestedPortals(gisData.sources);
        setStep(2);
      } else {
        setError("Location not found. Try a street address or city name.");
      }
    } catch (err) {
      setError("Connectivity issue. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCid = () => {
    if (!newCidName) return;
    const cid: CID = {
      id: Math.floor(Math.random() * 900 + 100).toString(),
      name: newCidName,
      population: Math.floor(Math.random() * 5000 + 500),
      meshActive: true
    };
    setCids([...cids, cid]);
    setNewCidName('');
  };

  const finalizeOnboarding = (layers?: GISLayerEndpoints) => {
    onComplete({
      name: formData.name,
      address: formData.address,
      type: formData.type,
      location: tempLocation,
      officialUrl: formData.officialUrl,
      gisLayers: layers,
      isEmergencyMode: false,
      version: 'v4',
      cids: cids.length > 0 ? cids : [
        { id: '772', name: `${formData.name} Central CID`, population: 1200, meshActive: true },
        { id: '104', name: `${formData.name} Highlands CID`, population: 850, meshActive: true }
      ]
    });
  };

  if (step === 1.5) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-slate-900 rounded-[2.5rem] shadow-2xl p-12 text-center space-y-8 animate-pulse">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-2xl">🔍</div>
          <h2 className="text-2xl font-black text-white">Searching GIS Portals</h2>
          <p className="text-slate-400 font-bold">Gemini is scanning for official Open Data repositories for {formData.name}...</p>
        </div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="p-8 text-center bg-blue-50 border-b border-blue-200">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Define Community IDs</h2>
            <p className="text-sm text-slate-700 font-medium">Link local CIDs to your Wi-Fi Mesh Fog network (B-lan).</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newCidName}
                onChange={(e) => setNewCidName(e.target.value)}
                placeholder="Community / CID Name" 
                className="flex-1 px-5 py-4 bg-slate-50 border border-slate-300 rounded-2xl outline-none"
              />
              <button 
                onClick={handleAddCid}
                className="px-6 py-4 bg-blue-600 text-white font-black rounded-2xl"
              >Add</button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {cids.map(c => (
                <div key={c.id} className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between">
                  <span className="font-bold text-slate-900">{c.name}</span>
                  <span className="text-[10px] font-black text-blue-600 uppercase">CID-{c.id}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => finalizeOnboarding(gisLayers)}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl uppercase text-xs tracking-[0.2em]"
            >Launch Digital Twin Core</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-8 text-center bg-emerald-50 border-b border-emerald-200">
             <h2 className="text-3xl font-black text-slate-900 mb-2">Configure GIS Layers</h2>
             <p className="text-sm text-slate-700 font-medium">Provide spatial endpoints (GeoJSON/FeatureLayers) for modeling.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setStep(5); }} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'parcels', label: 'Parcel Boundaries' },
                { key: 'utilities', label: 'Underground Utilities' },
                { key: 'greenery', label: 'Public Green Space' },
                { key: 'infrastructure', label: 'General Infrastructure' },
                { key: 'safety', label: 'Public Safety Nodes' }
              ].map(item => (
                <div key={item.key} className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest ml-1">{item.label}</label>
                  <input
                    type="url"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm"
                    placeholder={`https://gis-server/api/${item.key}`}
                    value={(gisLayers as any)[item.key]}
                    onChange={(e) => setGisLayers({ ...gisLayers, [item.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase text-xs tracking-widest">Next: Define CIDs</button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-12 text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-6">GIS Data Strategy</h2>
            <div className="space-y-4">
              <button onClick={() => setStep(4)} className="w-full p-6 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-between">
                <span>Add Custom GIS Layers</span>
                <span>→</span>
              </button>
              <button onClick={() => setStep(5)} className="w-full p-6 border-2 border-slate-200 text-slate-800 rounded-2xl font-bold flex items-center justify-between">
                <span>Use AI Data Defaults</span>
                <span>⚡</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-8 text-center bg-blue-50 border-b border-blue-200">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Connect Portal</h2>
            <p className="text-sm text-slate-700 font-medium">Link your official city website for AI data scraping.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="p-8 space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Official Website / GIS Hub</label>
              <input
                type="url"
                required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-300 rounded-2xl outline-none"
                placeholder="https://www.cityname.gov"
                value={formData.officialUrl}
                onChange={(e) => setFormData({ ...formData, officialUrl: e.target.value })}
              />
              
              {suggestedPortals.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-emerald-700 uppercase mb-3">Suggested GIS Portals Found:</p>
                  <div className="space-y-2">
                    {suggestedPortals.slice(0, 3).map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData({ ...formData, officialUrl: url })}
                        className="w-full text-left text-xs bg-white border border-emerald-200 p-2 rounded-lg truncate hover:bg-emerald-100 transition-colors"
                      >
                        {url}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-4">
               <button type="button" onClick={() => setStep(1)} className="flex-1 py-5 border-2 border-slate-200 rounded-2xl font-bold">Back</button>
               <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg">Next Step</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 text-center bg-slate-50 border-b border-slate-200">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Initialize Civic Twin</h2>
          <p className="text-xs sm:text-sm text-slate-700 font-medium">Calibrate your physical region for spatial simulation.</p>
        </div>
        <form onSubmit={handleStep1Submit} className="p-6 sm:p-8 space-y-5 sm:space-y-6">
          <div className="space-y-2">
             <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Community Identity</label>
            <input
              type="text"
              required
              className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
              placeholder="City or Community Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Address</label>
            <input
              type="text"
              required
              className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
              placeholder="Street Address, City, State"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          
          {error && <p className="text-rose-600 text-[10px] sm:text-xs font-bold text-center animate-pulse">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl shadow-xl uppercase text-[10px] sm:text-xs tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? 'Calibrating...' : 'Next: Configure Portal'}
          </button>
          
          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={onReset}
              className="w-full py-3 text-[8px] sm:text-[9px] font-black text-slate-400 hover:text-rose-600 uppercase tracking-widest transition-colors"
            >
              System Reset / Clear Cache
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
