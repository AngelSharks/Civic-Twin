
import React, { useState } from 'react';
import { ViewType, ConnectivityStatus } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isMetadataSet: boolean;
  connectivity: ConnectivityStatus;
  onReset: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange, isMetadataSet, connectivity, onReset }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Detect if we are in "Public View" (Production Mode + Not in Admin)
  const isPublicView = window.location.search.includes('view=public');

  const getStatusDisplay = () => {
    switch(connectivity) {
      case 'online': 
        return { label: 'Online / Cloud Sync', color: 'bg-emerald-500', icon: '📡', text: 'text-emerald-700' };
      case 'offline-fog': 
        return { label: 'Gemma Core Active', color: 'bg-indigo-500', icon: '💎', text: 'text-indigo-700' };
      default: 
        return { label: 'Disconnected', color: 'bg-rose-500', icon: '✕', text: 'text-rose-700' };
    }
  };

  const status = getStatusDisplay();
  
  // CORRECTED REPOSITORY URL FOR ANGEL SHARKS
  const REPO_URL = "https://github.com/AngelSharks/Civic-Twin";
  const ORG_NAME = "Angel Sharks";

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-blue-100 ${isPublicView ? 'bg-white' : 'bg-slate-50'}`}>
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-[2000]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
            CT
          </div>
          <div className="hidden xs:block">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none">Civic Twin</h1>
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-xs font-black text-blue-700 uppercase tracking-widest">
                {ORG_NAME}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mr-6">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white shadow-sm transition-all duration-500 ${status.text} border-slate-200`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${status.color}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">{status.label}</span>
            <span className="text-sm md:hidden" title={status.label}>{status.icon}</span>
          </div>
        </div>

        <nav className="hidden lg:flex flex-1 items-center justify-end space-x-6 text-sm font-bold text-slate-600 mr-8">
          {(!isPublicView || isMetadataSet) && (
            <>
              <button 
                onClick={() => onViewChange('dashboard')}
                className={`transition-colors py-2 flex items-center gap-1.5 focus-visible:outline-blue-600 ${currentView === 'dashboard' ? 'text-blue-600' : 'hover:text-blue-600'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => onViewChange('gis-analysis')}
                disabled={!isMetadataSet}
                className={`transition-colors py-2 flex items-center gap-1.5 disabled:opacity-30 ${currentView === 'gis-analysis' ? 'text-rose-700 font-black' : 'hover:text-blue-600'}`}
              >
                GIS Analysis
              </button>
              <button 
                onClick={() => onViewChange('planet-4d')}
                disabled={!isMetadataSet}
                className={`transition-colors py-2 flex items-center gap-1.5 disabled:opacity-30 ${currentView === 'planet-4d' ? 'text-indigo-700 font-black' : 'hover:text-indigo-600'}`}
              >
                Planet 4D
              </button>
              <button 
                onClick={() => onViewChange('documentation')}
                className={`transition-colors py-2 flex items-center gap-1.5 ${currentView === 'documentation' ? 'text-emerald-700 font-black' : 'hover:text-emerald-700'}`}
              >
                Docs
              </button>
              {!isPublicView && (
                <button 
                  onClick={() => onViewChange('admin')}
                  className={`transition-colors py-2 flex items-center gap-1.5 ${currentView === 'admin' ? 'text-slate-900 font-black' : 'hover:text-slate-900'}`}
                >
                  ⚙️ Admin
                </button>
              )}

              <div className="h-6 w-px bg-slate-300 mx-2"></div>

              <button 
                onClick={() => onViewChange('mesh-gateway')}
                disabled={!isMetadataSet}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${currentView === 'mesh-gateway' ? 'bg-amber-600 text-white shadow-lg' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300'} disabled:opacity-30`}
              >
                <span className="animate-pulse">🆘</span>
                ACTIVATE B-LAN
              </button>
              
              <div className="h-6 w-px bg-slate-300 mx-2"></div>
              <a 
                href={REPO_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-black transition-all rounded-lg text-xs font-black text-white group shadow-lg"
              >
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full group-hover:scale-110 transition-transform"></span>
                CIVIC TWIN REPO
              </a>
            </>
          )}
          {isPublicView && (
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-6">
              Public Stakeholder Access Layer
            </div>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {/* Always show Log Off for non-public views to allow reset, or if metadata is set */}
          {(isMetadataSet || !window.location.search.includes('view=public')) && (
            <button 
              onClick={onReset}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-rose-600 hover:bg-rose-500 border border-rose-500 rounded-xl text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest transition-all shadow-lg shadow-rose-900/20 active:scale-95"
            >
              <span className="hidden xs:inline">🚀</span> RESTART / LOG OFF
            </button>
          )}
        </div>

        {(!isPublicView || isMetadataSet) && (
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors touch-manipulation focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <div className="w-6 h-5 flex flex-col justify-between" aria-hidden="true">
              <span className={`h-0.5 w-full bg-slate-700 rounded-full transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`h-0.5 w-full bg-slate-700 rounded-full transition-all ${isMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 w-full bg-slate-700 rounded-full transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        )}
      </header>

      {isMenuOpen && (!isPublicView || isMetadataSet) && (
        <div className="fixed inset-0 z-[1900] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <nav className="absolute right-0 top-0 bottom-0 w-3/4 max-w-sm bg-white shadow-2xl p-8 flex flex-col space-y-6 animate-in slide-in-from-right duration-300">
            <button 
              onClick={() => { onViewChange('dashboard'); setIsMenuOpen(false); }}
              className={`text-xl font-black text-left border-b border-slate-100 pb-4 ${currentView === 'dashboard' ? 'text-blue-700' : 'text-slate-900'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => { onViewChange('gis-analysis'); setIsMenuOpen(false); }}
              disabled={!isMetadataSet}
              className={`text-xl font-black text-left border-b border-slate-100 pb-4 ${currentView === 'gis-analysis' ? 'text-rose-700' : 'text-slate-900'}`}
            >
              GIS Analysis
            </button>
            <button 
              onClick={() => { onViewChange('admin'); setIsMenuOpen(false); }}
              className={`text-xl font-black text-left border-b border-slate-100 pb-4 ${currentView === 'admin' ? 'text-slate-900' : 'text-slate-900'}`}
            >
              ⚙️ Admin
            </button>
            {isMetadataSet && (
              <button 
                onClick={() => { onReset(); setIsMenuOpen(false); }}
                className="text-xl font-black text-left border-b border-slate-100 pb-4 text-rose-600"
              >
                Log Off / Restart
              </button>
            )}
            <div className="mt-auto flex flex-col items-center gap-1">
              <a href="https://angelsharks.net/" className="text-sm font-black text-blue-700 uppercase tracking-widest text-center hover:underline">Civic Twin by Angel Sharks</a>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Copyright 2026</span>
            </div>
          </nav>
        </div>
      )}

      <main className="flex-1 flex flex-col min-h-0">
        {children}
      </main>
    </div>
  );
};
