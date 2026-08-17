
import React from 'react';

export const Documentation: React.FC = () => {
  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-6 lg:p-12 scrollbar-thin scrollbar-thumb-slate-300" role="main">
      <div className="max-w-4xl mx-auto space-y-16 py-8">
        <header className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-full text-xs font-black uppercase tracking-widest">
            <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse"></span>
            Official Angel Sharks Docs
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">Civic Twin Operations</h1>
          <p className="text-xl text-slate-700 font-bold leading-relaxed max-w-2xl">
            Technical guide for managing the Digital Twin and resolving common synchronization hurdles.
          </p>
        </header>

        <section className="space-y-12">
          {/* FIREFOX POPUP FIX */}
          <div className="p-10 bg-rose-50 border border-rose-200 rounded-[3rem] shadow-xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <div className="text-8xl">🦊</div>
            </div>
            <h2 className="text-3xl font-black text-rose-900 flex items-center gap-5 tracking-tight">
              Firefox Troubleshooting
            </h2>
            <div className="prose prose-slate max-w-none space-y-6">
              <p className="text-slate-800 leading-relaxed font-bold">
                If the API Key selection or GitHub Shard bridge doesn't open in Firefox:
              </p>
              
              <ul className="space-y-4 text-sm font-bold text-slate-700">
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] shrink-0">A</span>
                  Check the URL bar for a "Pop-up Blocked" icon (usually a small window with a red X).
                </li>
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] shrink-0">B</span>
                  Click "Allow Pop-ups for this site" and retry the action.
                </li>
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] shrink-0">C</span>
                  If using the GitHub Sync button, ensure you are logged into GitHub in another tab first.
                </li>
              </ul>
            </div>
          </div>

          <div className="p-10 bg-white border border-blue-200 rounded-[3rem] shadow-xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <div className="text-8xl">🔗</div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-5 tracking-tight">
              Definitive Sharing Guide
            </h2>
            <div className="prose prose-slate max-w-none space-y-6">
              <p className="text-slate-800 leading-relaxed font-bold text-lg">
                To share the app so users see <strong>ONLY THE DASHBOARD</strong> and not the code:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest">Step 1: Admin Toggle</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Go to the <strong>Admin &gt; Share</strong> tab and copy the "Public Link". This link appends <code className="bg-slate-100 px-1">?view=public</code> to the URL, which activates the production view.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest">Step 2: External Preview</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Use the "Pop-out" button in the top right of this preview pane to get a standalone URL. Share that URL (with the public view param) for a code-free experience.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 bg-slate-900 text-white rounded-[3rem] shadow-2xl space-y-8 border border-slate-800">
            <h2 className="text-3xl font-black flex items-center gap-5 tracking-tight text-emerald-400">
              <span className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl">🛠️</span>
              GitHub Organization Sync
            </h2>
            <p className="text-slate-400 font-bold leading-relaxed">
              If the "Sync to GitHub" UI is persistent with old metadata (ADD12), our <strong>Rescue Bridge</strong> in Admin allows you to manually push the code state directly to the <strong>AngelSharks/Civic-Twin</strong> repository.
            </p>
          </div>

          <div className="p-10 bg-white border border-slate-200 rounded-[3rem] shadow-xl space-y-8">
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-5 tracking-tight">
              <span className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl">🚀</span>
              How to do a Pull Request (PR)
            </h2>
            <div className="prose prose-slate max-w-none space-y-6">
              <p className="text-slate-800 leading-relaxed font-bold">
                Follow these steps to contribute code to the official repository:
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black shrink-0">1</div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Stage Your Changes</h4>
                    <p className="text-xs text-slate-600">Use the <strong>"Architect Civic Twin PR"</strong> button in the Dashboard or Admin panel. This uses Gemini to analyze your current twin configuration and write a professional PR description.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black shrink-0">2</div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Authorize with PAT</h4>
                    <p className="text-xs text-slate-600">To automate the PR creation, you must provide a <strong>GitHub Personal Access Token (PAT)</strong> in the Admin &gt; Sync tab or as a <code className="bg-slate-100 px-1">VITE_GITHUB_TOKEN</code> environment variable. (Find this in the <strong>AI Studio Sidebar &gt; Settings &gt; Secrets</strong>). Ensure the token has <code className="bg-slate-100 px-1">repo</code> scope.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black shrink-0">3</div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Manual Population</h4>
                    <p className="text-xs text-slate-600">If you want to push the entire codebase: Download the project as a ZIP from the AI Studio sidebar, unzip it locally, and run <code className="bg-slate-100 px-1">git push</code> to the AngelSharks/Civic-Twin repository.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="pt-20 pb-12 border-t border-slate-200 flex flex-col items-center gap-10 text-center">
          <p className="text-slate-500 font-black text-xs uppercase tracking-[0.5em]">
            Official Angel Sharks Repository: <a href="https://github.com/AngelSharks/Civic-Twin" className="text-blue-600 hover:underline">AngelSharks/Civic-Twin</a>
          </p>
        </footer>
      </div>
    </div>
  );
};
