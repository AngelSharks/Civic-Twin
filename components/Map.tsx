
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { GeoLocation, GISLayerEndpoints } from '../types';

interface MapProps {
  location: GeoLocation;
  name: string;
  isExpanded?: boolean;
  gisLayers?: GISLayerEndpoints;
}

interface WeatherInfo {
  temp: number;
  windSpeed: number;
  conditionCode: number;
  conditionText: string;
}

type MapMode = 'street' | 'satellite' | 'topo';

export const Map: React.FC<MapProps> = ({ location, name, isExpanded, gisLayers }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const baseLayerRef = useRef<any>(null);
  
  // GIS Layer Groups
  const parcelsLayerRef = useRef<any>(null);
  const utilitiesLayerRef = useRef<any>(null);
  const infrastructureLayerRef = useRef<any>(null);
  const safetyLayerRef = useRef<any>(null);
  const greeneryLayerRef = useRef<any>(null);
  const householdLayerRef = useRef<any>(null);
  const heatmapLayerRef = useRef<any>(null);

  const [streetViewCoords, setStreetViewCoords] = useState<{lat: number, lng: number} | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('street');
  const [isGisLoaded, setIsGisLoaded] = useState<Record<string, boolean>>({});
  
  const [layers, setLayers] = useState({
    parcels: true,
    utilities: true,
    infrastructure: true,
    safety: true,
    greenery: true,
    households: true,
    heatmap: true
  });

  const getWeatherText = (code: number) => {
    if (code === 0) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Rain / Drizzle';
    if (code <= 77) return 'Snow';
    if (code <= 99) return 'Thunderstorm';
    return 'Overcast';
  };

  const fetchWeatherData = async () => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current_weather=true`
      );
      const data = await response.json();
      if (data.current_weather) {
        setWeatherInfo({
          temp: data.current_weather.temperature,
          windSpeed: data.current_weather.windspeed,
          conditionCode: data.current_weather.weathercode,
          conditionText: getWeatherText(data.current_weather.weathercode)
        });
      }
    } catch (err) {
      console.error("Weather sync failed", err);
    }
  };

  const updateBaseLayer = () => {
    if (!mapRef.current) return;
    
    if (baseLayerRef.current) {
      mapRef.current.removeLayer(baseLayerRef.current);
    }

    let url = '';
    let options: any = { 
      maxZoom: 19,
      noWrap: false
    };

    switch (mapMode) {
      case 'satellite':
        url = 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
        options = {
          ...options,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: 'Map data &copy; Google'
        };
        break;
      case 'topo':
        url = 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}';
        options = {
          ...options,
          maxZoom: 16,
          attribution: 'Tiles courtesy of the U.S. Geological Survey'
        };
        break;
      case 'street':
      default:
        url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        options = {
          ...options,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        };
        break;
    }

    baseLayerRef.current = L.tileLayer(url, options).addTo(mapRef.current);
    baseLayerRef.current.bringToBack();
  };

  const loadDynamicGisLayer = async (url: string, layerRef: React.MutableRefObject<any>, style: any, name: string) => {
    if (!url || !mapRef.current) return;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      
      layerRef.current.clearLayers();
      L.geoJSON(data, { style }).addTo(layerRef.current);
      setIsGisLoaded(prev => ({ ...prev, [name]: true }));
    } catch (err) {
      console.error(`Failed to load dynamic GIS layer: ${name}`, err);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const initMap = () => {
        if (!mapContainerRef.current) return;
        
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: true,
          fadeAnimation: true,
          trackResize: true
        }).setView([location.lat, location.lng], 15);

        L.control.zoom({ position: 'bottomleft' }).addTo(mapRef.current);

        parcelsLayerRef.current = L.layerGroup();
        utilitiesLayerRef.current = L.layerGroup();
        infrastructureLayerRef.current = L.layerGroup();
        safetyLayerRef.current = L.layerGroup();
        greeneryLayerRef.current = L.layerGroup();
        householdLayerRef.current = L.layerGroup();

        if (gisLayers?.parcels) {
          loadDynamicGisLayer(gisLayers.parcels, parcelsLayerRef, { color: '#3b82f6', weight: 1, fillOpacity: 0.2 }, 'Parcels');
        } else {
          const parcelStyle = { color: '#3b82f6', weight: 1, fillOpacity: 0.1, fillColor: '#3b82f6' };
          for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
              L.rectangle([
                [location.lat + i * 0.001, location.lng + j * 0.0015],
                [location.lat + (i + 0.6) * 0.001, location.lng + (j + 0.8) * 0.0015]
              ], parcelStyle).addTo(parcelsLayerRef.current);
            }
          }
        }

        if (gisLayers?.utilities) {
          loadDynamicGisLayer(gisLayers.utilities, utilitiesLayerRef, { color: '#f59e0b', weight: 3, dashArray: '5, 5' }, 'Utilities');
        } else {
          const utilityStyle = { color: '#f59e0b', weight: 4, dashArray: '8, 8' };
          L.polyline([
            [location.lat - 0.004, location.lng - 0.004],
            [location.lat + 0.004, location.lng + 0.004]
          ], utilityStyle).addTo(utilitiesLayerRef.current);
        }

        if (gisLayers?.infrastructure) {
          loadDynamicGisLayer(gisLayers.infrastructure, infrastructureLayerRef, { color: '#64748b', weight: 2 }, 'Infrastructure');
        }

        if (gisLayers?.safety) {
          loadDynamicGisLayer(gisLayers.safety, safetyLayerRef, { color: '#ef4444', weight: 2, fillOpacity: 0.3 }, 'Safety');
        }

        if (gisLayers?.greenery) {
          loadDynamicGisLayer(gisLayers.greenery, greeneryLayerRef, { color: '#22c55e', weight: 1, fillOpacity: 0.4 }, 'Greenery');
        }

        const pings: [number, number, number][] = [
          [location.lat + 0.0005, location.lng + 0.0005, 1],
          [location.lat - 0.001, location.lng - 0.0005, 0.7],
          [location.lat + 0.001, location.lng - 0.001, 0.9]
        ];

        pings.forEach((p, idx) => {
          L.circleMarker([p[0], p[1]], { radius: 8, color: '#1e293b', fillColor: '#3b82f6', fillOpacity: 0.8 })
            .addTo(householdLayerRef.current)
            .bindPopup(`<b class="text-xs">Node CT-${idx + 101}</b><br/><span class="text-[10px] text-slate-500 font-bold">Active Mesh Relay</span>`);
        });

        if ((L as any).heatLayer) {
          const initHeat = () => {
            if (!mapRef.current) return;
            const container = mapContainerRef.current;
            if (container && container.clientWidth > 0 && container.clientHeight > 0) {
              heatmapLayerRef.current = (L as any).heatLayer(pings, { radius: 30, blur: 15 });
              if (layers.heatmap) heatmapLayerRef.current.addTo(mapRef.current);
            } else {
              setTimeout(initHeat, 250);
            }
          };
          initHeat();
        }

        updateBaseLayer();
        mapRef.current.invalidateSize();
      };

      if (mapContainerRef.current.clientWidth > 0) {
        initMap();
      } else {
        setTimeout(initMap, 100);
      }
    } else {
      mapRef.current.setView([location.lat, location.lng], mapRef.current.getZoom());
    }

    const handleSVOpen = (e: any) => setStreetViewCoords(e.detail);
    window.addEventListener('open-street-view', handleSVOpen);

    const observer = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);

    fetchWeatherData();

    return () => {
      window.removeEventListener('open-street-view', handleSVOpen);
      observer.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [location, gisLayers]);

  useEffect(() => {
    updateBaseLayer();
  }, [mapMode]);

  useEffect(() => {
    if (!mapRef.current) return;
    const overlayRefs = [
      { ref: parcelsLayerRef, active: layers.parcels },
      { ref: utilitiesLayerRef, active: layers.utilities },
      { ref: infrastructureLayerRef, active: layers.infrastructure },
      { ref: safetyLayerRef, active: layers.safety },
      { ref: greeneryLayerRef, active: layers.greenery },
      { ref: householdLayerRef, active: layers.households },
      { ref: heatmapLayerRef, active: layers.heatmap }
    ];

    overlayRefs.forEach(item => {
      if (!item.ref.current) return;
      if (item.active) {
        if (!mapRef.current.hasLayer(item.ref.current)) item.ref.current.addTo(mapRef.current);
      } else {
        if (mapRef.current.hasLayer(item.ref.current)) mapRef.current.removeLayer(item.ref.current);
      }
    });
  }, [layers]);

  useEffect(() => {
    if (mapRef.current) {
      const timers = [100, 300, 500, 800, 1200].map(ms => 
        setTimeout(() => {
          if (mapRef.current) mapRef.current.invalidateSize();
        }, ms)
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [isExpanded]);

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="w-full h-full relative bg-slate-200 transition-all duration-500 overflow-hidden">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full absolute inset-0 z-0 bg-slate-200" 
      />
      
      {/* HUD Controls */}
      <div className={`absolute ${isExpanded ? 'top-32 lg:top-24' : 'top-4'} left-4 z-[1000] flex flex-col gap-3 pointer-events-none max-w-[240px]`}>
        <div className="glass-panel px-4 py-3 rounded-2xl text-[11px] font-black text-slate-800 shadow-2xl border border-white/60 flex items-center gap-2.5 pointer-events-auto">
          <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
          GIS ACTIVE ENGINE
        </div>
        
        <div className="glass-panel p-2 rounded-2xl shadow-xl border border-white/60 pointer-events-auto bg-white/95 backdrop-blur-md flex flex-col gap-1.5">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 leading-none">Perspective</p>
          <div className="flex flex-col gap-1">
            {[
              { id: 'street', label: 'OpenStreetMap', icon: '🏙️' },
              { id: 'satellite', label: 'Satellite', icon: '🌍' },
              { id: 'topo', label: 'USGS Topo', icon: '⛰️' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setMapMode(mode.id as MapMode)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${mapMode === mode.id ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                <span className="text-sm">{mode.icon}</span>
                <span className="truncate">{mode.label}</span>
                {mapMode === mode.id && <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel p-3 rounded-2xl shadow-xl border border-white/60 pointer-events-auto bg-white/95 backdrop-blur-md flex flex-col gap-2">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 leading-none">Spatial Overlays</p>
           {[
             { id: 'parcels', label: 'Parcels', icon: '📦', color: 'bg-blue-600', isLive: !!gisLayers?.parcels },
             { id: 'utilities', label: 'Utilities', icon: '⚡', color: 'bg-amber-500', isLive: !!gisLayers?.utilities },
             { id: 'infrastructure', label: 'Infrastructure', icon: '🏗️', color: 'bg-slate-500', isLive: !!gisLayers?.infrastructure },
             { id: 'safety', label: 'Safety', icon: '🛡️', color: 'bg-rose-600', isLive: !!gisLayers?.safety },
             { id: 'greenery', label: 'Greenery', icon: '🌳', color: 'bg-emerald-500', isLive: !!gisLayers?.greenery },
             { id: 'households', label: 'Mesh Pings', icon: '🛰️', color: 'bg-indigo-500', isLive: false },
             { id: 'heatmap', label: 'Heatmap', icon: '🔥', color: 'bg-rose-500', isLive: false }
           ].map(layer => (
             <button
               key={layer.id}
               onClick={() => toggleLayer(layer.id as any)}
               className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${layers[layer.id as keyof typeof layers] ? 'bg-slate-100 text-slate-900 border-slate-300' : 'bg-white text-slate-400 border-slate-100 opacity-60'}`}
             >
               <div className={`w-2.5 h-2.5 rounded-full ${layers[layer.id as keyof typeof layers] ? layer.color : 'bg-slate-200'}`} />
               <span className="truncate flex-1 text-left">{layer.label}</span>
             </button>
           ))}
        </div>
      </div>

      {streetViewCoords && (
        <div className="absolute inset-0 z-[3000] bg-slate-900 animate-in fade-in zoom-in-95 duration-300">
          <header className="absolute top-4 left-4 right-4 z-[3100] flex justify-between items-center px-6 py-4 bg-white/95 backdrop-blur-md rounded-2xl border border-white/50 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">👁️</div>
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Digital Immersion</p>
                <h4 className="text-xs font-bold text-slate-900">Live Street Analysis Point</h4>
              </div>
            </div>
            <button 
              onClick={() => setStreetViewCoords(null)}
              className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-full font-black text-lg transition-all"
            >✕</button>
          </header>
          <iframe
            title="Google Street View"
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps/embed/v1/streetview?key=${process.env.API_KEY}&location=${streetViewCoords.lat},${streetViewCoords.lng}`}
          ></iframe>
        </div>
      )}
    </div>
  );
};
