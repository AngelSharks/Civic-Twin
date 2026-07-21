
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Mic, Shield, Wifi, WifiOff, LogOut, Book, Settings, LayoutDashboard, Map as MapIcon } from 'lucide-react';
import { Layout } from './components/Layout';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { CIDLogin } from './components/CIDLogin';
import { DemoLogin } from './components/DemoLogin';
import { TwinMetadata, SmartCityInsight, ViewType, ConnectivityStatus, CIDUser } from './types';
import { generateDigitalTwinInsights } from './services/geminiService';

// Lazy load heavy components
const GISAnalysis = lazy(() => import('./components/GISAnalysis').then(m => ({ default: m.GISAnalysis })));
const AdminSettings = lazy(() => import('./components/AdminSettings').then(m => ({ default: m.AdminSettings })));
const Documentation = lazy(() => import('./components/Documentation').then(m => ({ default: m.Documentation })));
const Planet4DPanel = lazy(() => import('./components/Planet4DPanel').then(m => ({ default: m.Planet4DPanel })));
const AIChatPanel = lazy(() => import('./components/AIChatPanel').then(m => ({ default: m.AIChatPanel })));
const LiveAudioPanel = lazy(() => import('./components/LiveAudioPanel').then(m => ({ default: m.LiveAudioPanel })));

const STORAGE_KEY = 'civic_twin_persistence';

const LoadingFallback = () => (
  <div className="flex-1 flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading Module...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [metadata, setMetadata] = useState<TwinMetadata | null>(null);
  const [user, setUser] = useState<CIDUser | null>(null);
  const [insights, setInsights] = useState<SmartCityInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>('online');

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isDemoAuthorized, setIsDemoAuthorized] = useState(false);

  const fetchInsights = useCallback(async (data: TwinMetadata) => {
    if (!navigator.onLine || isLoading) return;
    setIsLoading(true);
    try {
      const results = await generateDigitalTwinInsights(data);
      setInsights(results);
    } catch (err) {
      console.error("Failed to load twin insights", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (metadata && (metadata.version === 'v1' || metadata.version === 'v2' || metadata.version === 'v3')) {
      setMetadata({ ...metadata, version: 'v4' });
    }
  }, [metadata]);

  useEffect(() => {
    // Register Service Worker for offline support
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
      });
    }

    const isPublicView = window.location.search.includes('view=public');
    const saved = localStorage.getItem(STORAGE_KEY);
    const isLocalAuthorized = localStorage.getItem('demo_authorized') === 'true';

    if (isPublicView && isLocalAuthorized && !isDemoAuthorized) {
      setIsDemoAuthorized(true);
    }
    
    // If in public demo view, we prioritize the demo data over potentially stale local storage
    // unless the user has already authorized and we want to allow persistence within the session.
    if (saved && !isPublicView) {
      try {
        const { metadata: savedMetadata, insights: savedInsights, view: savedView, user: savedUser } = JSON.parse(saved);
        if (savedMetadata && !metadata) {
          const hydratedMetadata = { ...savedMetadata, version: savedMetadata.version || 'v4' };
          setMetadata(hydratedMetadata);
        }
        if (savedInsights && insights.length === 0) setInsights(savedInsights);
        if (savedView) setCurrentView(savedView);
        if (savedUser) setUser(savedUser);
      } catch (e) {
        console.error("Persistence hydration failed", e);
      }
    } else if (isPublicView && isDemoAuthorized && !metadata) {
      // Load Demo Data for Public Viewers ONLY after authorization
      // This ensures a fresh Saratoga Springs start every time they log in to the demo
      const demoMetadata: TwinMetadata = {
        name: "Saratoga Springs",
        address: "123 Broadway, Saratoga Springs, NY",
        type: "City",
        location: { lat: 43.0831, lng: -73.7846, displayName: "Saratoga Springs, NY" },
        cids: [
          { id: '772', name: `Saratoga Central CID`, population: 1200, meshActive: true },
          { id: '104', name: `Saratoga Highlands CID`, population: 850, meshActive: true }
        ],
        isEmergencyMode: false,
        version: "v4"
      };
      setMetadata(demoMetadata);
      fetchInsights(demoMetadata);
    }
  }, [fetchInsights, isDemoAuthorized, metadata, insights.length]);

  useEffect(() => {
    if (metadata) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        metadata,
        insights,
        view: currentView,
        user
      }));
    }
  }, [metadata, insights, currentView, user]);

  useEffect(() => {
    const updateStatus = () => {
      const isSimulatedOffline = !!window.localStorage.getItem('blan_isolated');
      setConnectivity((navigator.onLine && !isSimulatedOffline) ? 'online' : 'offline-fog');
    };
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);


  const handleOnboardingComplete = (data: TwinMetadata) => {
    setMetadata(data);
    fetchInsights(data);
  };

  const handleMeshLogin = (userData: CIDUser) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to log off? This will reset the application and clear all local community data.")) {
      // 1. Clear ALL storage to ensure no stale data persists
      window.localStorage.clear();
      window.sessionStorage.clear();
      localStorage.removeItem('demo_authorized');
      
      // 2. Clear all state explicitly
      setMetadata(null);
      setInsights([]);
      setUser(null);
      setIsDemoAuthorized(false);
      
      // 3. Force a hard redirect to a clean URL with cache-busting
      const isPublic = window.location.search.includes('view=public');
      const baseUrl = window.location.origin + window.location.pathname;
      const cleanUrl = isPublic ? `${baseUrl}?view=public` : baseUrl;
      const finalUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}nocache=${Date.now()}`;
      
      window.location.href = finalUrl;
    }
  };

  const renderContent = () => {
    const isPublicView = window.location.search.includes('view=public');
    const isLocalAuthorized = localStorage.getItem('demo_authorized') === 'true';
    
    if (isPublicView && !isDemoAuthorized && !isLocalAuthorized) {
      // Fast redirect to static login for better performance
      window.location.href = '/login';
      return <LoadingFallback />;
    }

    return (
      <Suspense fallback={<LoadingFallback />}>
        {(() => {
          if (currentView === 'documentation') return <Documentation />;
          if (currentView === 'admin') return <AdminSettings metadata={metadata} onUpdateMetadata={setMetadata} />;
          
          if (!metadata) return <Onboarding onComplete={handleOnboardingComplete} onReset={handleReset} />;

          if (currentView === 'mesh-gateway') {
            return <CIDLogin cids={metadata.cids} onLogin={handleMeshLogin} isOverlay={false} />;
          }

          switch (currentView) {
            case 'dashboard':
              return (
                <Dashboard 
                  metadata={metadata} 
                  insights={insights} 
                  isLoading={isLoading} 
                  onRefresh={() => fetchInsights(metadata)}
                  connectivity={connectivity}
                  user={user || { id: 'GUEST', role: 'RESIDENT', cid: 'PUBLIC', name: 'Public Guest' }}
                  isTacticalLocked={false}
                  onReset={handleReset}
                />
              );
            case 'gis-analysis':
              return <GISAnalysis metadata={metadata} connectivity={connectivity} />;
            case 'planet-4d':
              return <Planet4DPanel metadata={metadata} onUpdateMetadata={setMetadata} />;
            default:
              return null;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <Layout 
      currentView={currentView} 
      onViewChange={setCurrentView} 
      isMetadataSet={!!metadata}
      connectivity={connectivity}
      onReset={handleReset}
    >
      {/* SECURITY SHROUD OVERLAY (Mock) */}
      {metadata?.isProductionMode && (
        <div className="fixed inset-0 pointer-events-none z-[9999] border-[16px] border-emerald-500/5 opacity-40 mix-blend-overlay animate-pulse"></div>
      )}
      
      <motion.main 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col min-h-0"
      >
        {renderContent()}
      </motion.main>

      {metadata && (
        <div className="fixed bottom-6 right-6 z-[3000] flex flex-col gap-3">
          <AnimatePresence>
            {user && user.role !== 'RESIDENT' && (
               <motion.button 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => setIsVoiceOpen(true)}
                className="w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:bg-emerald-500 active:scale-95 transition-all group"
              >
                <Mic className="w-6 h-6 group-hover:animate-pulse" />
              </motion.button>
            )}
            <motion.button 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => setIsChatOpen(true)}
              className="w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:bg-blue-500 active:scale-95 transition-all group"
            >
              <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
            </motion.button>
          </AnimatePresence>
        </div>
      )}

      <Suspense fallback={null}>
        {isChatOpen && <AIChatPanel metadata={metadata} onClose={() => setIsChatOpen(false)} />}
        {isVoiceOpen && <LiveAudioPanel metadata={metadata} onClose={() => setIsVoiceOpen(false)} />}
      </Suspense>
    </Layout>
  );
};

export default App;
