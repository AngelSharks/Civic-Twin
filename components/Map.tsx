
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
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
  const watershedLayerRef = useRef<any>(null);
  const householdLayerRef = useRef<any>(null);
  const heatmapLayerRef = useRef<any>(null);
  const solarLayerRef = useRef<any>(null);

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
    watershed: true,
    households: true,
    heatmap: true,
    solar: true
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
        watershedLayerRef.current = L.layerGroup();
        householdLayerRef.current = L.layerGroup();
        heatmapLayerRef.current = L.layerGroup();
        solarLayerRef.current = L.layerGroup();

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

        // WATERSHED & HYDROLOGIC UNIT BOUNDARIES
        if (gisLayers?.watershed) {
          loadDynamicGisLayer(
            gisLayers.watershed, 
            watershedLayerRef, 
            { color: '#06b6d4', weight: 2.5, dashArray: '6, 6', fillOpacity: 0.15, fillColor: '#0891b2' }, 
            'Watershed'
          );
        } else {
          // Synthetic High-Fidelity Watershed Basins (HUC-10/12 Catchments)
          const basinPolygons = [
            {
              name: 'Upper Catchment Drainage Basin (HUC-12 #1807010501)',
              area: '18.4 km²',
              runoffCoeff: '0.68',
              capacity: '84% (Optimal)',
              coords: [
                [location.lat + 0.008, location.lng - 0.010],
                [location.lat + 0.012, location.lng - 0.002],
                [location.lat + 0.009, location.lng + 0.007],
                [location.lat + 0.003, location.lng + 0.006],
                [location.lat + 0.001, location.lng - 0.004],
                [location.lat + 0.004, location.lng - 0.011]
              ]
            },
            {
              name: 'Central Urban Runoff Watershed (HUC-12 #1807010502)',
              area: '24.2 km²',
              runoffCoeff: '0.82',
              capacity: '76% (Moderate)',
              coords: [
                [location.lat + 0.002, location.lng - 0.008],
                [location.lat + 0.004, location.lng + 0.005],
                [location.lat - 0.004, location.lng + 0.010],
                [location.lat - 0.009, location.lng + 0.003],
                [location.lat - 0.007, location.lng - 0.006],
                [location.lat - 0.001, location.lng - 0.010]
              ]
            },
            {
              name: 'Lower Retention & Infiltration Zone (HUC-12 #1807010503)',
              area: '15.7 km²',
              runoffCoeff: '0.45',
              capacity: '92% (High Permeability)',
              coords: [
                [location.lat - 0.006, location.lng - 0.007],
                [location.lat - 0.005, location.lng + 0.008],
                [location.lat - 0.013, location.lng + 0.006],
                [location.lat - 0.014, location.lng - 0.005]
              ]
            }
          ];

          basinPolygons.forEach((basin, idx) => {
            const colors = ['#0891b2', '#0284c7', '#0d9488'];
            const polygon = L.polygon(basin.coords as any, {
              color: colors[idx % colors.length],
              weight: 2,
              dashArray: '5, 5',
              fillColor: colors[idx % colors.length],
              fillOpacity: 0.12
            }).addTo(watershedLayerRef.current);

            polygon.bindPopup(`
              <div class="p-2 space-y-1.5 font-sans min-w-[200px]">
                <div class="flex items-center gap-1.5 text-cyan-700">
                  <span class="text-base">🌊</span>
                  <span class="text-[10px] font-black uppercase tracking-wider">Hydrologic Watershed Basin</span>
                </div>
                <h4 class="text-xs font-black text-slate-900 leading-snug">${basin.name}</h4>
                <div class="pt-1.5 border-t border-slate-200 grid grid-cols-2 gap-1 text-[10px]">
                  <div><span class="text-slate-500 font-bold">Catchment:</span> <b class="text-slate-800">${basin.area}</b></div>
                  <div><span class="text-slate-500 font-bold">Runoff Coeff:</span> <b class="text-slate-800">${basin.runoffCoeff}</b></div>
                  <div class="col-span-2"><span class="text-slate-500 font-bold">Retention:</span> <b class="text-cyan-700">${basin.capacity}</b></div>
                </div>
              </div>
            `);
          });

          // Hydrologic Flowlines (Main Drainage Arteries)
          const flowlineA = [
            [location.lat + 0.010, location.lng - 0.001],
            [location.lat + 0.006, location.lng + 0.001],
            [location.lat + 0.001, location.lng + 0.002],
            [location.lat - 0.005, location.lng + 0.004],
            [location.lat - 0.012, location.lng + 0.001]
          ];
          const flowlineB = [
            [location.lat + 0.005, location.lng - 0.007],
            [location.lat + 0.002, location.lng - 0.002],
            [location.lat + 0.001, location.lng + 0.002]
          ];

          L.polyline(flowlineA as any, { color: '#0284c7', weight: 4, opacity: 0.85 }).addTo(watershedLayerRef.current)
            .bindPopup(`<b class="text-xs text-blue-700">Primary River Flowline</b><br/><span class="text-[10px] text-slate-500 font-bold">Average Discharge: 16.4 m³/s</span>`);
          
          L.polyline(flowlineB as any, { color: '#06b6d4', weight: 2.5, opacity: 0.75, dashArray: '4, 4' }).addTo(watershedLayerRef.current)
            .bindPopup(`<b class="text-xs text-cyan-700">Secondary Tributary Channel</b><br/><span class="text-[10px] text-slate-500 font-bold">Inflow Rate: 4.8 m³/s</span>`);

          // Hydrological Gauges / Outfall Monitoring Nodes
          const gauges = [
            { lat: location.lat + 0.006, lng: location.lng + 0.001, code: 'HG-01', stage: '1.42m', flow: '12.8 m³/s' },
            { lat: location.lat - 0.005, lng: location.lng + 0.004, code: 'HG-02', stage: '2.10m', flow: '18.1 m³/s' }
          ];

          gauges.forEach(g => {
            L.circleMarker([g.lat, g.lng], {
              radius: 6,
              color: '#0891b2',
              fillColor: '#22d3ee',
              fillOpacity: 0.9,
              weight: 2
            }).addTo(watershedLayerRef.current)
              .bindPopup(`
                <div class="p-1 font-sans text-xs">
                  <b class="text-cyan-800">Watershed Telemetry Gauge (${g.code})</b><br/>
                  <span class="text-[10px] text-slate-600 font-bold">Stage: ${g.stage} | Flow: ${g.flow}</span>
                </div>
              `);
          });
        }

        const pings: [number, number, number][] = [
          [location.lat + 0.0005, location.lng + 0.0005, 1],
          [location.lat - 0.001, location.lng - 0.0005, 0.7],
          [location.lat + 0.001, location.lng - 0.001, 0.9],
          [location.lat + 0.002, location.lng + 0.0012, 0.85],
          [location.lat - 0.0018, location.lng + 0.0015, 0.6]
        ];

        pings.forEach((p, idx) => {
          L.circleMarker([p[0], p[1]], { radius: 7, color: '#0f172a', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 2 })
            .addTo(householdLayerRef.current)
            .bindPopup(`<b class="text-xs">Node CT-${idx + 101}</b><br/><span class="text-[10px] text-slate-500 font-bold">Active Mesh Relay</span><br/><span class="text-[9px] text-emerald-600 font-mono">Signal: ${Math.round(p[2] * 100)}%</span>`);

          // Safe vector gradient heat rings (100% resilient across container sizes and zoom levels)
          const intensity = p[2] || 1;
          L.circle([p[0], p[1]], {
            radius: 90 * intensity,
            color: 'transparent',
            fillColor: '#ef4444',
            fillOpacity: 0.10 * intensity,
            interactive: false
          }).addTo(heatmapLayerRef.current);

          L.circle([p[0], p[1]], {
            radius: 55 * intensity,
            color: 'transparent',
            fillColor: '#f59e0b',
            fillOpacity: 0.18 * intensity,
            interactive: false
          }).addTo(heatmapLayerRef.current);

          L.circle([p[0], p[1]], {
            radius: 25 * intensity,
            color: 'transparent',
            fillColor: '#06b6d4',
            fillOpacity: 0.28 * intensity,
            interactive: false
          }).addTo(heatmapLayerRef.current);
        });

        // AUTODESK CIVIL 3D SOLAR CANOPY CARPORT SITES
        const solarSites = [
          { name: 'SBCC West Campus Solar Carport', lat: 34.4061, lng: -119.7028, stalls: 260, apn: '045-120-019', cap: '1,040 kWp' },
          { name: 'Santa Barbara Airport Terminal Solar Carport', lat: 34.4262, lng: -119.8404, stalls: 480, apn: '073-090-008', cap: '1,920 kWp' },
          { name: 'Cabrillo Pavilion Waterfront Solar Carport', lat: 34.4173, lng: -119.6698, stalls: 95, apn: '017-310-002', cap: '380 kWp' },
          { name: 'Paseo Nuevo Structure Lot #10 Solar Canopy', lat: 34.4195, lng: -119.6997, stalls: 165, apn: '037-142-011', cap: '660 kWp' },
          { name: 'SB County Administration Solar Canopy', lat: 34.4243, lng: -119.7022, stalls: 130, apn: '027-210-004', cap: '520 kWp' }
        ];

        solarSites.forEach(site => {
          const canopyBounds: [[number, number], [number, number]] = [
            [site.lat - 0.0003, site.lng - 0.0005],
            [site.lat + 0.0003, site.lng + 0.0005]
          ];
          L.rectangle(canopyBounds, {
            color: '#f59e0b',
            weight: 2,
            fillColor: '#0284c7',
            fillOpacity: 0.7,
            dashArray: '4, 2'
          }).addTo(solarLayerRef.current).bindPopup(`
            <div style="font-family:sans-serif; min-width:200px;">
              <b style="color:#d97706; font-size:12px;">☀️ ${site.name}</b><br/>
              <span style="font-size:10px; color:#64748b; font-family:monospace;">APN: ${site.apn}</span><br/>
              <div style="margin-top:4px; font-size:11px; background:#f0f9ff; padding:4px 8px; border-radius:6px; border:1px solid #bae6fd;">
                <strong>Capacity:</strong> ${site.cap} (${site.stalls} Stalls)<br/>
                <span style="color:#059669; font-weight:bold;">100% Net-Zero Energy Balance</span>
              </div>
            </div>
          `);
        });

        updateBaseLayer();
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
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
      { ref: watershedLayerRef, active: layers.watershed },
      { ref: householdLayerRef, active: layers.households },
      { ref: heatmapLayerRef, active: layers.heatmap },
      { ref: solarLayerRef, active: layers.solar }
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
             { id: 'watershed', label: 'Watershed & Basin', icon: '🌊', color: 'bg-cyan-500', isLive: !!gisLayers?.watershed },
             { id: 'solar', label: 'Solar Canopies', icon: '☀️', color: 'bg-amber-500', isLive: true },
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
