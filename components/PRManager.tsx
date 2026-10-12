
import React, { useState } from 'react';
import { TwinMetadata, SmartCityInsight } from '../types';
import { createGitHubPR, DEFAULT_GITHUB_TOKEN } from '../services/githubService';

interface PRManagerProps {
  metadata: TwinMetadata;
  insights: SmartCityInsight[];
  prContent: { title: string; body: string } | null;
  onClose: () => void;
  isGenerating: boolean;
}

export const PRManager: React.FC<PRManagerProps> = ({ metadata, insights, prContent, onClose, isGenerating }) => {
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [branchZipUrl, setBranchZipUrl] = useState<string | null>(null);

  const handleCopy = () => {
    if (!prContent) return;
    const fullText = `# ${prContent.title}\n\n${prContent.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPR = async () => {
    const rawToken = metadata?.githubToken;
    const token = rawToken && !rawToken.includes('github_pat_YOUR_TOKEN_HERE') && rawToken.trim() !== 'github_pat_'
      ? rawToken
      : (import.meta.env.VITE_GITHUB_TOKEN || DEFAULT_GITHUB_TOKEN);

    if (!prContent || !token || token.includes('github_pat_YOUR_TOKEN_HERE') || token.trim() === 'github_pat_') {
      setSubmitStatus('error');
      setErrorMessage("Valid GitHub Personal Access Token (PAT) required. Add it in Admin Settings.");
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const prData = await createGitHubPR(REPO_NAME, token, prContent.title, prContent.body, metadata);
      setPrUrl(prData.html_url);
      setBranchZipUrl(`https://github.com/${REPO_NAME}/archive/refs/heads/${prData.head.ref}.zip`);
      setSubmitStatus('success');
      // Don't auto-close if successful, let them see the links
    } catch (err: any) {
      setSubmitStatus('error');
      setErrorMessage(err.message || "Failed to create PR");
    } finally {
      setIsSubmitting(false);
    }
  };

  // VERIFIED REPOSITORY PATH
  const REPO_NAME = "AngelSharks/Civic-Twin";

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden">
        
        <header className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-900/20">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">Daily GitHub Backup & Version Control</h2>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-800 text-blue-400 border border-slate-700">
                  {metadata?.version || 'v2'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Target: {REPO_NAME} (main branch)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href={`https://github.com/${REPO_NAME}/archive/refs/heads/main.zip`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border border-slate-700"
              title="Download latest main branch ZIP from GitHub"
            >
              <span>📥</span> Download Latest ZIP
            </a>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-8 custom-scrollbar">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-blue-500 animate-pulse">AI</div>
              </div>
              <div className="text-center">
                <p className="text-blue-500 font-black text-sm uppercase tracking-[0.3em]">Generating System PR</p>
                <p className="text-slate-500 text-xs mt-2 font-medium">Analyzing NIST layers and architectural delta...</p>
              </div>
            </div>
          ) : submitStatus === 'success' ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-emerald-600/20 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl shadow-emerald-900/20">
                ✅
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-white">PR Dispatched Successfully</h3>
                <p className="text-slate-400 font-medium">Your configuration has been architected to GitHub.</p>
              </div>
              
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a 
                  href={prUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-6 bg-slate-950 border border-slate-800 rounded-3xl hover:border-blue-500/50 transition-all group"
                >
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">View on GitHub</p>
                  <p className="text-xs text-slate-300 font-bold group-hover:text-white">Open Pull Request ↗</p>
                </a>
                <a 
                  href={branchZipUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-6 bg-slate-950 border border-slate-800 rounded-3xl hover:border-emerald-500/50 transition-all group"
                >
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Download Version</p>
                  <p className="text-xs text-slate-300 font-bold group-hover:text-white">Download ZIP for this PR 📥</p>
                </a>
              </div>

              <button 
                onClick={onClose}
                className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white transition-colors"
              >
                Close Architect
              </button>
            </div>
          ) : prContent ? (
            <>
              {/* Context Preview */}
              <section className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Entity Manifest</h3>
                <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800/50 font-mono text-[10px] leading-relaxed">
                  <div className="text-blue-500/80 mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    SOURCE: {metadata?.name || 'Unknown Community'}
                  </div>
                  <div className="text-slate-500 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                    LOC: {metadata?.location?.lat?.toFixed(4) || '0.0000'}, {metadata?.location?.lng?.toFixed(4) || '0.0000'}
                  </div>
                </div>
              </section>

              {/* Editable Content Style Display */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Staged PR Description</h3>
                  <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all shadow-lg ${
                      copied 
                      ? 'bg-blue-500 text-white shadow-blue-900/20' 
                      : 'bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white shadow-slate-950'
                    }`}
                  >
                    {copied ? '✅ Copied to Clipboard' : '📋 Copy Markdown'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="group relative">
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-slate-100 font-bold text-sm shadow-inner">
                      {prContent.title}
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 text-slate-400 font-mono text-[11px] whitespace-pre-wrap leading-relaxed min-h-[200px] shadow-inner">
                      {prContent.body}
                    </div>
                    <div className="absolute bottom-4 right-4 text-[9px] font-black text-slate-700 uppercase tracking-widest">Markdown Encoded</div>
                  </div>
                </div>
              </section>

              {/* Instructions */}
              <section className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex gap-5 items-start">
                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                  ℹ️
                </div>
                <div>
                  <h4 className="text-blue-400 font-black text-xs uppercase mb-1">Deployment Steps</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    This content is prepared for the <strong>{REPO_NAME}</strong> repository. Copy the markdown, navigate to GitHub, and initiate a new PR targeting the <code>main</code> branch.
                  </p>
                </div>
              </section>
            </>
          ) : (
            <div className="text-center py-20 flex flex-col items-center space-y-4">
              <div className="text-4xl">📂</div>
              <p className="text-slate-500 font-bold italic">No PR changes currently staged for dispatch.</p>
            </div>
          )}
        </div>

        <footer className={`p-8 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row gap-4 ${submitStatus === 'success' ? 'hidden' : ''}`}>
          <button 
            onClick={onClose}
            className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-slate-400 font-black text-xs rounded-2xl transition-all uppercase tracking-widest"
          >
            Cancel
          </button>
          
          {metadata?.githubToken ? (
            <button 
              onClick={handleSubmitPR}
              disabled={isSubmitting || submitStatus === 'success'}
              className={`flex-1 flex items-center justify-center gap-3 font-black py-4 rounded-2xl transition-all active:scale-95 shadow-xl uppercase text-xs tracking-[0.2em] ${
                submitStatus === 'success' 
                ? 'bg-emerald-600 text-white' 
                : submitStatus === 'error'
                ? 'bg-rose-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Dispatching...
                </>
              ) : submitStatus === 'success' ? (
                '✅ PR Created Successfully'
              ) : submitStatus === 'error' ? (
                '❌ Retry Submission'
              ) : (
                '🚀 Stage & Submit Daily Backup PR'
              )}
            </button>
          ) : (
            <a 
              href={`https://github.com/${REPO_NAME}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-blue-900/30 uppercase text-xs tracking-[0.2em]"
            >
              Open GitHub Repository <span>↗</span>
            </a>
          )}
        </footer>
        {submitStatus === 'error' && (
          <div className="px-8 pb-4 bg-slate-950">
            <p className="text-[10px] text-rose-500 font-bold text-center uppercase tracking-widest">{errorMessage}</p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
};
