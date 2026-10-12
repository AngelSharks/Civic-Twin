import React, { useState } from 'react';

export const Documentation: React.FC = () => {
  const [activeDocTab, setActiveDocTab] = useState<'canopy-guide' | 'tools' | 'civil3d' | 'ops'>('canopy-guide');

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-6 lg:p-12 scrollbar-thin scrollbar-thumb-slate-300" role="main">
      <div className="max-w-5xl mx-auto space-y-12 py-6">
        
        {/* Header */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-full text-xs font-black uppercase tracking-widest">
            <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse"></span>
            Official Angel Sharks Engineering Docs • Version V.07
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Civic Twin Platform &amp; Solar Canopy Manual
          </h1>
          <p className="text-lg text-slate-700 font-medium leading-relaxed max-w-3xl">
            Comprehensive operating documentation covering tool usage, interactive parking canopy rotation and alignment, Autodesk Civil 3D LandXML export, and stakeholder PDF generation.
          </p>

          {/* Quick Doc Navigation Tabs */}
          <div className="flex flex-wrap gap-2 pt-2 border-b border-slate-200 pb-4">
            <button
              onClick={() => setActiveDocTab('canopy-guide')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeDocTab === 'canopy-guide'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>📐</span> Canopy Alignment Guide
            </button>
            <button
              onClick={() => setActiveDocTab('tools')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeDocTab === 'tools'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>🛠️</span> Platform Tool Use
            </button>
            <button
              onClick={() => setActiveDocTab('civil3d')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeDocTab === 'civil3d'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>⚡</span> LandXML &amp; Stakeholder PDF
            </button>
            <button
              onClick={() => setActiveDocTab('ops')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeDocTab === 'ops'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>⚙️</span> Operations &amp; Troubleshooting
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* TAB 1: CANOPY PLACEMENT & ROTATION ALIGNMENT GUIDE */}
        {/* ========================================================================= */}
        {activeDocTab === 'canopy-guide' && (
          <section className="space-y-8 animate-fadeIn">
            
            {/* Overview Hero Card */}
            <div className="p-8 lg:p-10 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white rounded-3xl shadow-xl space-y-6 border border-sky-800/40">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-xl">
                  📐
                </span>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                    How to Rotate &amp; Align Canopies with Parking Areas
                  </h2>
                  <p className="text-xs text-sky-300 font-mono">
                    Geometric Alignment • Drive Aisle Orientation • Geodesic Projection
                  </p>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">
                Commercial parking lots are virtually never oriented true North-South; parking stalls and circulation aisles follow street grid azimuths, coastal bluff geometry, and property easements. Civic Twin provides interactive 2D Euclidean rotation controls that dynamically re-calculate every canopy corner vertex and drilled-shaft foundation pier on the Leaflet map and in the exported LandXML 1.2 package.
              </p>

              {/* ASCII Diagram Card */}
              <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-700/80 font-mono text-xs text-sky-300 overflow-x-auto">
                <pre>{`       True North (0°)
             ↑
             |   Drive Aisle Angle (e.g. 64° NE)
             |      ↗
             |    /  [====================]  <-- Canopy Array Rotated to Match Aisle
             |  /    |  P1   P2   P3   P4 |      (Stanchion Piers CP-01...CP-08 Aligned)
             |/      [====================]
             +------------------------------→ East (90°)`}</pre>
              </div>
            </div>

            {/* Step-by-Step Alignment Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Method 1 */}
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 font-black flex items-center justify-center text-sm">
                  1
                </div>
                <h3 className="text-base font-black text-slate-900">
                  Interactive Dragging &amp; Teleportation
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  • <strong>Drag the Blue Sun Pin (☀️):</strong> Click and hold the center marker on the satellite map to drag the canopy directly over parking stalls.<br/>
                  • <strong>Single-Click Anywhere:</strong> Clicking anywhere on the parking surface teleports the canopy center while preserving orientation and dimensions.
                </p>
              </div>

              {/* Method 2 */}
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 font-black flex items-center justify-center text-sm">
                  2
                </div>
                <h3 className="text-base font-black text-slate-900">
                  One-Click Parking Aisle Presets
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  In the configuration sidebar, click <strong>"Auto-Align with Parking Aisle"</strong> to snap to the lot's pre-surveyed drive aisle angle:
                  <br/>• <strong>SBCC West Lot:</strong> 64° (Cliff Drive coastal bluff)
                  <br/>• <strong>Paseo Nuevo:</strong> 112° (Downtown grid)
                  <br/>• <strong>SB Courthouse:</strong> 118° (Civic perimeter)
                  <br/>• <strong>Waterfront Lot:</strong> 108° (Harbor shoreline)
                </p>
              </div>

              {/* Method 3 */}
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-sm">
                  3
                </div>
                <h3 className="text-base font-black text-slate-900">
                  Continuous 0° to 360° Rotation Slider
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Use the rotation slider in the sidebar to rotate the canopy in 1-degree increments. Watch the high-resolution satellite imagery to align the canopy edges with asphalt striping and curbs.
                </p>
              </div>

              {/* Method 4 */}
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black flex items-center justify-center text-sm">
                  4
                </div>
                <h3 className="text-base font-black text-slate-900">
                  On-Canvas Floating Rotation Widget
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  On the upper-left of the satellite map, use the floating alignment pill (<strong>↺ -15°</strong> / <strong>↻ +15°</strong>) to fine-tune alignment directly on the map without scrolling the sidebar.
                </p>
              </div>

            </div>

            {/* Mathematical Transformation Details */}
            <div className="p-8 bg-slate-100 rounded-3xl border border-slate-200 space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>🧮</span> Mathematical Geodesic Rotation Formula
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                When the canopy angle θ changes, local Cartesian coordinates (in survey feet) are rotated via the 2D rotation matrix:
              </p>
              <div className="p-3 bg-white rounded-xl border border-slate-300 font-mono text-xs text-slate-800 overflow-x-auto">
                <code>
                  X_rot = X_local * cos(θ) - Y_local * sin(θ)<br/>
                  Y_rot = X_local * sin(θ) + Y_local * cos(θ)<br/>
                  Lat_corner = Lat_center + (Y_rot * 0.00000274)<br/>
                  Lng_corner = Lng_center + (X_rot * 0.00000334)
                </code>
              </div>
              <p className="text-[11px] text-slate-600">
                The conversion factors are calibrated for Santa Barbara's latitude (34.42° N). The exact same rotation matrix applies to all drilled-shaft foundation piers and is recorded into the LandXML 1.2 file in California State Plane Zone V (EPSG: 2229) coordinates.
              </p>
            </div>

          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PLATFORM TOOL USE */}
        {/* ========================================================================= */}
        {activeDocTab === 'tools' && (
          <section className="space-y-8 animate-fadeIn">
            
            <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span>🛠️</span> Civic Twin Platform Tools Directory
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                A quick-reference guide to the specialized tools and simulation interfaces available across the Civic Twin platform:
              </p>

              {/* Tools Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Tool Name</th>
                      <th className="py-2.5 px-3">Navigation Path</th>
                      <th className="py-2.5 px-3">Primary Action</th>
                      <th className="py-2.5 px-3">Output Format</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-sky-700">Canopy 3D Planner</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Civil 3D Solar Proposal &gt; Designer</td>
                      <td className="py-3 px-3">Interactive drag, resizing, and rotation over parking stalls</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Leaflet 2D/3D Polygon</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-emerald-700">Net-Zero Auto-Scaler</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Sidebar &gt; Auto-Scale 100% Net-Zero</td>
                      <td className="py-3 px-3">Automatically sizes canopy and BESS battery to hit 100% self-sufficiency</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Optimal Dimensions &amp; Storage</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-amber-700">Solar Yield Simulation</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Top Switcher &gt; ⚡ Simulation</td>
                      <td className="py-3 px-3">Multi-decadal NREL TMY3 irradiance calculation across 4 climate scenarios</td>
                      <td className="py-3 px-3 font-mono text-[11px]">8,760 Energy Balance &amp; CSV</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-emerald-600">Economic Impact &amp; ROI</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Top Switcher &gt; 📈 Economic Impact</td>
                      <td className="py-3 px-3">20-Year ROI, simple &amp; discounted payback, IRR, NPV, CPA tariffs, and carbon offset credits</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Cash Flow Ledger &amp; CSV</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono text-[11px]">Simulation Toolbar &gt; 📑 Stakeholder PDF</td>
                      <td className="py-3 px-3">Compiles 2-page executive summary with KPI scorecards, ledger, and PE signatures</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Vector PDF (.pdf)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-purple-700">LandXML 1.2 Exporter</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Floating Toolbar &gt; 📐 Download LandXML</td>
                      <td className="py-3 px-3">Generates Autodesk Civil 3D exchange package with rotated State Plane coordinates</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Official LandXML (.xml)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-indigo-700">Property Twin Layer</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Top Switcher &gt; Property Digital Twin</td>
                      <td className="py-3 px-3">Stores committed proposal records and links with municipal GIS parcels</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Local Storage &amp; GIS Layer</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-cyan-700">Tactical GIS Core</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Main Navigation &gt; GIS Analysis</td>
                      <td className="py-3 px-3">Simulates hydrology, stormwater surcharge, traffic flow, and emergency routing</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Interactive Spatial Map</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-700">B-LAN Tactical Mesh</td>
                      <td className="py-3 px-3 font-mono text-[11px]">Main Navigation &gt; B-LAN Mesh</td>
                      <td className="py-3 px-3">Web Bluetooth peer-to-peer off-grid emergency mesh broadcasting</td>
                      <td className="py-3 px-3 font-mono text-[11px]">BLE Packets &amp; Broadcast</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LANDXML & STAKEHOLDER PDF INTEGRATION */}
        {/* ========================================================================= */}
        {activeDocTab === 'civil3d' && (
          <section className="space-y-8 animate-fadeIn">
            
            {/* Stakeholder PDF Details */}
            <div className="p-8 bg-white border border-rose-200 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl">
                  📑
                </span>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Executive Stakeholder PDF Summary
                  </h3>
                  <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">
                    Client-Side PDF Generation via jsPDF
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                The Stakeholder PDF is engineered specifically for city councils, property owners, and PE reviewers who need an authoritative, non-technical executive summary alongside technical specifications:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 block">Page 1: Project &amp; Engineering Specs</span>
                  <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px]">
                    <li>Project name, APN, property address, and zoning</li>
                    <li>6 KPI scorecards: Annual Yield, Net-Zero %, Specific Yield, Avoided Cost, 25-Yr Yield, Islanding Hours</li>
                    <li>Civil 3D Carport Physical Specs (dimensions, stall count, structural steel tonnage, drilled shaft piers)</li>
                    <li>Microgrid battery storage &amp; EV charger capacity</li>
                  </ul>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 block">Page 2: 12-Month Ledger &amp; Sign-off</span>
                  <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px]">
                    <li>12-Month Historical Irradiance &amp; Energy Balance Table</li>
                    <li>GHI, POA, effective cell temperature, solar yield, baseline demand, net balance, and dollar savings</li>
                    <li>3-Phase battery storage dispatch schedule</li>
                    <li>Official 3-party PE, Property Owner, and Municipal sign-off block</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* LandXML 1.2 Details */}
            <div className="p-8 bg-white border border-purple-200 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl">
                  📐
                </span>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Autodesk Civil 3D LandXML 1.2 Integration
                  </h3>
                  <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">
                    NAD83 California State Plane Zone V (US Survey Feet, EPSG: 2229)
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Clicking <strong>"Download LandXML (.xml)"</strong> generates an industry-standard LandXML 1.2 file that imports seamlessly into Autodesk Civil 3D, Trimble Business Center, and Bentley InRoads.
              </p>

              <div className="p-4 bg-slate-900 rounded-2xl text-slate-300 font-mono text-[11px] space-y-2 overflow-x-auto">
                <div className="text-sky-400 font-bold">&lt;!-- How to import in Autodesk Civil 3D --&gt;</div>
                <div>1. In Civil 3D, open your project DWG.</div>
                <div>2. Navigate to Ribbon: <strong>Insert &gt; LandXML</strong>.</div>
                <div>3. Select the downloaded <code className="text-amber-400">Civil3D_Solar_Proposal_*.xml</code> file.</div>
                <div>4. Check <strong>"Survey Point Groups"</strong> and <strong>"Surfaces"</strong>.</div>
                <div>5. The rotated canopy corners (CP-01..CP-04) and foundation piers will appear at their exact survey coordinates.</div>
              </div>
            </div>

          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: OPERATIONS & TROUBLESHOOTING */}
        {/* ========================================================================= */}
        {activeDocTab === 'ops' && (
          <section className="space-y-10 animate-fadeIn">
            
            {/* FIREFOX POPUP FIX */}
            <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl shadow-sm space-y-4">
              <h2 className="text-2xl font-black text-rose-900 flex items-center gap-3">
                <span>🦊</span> Firefox Troubleshooting
              </h2>
              <p className="text-slate-800 text-xs font-bold">
                If the API Key selection or GitHub bridge doesn't open in Firefox:
              </p>
              <ul className="space-y-2 text-xs font-medium text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] shrink-0">A</span>
                  Check the URL bar for a "Pop-up Blocked" icon (usually a small window with a red X).
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] shrink-0">B</span>
                  Click "Allow Pop-ups for this site" and retry the action.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] shrink-0">C</span>
                  If using the GitHub Sync button, ensure you are logged into GitHub in another tab first.
                </li>
              </ul>
            </div>

            {/* DEFINITIVE SHARING GUIDE */}
            <div className="p-8 bg-white border border-blue-200 rounded-3xl shadow-sm space-y-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span>🔗</span> Public Sharing Guide
              </h2>
              <p className="text-slate-800 text-xs font-medium">
                To share the app so users see only the municipal dashboard without code editors:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <h4 className="text-[11px] font-black text-blue-600 uppercase">Step 1: Admin Toggle</h4>
                  <p className="text-xs text-slate-600">
                    Go to <strong>Admin &gt; Share</strong> tab and copy the "Public Link". This appends <code className="bg-white px-1 border rounded">?view=public</code> to activate production presentation mode.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <h4 className="text-[11px] font-black text-blue-600 uppercase">Step 2: External Preview</h4>
                  <p className="text-xs text-slate-600">
                    Use the "Pop-out" button in the upper-right of this preview pane to open the standalone URL.
                  </p>
                </div>
              </div>
            </div>

            {/* GITHUB PR WORKFLOW */}
            <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span>🚀</span> Pull Request (PR) Workflow
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stage updates to the official repository at <a href="https://github.com/AngelSharks/Civic-Twin" target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">AngelSharks/Civic-Twin</a>:
              </p>
              <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside">
                <li>Click <strong>"Architect Civic Twin PR"</strong> in the Dashboard or Admin panel to generate an AI change summary.</li>
                <li>Ensure a GitHub Personal Access Token (PAT) with <code className="bg-slate-100 px-1">repo</code> scope is configured in Admin &gt; Sync.</li>
                <li>Submit the automated PR directly to the <code className="bg-slate-100 px-1 font-bold">main</code> branch.</li>
              </ol>
            </div>

          </section>
        )}

        {/* Footer */}
        <footer className="pt-10 pb-8 border-t border-slate-200 flex flex-col items-center gap-4 text-center">
          <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em]">
            Official Angel Sharks Repository: <a href="https://github.com/AngelSharks/Civic-Twin" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">AngelSharks/Civic-Twin</a>
          </p>
          <p className="text-slate-400 text-xs">
            Open-Source Municipal Digital Twin Platform • Permissive MIT License
          </p>
        </footer>

      </div>
    </div>
  );
};
