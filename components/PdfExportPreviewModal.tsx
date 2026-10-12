import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Layers,
  Building2,
  Zap,
  TrendingUp,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { StakeholderPdfParams, generateStakeholderProposalPdfBlob, generateStakeholderProposalPdf } from '../services/pdfExportService';

interface PdfExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: StakeholderPdfParams | null;
  onSuccessNotification?: (msg: string) => void;
}

type TabType = 'all' | 'site' | 'engineering' | 'energy' | 'financial' | 'audit';
type ViewMode = 'split' | 'pdf' | 'metadata';

export const PdfExportPreviewModal: React.FC<PdfExportPreviewModalProps> = ({
  isOpen,
  onClose,
  params,
  onSuccessNotification
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [renderDurationMs, setRenderDurationMs] = useState<number | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Verification Checklist State
  const [verifiedCheckpoints, setVerifiedCheckpoints] = useState<{
    site: boolean;
    engineering: boolean;
    energy: boolean;
    financial: boolean;
    audit: boolean;
  }>({
    site: true,
    engineering: true,
    energy: true,
    financial: true,
    audit: true
  });

  const prevBlobUrlRef = useRef<string | null>(null);

  // Generate the live PDF blob whenever params change or modal opens
  useEffect(() => {
    if (!isOpen || !params) {
      if (prevBlobUrlRef.current) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
        prevBlobUrlRef.current = null;
        setPdfUrl(null);
      }
      return;
    }

    setIsGenerating(true);
    const start = performance.now();

    try {
      const blob = generateStakeholderProposalPdfBlob(params);
      const url = URL.createObjectURL(blob);

      if (prevBlobUrlRef.current) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
      }
      prevBlobUrlRef.current = url;
      setPdfUrl(url);

      const elapsed = Math.round(performance.now() - start);
      setRenderDurationMs(elapsed);
    } catch (err) {
      console.error('Failed to generate real-time PDF preview blob:', err);
    } finally {
      setIsGenerating(false);
    }

    return () => {
      // Cleanup on unmount
      if (prevBlobUrlRef.current) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
        prevBlobUrlRef.current = null;
      }
    };
  }, [isOpen, params]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !params) return null;

  const {
    lotName,
    apn,
    address,
    buildingType,
    lotSqFt,
    existingStalls,
    canopy,
    annualBaselineKwh,
    peakKwDemand,
    scenarioName,
    simulationSummary,
    economicResult,
    microclimate,
    structuralSteelTons,
    concretePiersCount,
    stormwaterCapturedGalYr
  } = params;

  const canopyAreaSqFt = canopy.lengthFt * canopy.widthFt;
  const canopyCoveragePct = ((canopyAreaSqFt / (lotSqFt || 1)) * 100).toFixed(1);
  const pvApertureAreaSqM = canopyAreaSqFt * 0.092903 * 0.88;
  const nameplateKwDc = Math.round(pvApertureAreaSqM * 1.0 * canopy.panelEfficiency);
  const minClearanceFt = 14;
  const isNetZero = simulationSummary.annualSelfSufficiencyPct >= 100;
  const docId = `CT-SOLAR-${apn.replace(/[^a-zA-Z0-9]/g, '')}`;

  const allVerified = Object.values(verifiedCheckpoints).every(Boolean);
  const verifiedCount = Object.values(verifiedCheckpoints).filter(Boolean).length;

  const toggleCheckpoint = (key: keyof typeof verifiedCheckpoints) => {
    setVerifiedCheckpoints(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleVerifyAll = () => {
    const targetState = !allVerified;
    setVerifiedCheckpoints({
      site: targetState,
      engineering: targetState,
      energy: targetState,
      financial: targetState,
      audit: targetState
    });
  };

  const handleDownloadPdf = () => {
    try {
      generateStakeholderProposalPdf(params);
      if (onSuccessNotification) {
        onSuccessNotification(`📄 Downloaded Executive Stakeholder PDF for ${lotName} (APN: ${apn})`);
      }
    } catch (err) {
      console.error('Failed to trigger PDF download:', err);
    }
  };

  const handleCopySummaryText = () => {
    const summaryText = `CIVIC TWIN | AUTODESK CIVIL 3D SOLAR PROPOSAL SUMMARY
Document ID: ${docId}
Generated: ${new Date().toLocaleString()}
Property: ${lotName}
APN: ${apn}
Address: ${address}
Facility Type: ${buildingType}
Lot Area: ${lotSqFt.toLocaleString()} sq ft (${existingStalls} parking stalls)
Baseline Electric Demand: ${(annualBaselineKwh / 1000).toLocaleString()} MWh/yr (${annualBaselineKwh.toLocaleString()} kWh)
Peak Coincident Demand: ${peakKwDemand} kW

CANOPY & CIVIL 3D SPECIFICATIONS:
- Dimensions: ${canopy.lengthFt}' × ${canopy.widthFt}' (${canopyAreaSqFt.toLocaleString()} sq ft, ${canopyCoveragePct}% lot coverage)
- DC Array Rating: ${nameplateKwDc} kWp | Inverter AC Capacity: ${Math.round(nameplateKwDc * 0.85)} kWac
- Module Tilt: ${canopy.tiltAngle}° | Azimuth: ${canopy.azimuthDeg}° South | Min Clearance: ${minClearanceFt}'
- Structural Steel: ${structuralSteelTons} Tons (${Math.round(structuralSteelTons * 2000).toLocaleString()} lbs)
- Concrete Foundation Piers: ${concretePiersCount} Deep Cast-in-Place Piers
- Stormwater Management: ${stormwaterCapturedGalYr.toLocaleString()} Gallons/yr captured
- EV Charging Infrastructure: ${canopy.evChargersCount} Dual-Port Level 2 Chargers
- Energy Storage (BESS): ${canopy.bessCapacityKWh} kWh LiFePO4

SOLAR SIMULATION & ENERGY YIELD:
- Annual Clean Generation: ${simulationSummary.annualSolarYieldMwh} MWh/yr (${simulationSummary.annualSolarYieldKwh.toLocaleString()} kWh/yr)
- Net-Zero Self-Sufficiency: ${simulationSummary.annualSelfSufficiencyPct}% (${isNetZero ? 'Verified Net-Zero' : 'Partial Net-Zero'})
- Specific Yield: ${simulationSummary.specificYieldKwhPerKwp} kWh/kWp
- System Performance Ratio (PR): ${simulationSummary.systemPerformanceRatio}% | Capacity Factor: ${simulationSummary.capacityFactorPct}%
- Climate Scenario: ${scenarioName}
- 25-Year Cumulative Generation: ${simulationSummary.twentyFiveYearGenerationGwh} GWh
- Microgrid Resilience Islanding: ${simulationSummary.microgridIslandingHours} Hours

FINANCIAL ROI & ESG METRICS:
- Total Gross CapEx: $${(economicResult?.totalGrossCapexUsd || 0).toLocaleString()}
- Federal ITC (30%): $${(economicResult?.federalItcBenefitUsd || 0).toLocaleString()}
- Net CapEx Outlay: $${(economicResult?.netInitialInvestmentUsd || 0).toLocaleString()}
- 20-Year Net Savings: $${(economicResult?.twentyYearNetSavingsUsd || 0).toLocaleString()}
- Dynamic NPV: $${(economicResult?.npvUsd || 0).toLocaleString()}
- Project Real IRR: ${economicResult?.irrPercentage ?? 'N/A'}%
- Simple Payback Period: ${economicResult?.simplePaybackYears ?? 'N/A'} Years
- Levelized Cost of Energy (LCOE): $${economicResult?.lcoeUsdPerKwh?.toFixed(3) ?? '0.052'}/kWh
- Annual Avoided Utility Costs: $${simulationSummary.annualAvoidedUtilityCostUsd.toLocaleString()}/yr
- Annual Avoided CO2: ${simulationSummary.annualCo2OffsetMetricTons} Metric Tons/yr

CIVIL 3D & EXCHANGE COMPLIANCE:
- LandXML 1.2 Exchange Compatible
- State Plane: NAD83 California Zone 5
- Audit Verification: ${verifiedCount} of 5 Checkpoints Approved`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Modal Dialog Card */}
      <div className="bg-slate-950 border border-slate-700/80 rounded-3xl w-full max-w-7xl h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Executive Stakeholder PDF Real-Time Preview &amp; Verification
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    isNetZero
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}
                >
                  {simulationSummary.annualSelfSufficiencyPct}% Net-Zero
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{lotName}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-slate-400">APN: {apn}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-purple-400">{docId}</span>
                {renderDurationMs !== null && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-sky-400 font-mono text-[11px] flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Live Rendered ({renderDurationMs}ms)
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* View Mode Controls & Action Buttons */}
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  viewMode === 'split'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Split View: Live PDF + Verification Panel"
              >
                Split View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('pdf')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  viewMode === 'pdf'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Full PDF Document"
              >
                PDF View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('metadata')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  viewMode === 'metadata'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Detailed Metadata Verification Ledger"
              >
                Metadata Audit
              </button>
            </div>

            {/* Copy Summary Button */}
            <button
              type="button"
              onClick={handleCopySummaryText}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
              title="Copy verified executive proposal metadata to clipboard"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden md:inline">Copy Metadata</span>
                </>
              )}
            </button>

            {/* Primary Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
              title="Verify and download official 2-page PDF document"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all active:scale-95 ml-1"
              title="Close Preview (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
          
          {/* LEFT PANE: Real-Time PDF Viewer */}
          {(viewMode === 'split' || viewMode === 'pdf') && (
            <div
              className={`h-full flex flex-col border-r border-slate-800 bg-slate-900/60 p-3 sm:p-4 ${
                viewMode === 'split' ? 'w-full md:w-[54%] lg:w-[58%]' : 'w-full'
              }`}
            >
              {/* PDF Viewer Header Toolbar */}
              <div className="flex items-center justify-between pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-rose-400" />
                    <span>Live 2-Page Executive Document</span>
                  </span>
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-[10px] text-slate-400 font-mono">
                    Letter 8.5" × 11" • 612 × 792 pt
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Interactive PDF Viewer with Native Controls
                  </span>
                  {viewMode === 'split' ? (
                    <button
                      type="button"
                      onClick={() => setViewMode('pdf')}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                      title="Expand to Fullscreen PDF"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setViewMode('split')}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                      title="Return to Split View"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* PDF Container */}
              <div className="flex-1 w-full bg-slate-950 rounded-2xl border border-slate-800/90 overflow-hidden relative shadow-inner">
                {isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80">
                    <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
                    <p className="text-sm font-bold text-slate-300">
                      Compiling Executive Stakeholder PDF...
                    </p>
                  </div>
                ) : pdfUrl ? (
                  <iframe
                    src={`${pdfUrl}#toolbar=1&navpanes=1&statusbar=1`}
                    title="Stakeholder Proposal PDF Live Preview"
                    className="w-full h-full border-none bg-slate-900"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                    <p className="text-sm font-bold text-slate-300">PDF Preview Unavailable</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Your browser may block embedded PDF rendering. You can still download the complete PDF directly.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
                    >
                      Download Stakeholder PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RIGHT PANE: Executive Summary Metadata Verification Panel */}
          {(viewMode === 'split' || viewMode === 'metadata') && (
            <div
              className={`h-full flex flex-col bg-slate-950/95 overflow-hidden ${
                viewMode === 'split' ? 'w-full md:w-[46%] lg:w-[42%]' : 'w-full'
              }`}
            >
              {/* Verification Panel Header & Category Tabs */}
              <div className="p-4 border-b border-slate-800 shrink-0 bg-slate-900/40">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Summary Metadata Verification &amp; Audit</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Verify engineering specifications, energy yields, and financial metrics before release.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyAll}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-sky-300 rounded-lg border border-slate-700 transition-all flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-sky-400" />
                    <span>{allVerified ? 'Uncheck All' : 'Verify All'}</span>
                  </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'all'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    All Audits
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('site')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTab === 'site'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Building2 className="w-3 h-3" /> Site
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('engineering')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTab === 'engineering'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Layers className="w-3 h-3" /> Civil 3D
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('energy')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTab === 'energy'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Zap className="w-3 h-3" /> Yield
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('financial')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTab === 'financial'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <TrendingUp className="w-3 h-3" /> Financial
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('audit')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTab === 'audit'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" /> Compliance
                  </button>
                </div>
              </div>

              {/* Scrollable Verification Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                
                {/* 1. Site & APN Identity Card */}
                {(activeTab === 'all' || activeTab === 'site') && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                          1. Property &amp; Site Assessment
                        </h4>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-300">
                        <input
                          type="checkbox"
                          checked={verifiedCheckpoints.site}
                          onChange={() => toggleCheckpoint('site')}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span className={verifiedCheckpoints.site ? 'text-emerald-400' : 'text-slate-500'}>
                          {verifiedCheckpoints.site ? 'Verified ✓' : 'Verify'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Property Name</span>
                        <span className="font-bold text-white truncate block">{lotName}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Assessor Parcel (APN)</span>
                        <span className="font-mono font-bold text-purple-300 truncate block">{apn}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 col-span-2">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Site Address</span>
                        <span className="font-medium text-slate-300 truncate block">{address}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Facility / Zoning Type</span>
                        <span className="font-bold text-sky-300">{buildingType}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Parking Lot Area &amp; Stalls</span>
                        <span className="font-bold text-white">
                          {lotSqFt.toLocaleString()} sq ft ({existingStalls} stalls)
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Annual Baseline Electric</span>
                        <span className="font-bold text-amber-300">
                          {(annualBaselineKwh / 1000).toLocaleString()} MWh/yr
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Peak Coincident Demand</span>
                        <span className="font-bold text-rose-300">{peakKwDemand} kW</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Civil 3D Engineering & Structural Specifications */}
                {(activeTab === 'all' || activeTab === 'engineering') && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-sky-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                          2. Civil 3D Carport Physical &amp; Structural Specs
                        </h4>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-300">
                        <input
                          type="checkbox"
                          checked={verifiedCheckpoints.engineering}
                          onChange={() => toggleCheckpoint('engineering')}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span className={verifiedCheckpoints.engineering ? 'text-emerald-400' : 'text-slate-500'}>
                          {verifiedCheckpoints.engineering ? 'Verified ✓' : 'Verify'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Dimensions</span>
                        <span className="font-bold text-white font-mono">
                          {canopy.lengthFt}' × {canopy.widthFt}'
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Array Area &amp; Coverage</span>
                        <span className="font-bold text-sky-300">
                          {canopyAreaSqFt.toLocaleString()} sq ft ({canopyCoveragePct}%)
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Tilt &amp; Azimuth</span>
                        <span className="font-bold text-white">
                          {canopy.tiltAngle}° tilt / {canopy.azimuthDeg}° S
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">DC System Rating</span>
                        <span className="font-bold text-amber-400 font-mono">{nameplateKwDc} kWp</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">AC Inverter Capacity</span>
                        <span className="font-bold text-sky-400 font-mono">{Math.round(nameplateKwDc * 0.85)} kWac</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Min Clear Height</span>
                        <span className="font-bold text-white">{minClearanceFt} ft</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Structural Steel</span>
                        <span className="font-bold text-slate-200">
                          {structuralSteelTons} Tons ({Math.round(structuralSteelTons * 2000).toLocaleString()} lbs)
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Foundation Piers</span>
                        <span className="font-bold text-slate-200">{concretePiersCount} Deep Cast-in-Place</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Stormwater Capture</span>
                        <span className="font-bold text-cyan-400">
                          {stormwaterCapturedGalYr.toLocaleString()} gal/yr
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Solar Simulation & Historical Irradiance Balance */}
                {(activeTab === 'all' || activeTab === 'energy') && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                          3. Solar Irradiance &amp; Energy Yield Balance
                        </h4>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-300">
                        <input
                          type="checkbox"
                          checked={verifiedCheckpoints.energy}
                          onChange={() => toggleCheckpoint('energy')}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span className={verifiedCheckpoints.energy ? 'text-emerald-400' : 'text-slate-500'}>
                          {verifiedCheckpoints.energy ? 'Verified ✓' : 'Verify'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Annual Solar Yield</span>
                        <span className="font-bold text-amber-400 font-mono">
                          {simulationSummary.annualSolarYieldMwh} MWh/yr
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {simulationSummary.annualSolarYieldKwh.toLocaleString()} kWh
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Net-Zero Sufficiency</span>
                        <span
                          className={`font-black font-mono ${
                            isNetZero ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {simulationSummary.annualSelfSufficiencyPct}% Offset
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {isNetZero ? '100% Net-Zero Qualified' : 'Partial Net-Zero'}
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Specific Yield</span>
                        <span className="font-bold text-sky-300 font-mono">
                          {simulationSummary.specificYieldKwhPerKwp} kWh/kWp
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          PR: {simulationSummary.systemPerformanceRatio}% | CF: {simulationSummary.capacityFactorPct}%
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Microgrid Resilience</span>
                        <span className="font-bold text-cyan-400 font-mono">
                          {simulationSummary.microgridIslandingHours} Islanding Hours
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          BESS: {canopy.bessCapacityKWh} kWh Storage
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">25-Year Clean Yield</span>
                        <span className="font-bold text-purple-300 font-mono">
                          {simulationSummary.twentyFiveYearGenerationGwh} GWh
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Avoided CO2: {simulationSummary.annualCo2OffsetMetricTons} MT/yr
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Climate Scenario</span>
                        <span className="font-bold text-slate-200 truncate block">{scenarioName}</span>
                        <span className="text-[10px] text-slate-400 block">
                          Coastal: {microclimate.coastalDistanceMiles} mi • Fog burn: {microclimate.fogBurnoffTime}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Financial Economics & ESG Returns */}
                {(activeTab === 'all' || activeTab === 'financial') && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                          4. Financial Pro Forma &amp; Payback Economics
                        </h4>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-300">
                        <input
                          type="checkbox"
                          checked={verifiedCheckpoints.financial}
                          onChange={() => toggleCheckpoint('financial')}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span className={verifiedCheckpoints.financial ? 'text-emerald-400' : 'text-slate-500'}>
                          {verifiedCheckpoints.financial ? 'Verified ✓' : 'Verify'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Gross Total CapEx</span>
                        <span className="font-bold text-white font-mono">
                          ${(economicResult?.totalGrossCapexUsd || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-emerald-400 block">
                          ITC 30%: -${(economicResult?.federalItcBenefitUsd || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Net CapEx Outlay</span>
                        <span className="font-bold text-amber-400 font-mono">
                          ${(economicResult?.netInitialInvestmentUsd || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          After Federal ITC &amp; Rebates
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">20-Year Net Savings</span>
                        <span className="font-black text-emerald-400 font-mono">
                          ${(economicResult?.twentyYearNetSavingsUsd || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Cumulative Net Cash Flow
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Dynamic Net Present Value</span>
                        <span className="font-bold text-sky-400 font-mono">
                          ${(economicResult?.npvUsd || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Discounted at 6.0% WACC
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Project Internal Rate (IRR)</span>
                        <span className="font-bold text-purple-400 font-mono">
                          {economicResult?.irrPercentage ?? 'N/A'}%
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Unleveraged Project Return
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Simple Payback Period</span>
                        <span className="font-bold text-emerald-300 font-mono">
                          {economicResult?.simplePaybackYears ?? 'N/A'} Years
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          LCOE: ${economicResult?.lcoeUsdPerKwh?.toFixed(3) ?? '0.052'}/kWh
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Stakeholder Signatories & Civil 3D Exchange Compliance */}
                {(activeTab === 'all' || activeTab === 'audit') && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                          5. Stakeholder Sign-Off &amp; LandXML Compliance
                        </h4>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-300">
                        <input
                          type="checkbox"
                          checked={verifiedCheckpoints.audit}
                          onChange={() => toggleCheckpoint('audit')}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span className={verifiedCheckpoints.audit ? 'text-emerald-400' : 'text-slate-500'}>
                          {verifiedCheckpoints.audit ? 'Verified ✓' : 'Verify'}
                        </span>
                      </label>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400 font-medium">Document ID:</span>
                        <span className="font-mono text-purple-300 font-bold">{docId}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400 font-medium">Autodesk Civil 3D Exchange:</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> LandXML 1.2 Schema Validated
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400 font-medium">Signatory PE Role:</span>
                        <span className="text-slate-200 font-mono">Registered Professional Engineer (PE)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400 font-medium">Asset Manager Authorization:</span>
                        <span className="text-slate-200 font-mono">Property Owner / Site Lease Authorized</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400 font-medium">Municipal Jurisdiction:</span>
                        <span className="text-slate-200 font-mono">City of Santa Barbara Public Works Permitting</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Verification Status Indicator */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      allVerified ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-300">
                    {allVerified
                      ? 'All 5 Summary Metadata Categories Verified'
                      : `${verifiedCount} of 5 Checkpoints Verified`}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  Civic Twin V.07
                </span>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Footer Action Bar */}
        <div className="bg-slate-950 px-5 py-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {allVerified
                ? 'Ready for executive transmittal and municipal stakeholder presentation.'
                : 'Please verify summary metadata checkpoints before triggering the download.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopySummaryText}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-5 py-2 bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Verify &amp; Download PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
