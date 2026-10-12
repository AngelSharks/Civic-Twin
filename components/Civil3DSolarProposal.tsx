import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { TwinMetadata, PropertyDetailLayer, SolarCanopyConfig } from '../types';
import {
  runSolarIrradianceSimulation,
  generateSimulationCsv,
  CLIMATE_SCENARIOS,
  PARKING_LOT_MICROCLIMATES,
  ClimateScenarioId,
  SolarSimulationSummary
} from '../services/solarSimulationService';
import {
  runEconomicSimulation,
  generateEconomicCsv,
  UTILITY_TARIFF_PRESETS,
  CARBON_CREDIT_PRESETS,
  EconomicSimulationResult,
  AnnualCashFlowOverride,
  LEDGER_SCENARIO_PRESETS
} from '../services/solarEconomicService';
import { Civil3DAecVisualSim } from './Civil3DAecVisualSim';
import {
  AutodeskCivil3DModel,
  BimGranularObject,
  BimElementCategory,
  PRELOADED_CIVIL3D_MODELS,
  importCivil3DFile,
  applyCivil3DModelToCanopy
} from '../services/autodeskAecDataModelService';
import { generateStakeholderProposalPdf, StakeholderPdfParams } from '../services/pdfExportService';
import { PdfExportPreviewModal } from './PdfExportPreviewModal';

interface Civil3DSolarProposalProps {
  metadata: TwinMetadata | null;
}

interface ParkingLotPreset {
  id: string;
  name: string;
  apn: string;
  address: string;
  lat: number;
  lng: number;
  lotSqFt: number;
  existingStalls: number;
  buildingType: string;
  annualBaselineKwh: number;
  peakKwDemand: number;
  recommendedCanopyStalls: number;
  optimalRotationDeg: number;
  driveAisleOrientation: string;
}

const SB_PARKING_LOTS: ParkingLotPreset[] = [
  {
    id: 'sbcc-west',
    name: 'SBCC West Campus Parking Lot (Cliff Drive)',
    apn: '045-120-019',
    address: '721 Cliff Drive, Santa Barbara, CA 93109',
    lat: 34.4061,
    lng: -119.7028,
    lotSqFt: 145000,
    existingStalls: 420,
    buildingType: 'Higher Education Campus',
    annualBaselineKwh: 1850000,
    peakKwDemand: 420,
    recommendedCanopyStalls: 260,
    optimalRotationDeg: 42,
    driveAisleOrientation: '42° parallel to Cliff Drive'
  },
  {
    id: 'sb-airport',
    name: 'Santa Barbara Airport Terminal Parking',
    apn: '073-090-008',
    address: '500 James Fowler Rd, Santa Barbara, CA 93117',
    lat: 34.4262,
    lng: -119.8404,
    lotSqFt: 280000,
    existingStalls: 850,
    buildingType: 'Aviation Transportation Hub',
    annualBaselineKwh: 3400000,
    peakKwDemand: 780,
    recommendedCanopyStalls: 480,
    optimalRotationDeg: 75,
    driveAisleOrientation: '75° parallel to James Fowler Rd & Taxiway'
  },
  {
    id: 'cabrillo-waterfront',
    name: 'Cabrillo Pavilion Waterfront Lot (East Beach)',
    apn: '017-310-002',
    address: '1118 E Cabrillo Blvd, Santa Barbara, CA 93103',
    lat: 34.4173,
    lng: -119.6698,
    lotSqFt: 68000,
    existingStalls: 190,
    buildingType: 'Municipal Coastal Event Center',
    annualBaselineKwh: 620000,
    peakKwDemand: 160,
    recommendedCanopyStalls: 95,
    optimalRotationDeg: 108,
    driveAisleOrientation: '108° parallel to East Beach & Cabrillo Blvd'
  },
  {
    id: 'paseo-nuevo-lot',
    name: 'Paseo Nuevo Structure & Lot #10 (Chapala)',
    apn: '037-142-011',
    address: '651 Paseo Nuevo, Santa Barbara, CA 93101',
    lat: 34.4195,
    lng: -119.6997,
    lotSqFt: 95000,
    existingStalls: 310,
    buildingType: 'Commercial Downtown Mixed-Use',
    annualBaselineKwh: 1120000,
    peakKwDemand: 290,
    recommendedCanopyStalls: 165,
    optimalRotationDeg: 148,
    driveAisleOrientation: '148° parallel to Chapala St grid'
  },
  {
    id: 'sb-courthouse',
    name: 'Santa Barbara County Administration Lot',
    apn: '027-210-004',
    address: '105 E Anapamu St, Santa Barbara, CA 93101',
    lat: 34.4243,
    lng: -119.7022,
    lotSqFt: 75000,
    existingStalls: 215,
    buildingType: 'Government Administration Complex',
    annualBaselineKwh: 890000,
    peakKwDemand: 230,
    recommendedCanopyStalls: 130,
    optimalRotationDeg: 58,
    driveAisleOrientation: '58° parallel to Anapamu St & Santa Barbara Grid'
  },
  {
    id: 'granada-anacapa',
    name: 'Granada Garage / Anacapa Municipal Lot',
    apn: '039-160-003',
    address: '1221 Anacapa St, Santa Barbara, CA 93101',
    lat: 34.4258,
    lng: -119.7045,
    lotSqFt: 52000,
    existingStalls: 160,
    buildingType: 'Arts & Cultural District Parking',
    annualBaselineKwh: 580000,
    peakKwDemand: 140,
    recommendedCanopyStalls: 85,
    optimalRotationDeg: 58,
    driveAisleOrientation: '58° parallel to Anacapa St'
  }
];

export const Civil3DSolarProposal: React.FC<Civil3DSolarProposalProps> = ({ metadata }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const canopyPolygonRef = useRef<any>(null);
  const canopyMarkerRef = useRef<any>(null);
  const lotPolygonRef = useRef<any>(null);
  const stanchionLayerRef = useRef<any>(null);

  // Selected Lot Preset
  const [selectedLot, setSelectedLot] = useState<ParkingLotPreset>(SB_PARKING_LOTS[0]);

  // Interactive Solar Canopy Configuration
  const [canopy, setCanopy] = useState<SolarCanopyConfig>({
    id: 'canopy-sbcc-01',
    name: 'SBCC West Lot Solar Canopy Array A',
    lat: SB_PARKING_LOTS[0].lat,
    lng: SB_PARKING_LOTS[0].lng,
    lengthFt: 220,
    widthFt: 110,
    stallsCovered: SB_PARKING_LOTS[0].recommendedCanopyStalls,
    tiltAngle: 12,
    azimuthDeg: 180, // Facing True South
    rotationDeg: SB_PARKING_LOTS[0].optimalRotationDeg,
    panelEfficiency: 0.218, // 21.8% Mono-PERC Bifacial
    moduleWattage: 550, // 550W per module
    structureType: 'dual-cantilever',
    evChargersCount: 16,
    bessCapacityKWh: 800 // 800 kWh Battery Storage
  });

  // Property Baseline Consumption & Demands
  const [annualBaselineKwh, setAnnualBaselineKwh] = useState<number>(SB_PARKING_LOTS[0].annualBaselineKwh);
  const [isAutoScaled, setIsAutoScaled] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'designer' | 'simulation' | 'economic' | 'bim-import' | 'property-twin' | 'civil3d-export'>('designer');
  const [committedProperties, setCommittedProperties] = useState<PropertyDetailLayer[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [mapMode, setMapMode] = useState<'satellite' | 'street'>('satellite');
  const [showAlignmentHelpModal, setShowAlignmentHelpModal] = useState<boolean>(false);

  // Historical Solar Irradiance Simulation States
  const [selectedScenarioId, setSelectedScenarioId] = useState<ClimateScenarioId>('tmy3');
  const [soilingProfile, setSoilingProfile] = useState<'clean' | 'standard' | 'coastal_heavy'>('standard');
  const [bifacialEnabled, setBifacialEnabled] = useState<boolean>(true);
  const [degradationYear, setDegradationYear] = useState<number>(1);
  const [selectedSimMonth, setSelectedSimMonth] = useState<number>(5); // June default (0-indexed)

  // Dynamic Economic Impact & ROI States (User-Variable Ledger Horizon & Overrides)
  const [ledgerHorizon, setLedgerHorizon] = useState<10 | 20>(10); // 10-Year default as requested
  const [cashFlowHorizonYears, setCashFlowHorizonYears] = useState<number>(10);
  const [annualOverrides, setAnnualOverrides] = useState<Record<number, AnnualCashFlowOverride>>({});
  const [isEditingLedger, setIsEditingLedger] = useState<boolean>(false);
  const [activeLedgerScenario, setActiveLedgerScenario] = useState<string>('baseline');
  const [isDownloadingV7Zip, setIsDownloadingV7Zip] = useState<boolean>(false);
  const [selectedTariffId, setSelectedTariffId] = useState<string>('cpa-tou-8-sec');
  const [selectedCarbonCreditId, setSelectedCarbonCreditId] = useState<string>('ca-compliance-cap-trade');
  const [utilityEscalationPct, setUtilityEscalationPct] = useState<number>(3.8);
  const [carbonPriceEscalationPct, setCarbonPriceEscalationPct] = useState<number>(2.5);
  const [itcRatePct, setItcRatePct] = useState<number>(30);
  const [isDirectPay, setIsDirectPay] = useState<boolean>(true);
  const [applyMacrs, setApplyMacrs] = useState<boolean>(false);
  const [sgipIncentivePerKwh, setSgipIncentivePerKwh] = useState<number>(250);
  const [discountRatePct, setDiscountRatePct] = useState<number>(6.0);

  // Autodesk Civil 3D & Granular BIM Data Model States
  const [activeCivil3DModel, setActiveCivil3DModel] = useState<AutodeskCivil3DModel>(PRELOADED_CIVIL3D_MODELS[0]);
  const [selectedBimElement, setSelectedBimElement] = useState<BimGranularObject | null>(PRELOADED_CIVIL3D_MODELS[0].elements[0] || null);
  const [bimCategoryFilter, setBimCategoryFilter] = useState<string>('all');
  const [importFileError, setImportFileError] = useState<string>('');
  const bimFileInputRef = useRef<HTMLInputElement>(null);

  // Memoized Historical Solar Irradiance Simulation Calculation Engine
  const simulationSummary: SolarSimulationSummary = useMemo(() => {
    return runSolarIrradianceSimulation({
      lotId: selectedLot.id,
      lotAreaSqFt: selectedLot.lotSqFt,
      canopyLengthFt: canopy.lengthFt,
      canopyWidthFt: canopy.widthFt,
      stallsCovered: canopy.stallsCovered,
      tiltAngleDeg: canopy.tiltAngle,
      azimuthDeg: canopy.azimuthDeg,
      panelEfficiency: canopy.panelEfficiency,
      bifacialEnabled,
      bessCapacityKwh: canopy.bessCapacityKWh,
      annualBaselineKwh,
      peakKwDemand: selectedLot.peakKwDemand,
      scenarioId: selectedScenarioId,
      soilingProfile,
      degradationYears: degradationYear
    });
  }, [selectedLot, canopy, annualBaselineKwh, selectedScenarioId, soilingProfile, bifacialEnabled, degradationYear]);

  const microclimate = PARKING_LOT_MICROCLIMATES[selectedLot.id] || PARKING_LOT_MICROCLIMATES['sbcc-west'];

  // Download Simulation CSV Data Sheet
  const handleDownloadSimulationCsv = () => {
    const csvContent = generateSimulationCsv(simulationSummary, selectedLot.name, selectedLot.apn);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Solar_Simulation_${selectedLot.apn}_${selectedScenarioId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Sync simulated canopy dimensions back to the 3D Designer canopy
  const handleApplySimulationToCanopy = (newLengthFt: number, newWidthFt: number, newBessKwh: number) => {
    const newArea = newLengthFt * newWidthFt;
    const newStalls = Math.min(selectedLot.existingStalls, Math.round(newArea / 340));
    setCanopy(prev => ({
      ...prev,
      lengthFt: newLengthFt,
      widthFt: newWidthFt,
      stallsCovered: newStalls,
      bessCapacityKWh: newBessKwh
    }));
    setSaveSuccessMsg(`⚡ Successfully applied simulation parameters to 3D Designer canopy!`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Load saved property twins from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('civic_twin_property_twins');
      if (saved) {
        setCommittedProperties(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load committed property twins:', e);
    }
  }, []);

  // Recalculate dimensions & parameters when lot preset changes
  const handleSelectLot = (lot: ParkingLotPreset) => {
    setSelectedLot(lot);
    setAnnualBaselineKwh(lot.annualBaselineKwh);
    setCanopy(prev => ({
      ...prev,
      name: `${lot.name} Solar Canopy Array`,
      lat: lot.lat,
      lng: lot.lng,
      stallsCovered: lot.recommendedCanopyStalls,
      lengthFt: Math.round(Math.sqrt(lot.recommendedCanopyStalls * 180 * 2)),
      widthFt: 100,
      rotationDeg: lot.optimalRotationDeg,
      bessCapacityKWh: Math.round(lot.peakKwDemand * 3.5)
    }));
    setIsAutoScaled(false);

    if (mapRef.current) {
      mapRef.current.flyTo([lot.lat, lot.lng], 17, { duration: 1.2 });
    }
  };

  // Solar Physics & Energy Balance Calculations for Santa Barbara, CA
  // Santa Barbara avg solar insolation = 5.42 Peak Sun Hours (PSH) / day
  const SANTA_BARBARA_PSH = 5.42;
  const canopyAreaSqFt = canopy.lengthFt * canopy.widthFt;
  const canopyAreaSqM = canopyAreaSqFt * 0.092903;
  // Standard solar panel packing density on commercial carport canopy is ~88% active aperture
  const pvApertureAreaSqM = canopyAreaSqM * 0.88;
  const nameplateKwDc = Math.round(pvApertureAreaSqM * 1.0 * canopy.panelEfficiency);
  // System derate factor accounting for tilt, azimuth, inverter, cabling, soiling = ~0.84
  const tiltFactor = Math.cos((canopy.tiltAngle - 34.4) * (Math.PI / 180)); // 34.4° is Santa Barbara latitude
  const azimuthFactor = Math.cos((canopy.azimuthDeg - 180) * 0.5 * (Math.PI / 180));
  const effectiveDerate = 0.84 * Math.max(0.85, tiltFactor) * Math.max(0.85, azimuthFactor);

  const projectedDailyKwh = nameplateKwDc * SANTA_BARBARA_PSH * effectiveDerate;
  const projectedAnnualKwh = Math.round(projectedDailyKwh * 365);
  const selfSufficiencyPct = annualBaselineKwh > 0 
    ? Math.round((projectedAnnualKwh / annualBaselineKwh) * 100) 
    : 100;

  // Environmental Metrics
  // California grid emissions factor: ~0.485 lbs CO2 / kWh = 0.00022 metric tons CO2 / kWh
  const co2OffsetTons = Math.round(projectedAnnualKwh * 0.00022);
  const equivalentTrees = Math.round(co2OffsetTons * 16.5);
  const barrelsOilSaved = Math.round(projectedAnnualKwh / 580);

  // Autodesk Civil 3D Engineering Metrics
  // Santa Barbara avg annual rainfall = 18.2 inches / year = 1.516 ft
  const annualRainfallFt = 1.516;
  const stormwaterCapturedGalYr = Math.round(canopyAreaSqFt * annualRainfallFt * 7.48); // 7.48 gal per cu ft
  const structuralSteelTons = Math.round((canopyAreaSqFt * 5.2) / 2000); // ~5.2 lbs steel / sqft carport canopy
  const concretePiersCount = Math.max(4, Math.round(canopy.lengthFt / 25) * 2);

  // Microgrid Resilience
  const microgridIslandingHours = canopy.bessCapacityKWh > 0 
    ? Math.min(168, Math.round((canopy.bessCapacityKWh / (selectedLot.peakKwDemand * 0.45)) + (projectedDailyKwh / (selectedLot.peakKwDemand * 0.45) * 4)))
    : 0;

  // Variable Annual Economic Impact & ROI Calculation Engine (10-Year or 20-Year)
  const economicResult: EconomicSimulationResult = useMemo(() => {
    return runEconomicSimulation({
      dcRatingKw: nameplateKwDc,
      annualSolarYieldKwhYear1: simulationSummary.annualSolarYieldKwh,
      bessCapacityKwh: canopy.bessCapacityKWh,
      peakKwDemand: selectedLot.peakKwDemand,
      evChargersCount: canopy.evChargersCount,
      stallsCovered: canopy.stallsCovered,
      tariffPresetId: selectedTariffId,
      utilityEscalationRatePct: utilityEscalationPct,
      carbonCreditPresetId: selectedCarbonCreditId,
      carbonPriceEscalationPct,
      itcPercentagePct: itcRatePct,
      isPublicEntityDirectPay: isDirectPay,
      applyMacrsDepreciation: applyMacrs,
      sgipIncentivePerKwh,
      discountRatePct,
      solarTurnkeyCostPerWatt: 3.25,
      bessInstalledCostPerKwh: 550,
      evChargerCostPerPort: 3800,
      annualOmCostPerKwYear1: 18,
      pvDegradationRatePct: 0.5,
      projectionHorizonYears: ledgerHorizon,
      annualOverrides
    });
  }, [
    nameplateKwDc,
    simulationSummary.annualSolarYieldKwh,
    canopy.bessCapacityKWh,
    selectedLot.peakKwDemand,
    canopy.evChargersCount,
    canopy.stallsCovered,
    selectedTariffId,
    utilityEscalationPct,
    selectedCarbonCreditId,
    carbonPriceEscalationPct,
    itcRatePct,
    isDirectPay,
    applyMacrs,
    sgipIncentivePerKwh,
    discountRatePct,
    ledgerHorizon,
    annualOverrides
  ]);

  // Handler for user overriding specific annual values in the 10-Year Ledger
  const handleUpdateYearOverride = (year: number, field: keyof AnnualCashFlowOverride, val: number) => {
    setAnnualOverrides(prev => {
      const existing = prev[year] || { year, isOverridden: true };
      return {
        ...prev,
        [year]: {
          ...existing,
          [field]: val,
          isOverridden: true,
          notes: `User modified ${String(field)} at ${new Date().toLocaleTimeString()}`
        }
      };
    });
  };

  // Reset a single year's override back to calculated model
  const handleResetYearOverride = (year: number) => {
    setAnnualOverrides(prev => {
      const next = { ...prev };
      delete next[year];
      return next;
    });
  };

  // Reset all annual overrides
  const handleResetAllOverrides = () => {
    setAnnualOverrides({});
    setActiveLedgerScenario('baseline');
    setSaveSuccessMsg('🔄 Cash flow ledger reset to baseline calculated values.');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Apply a sensitivity scenario preset to the 10-Year Ledger
  const handleApplyLedgerScenario = (scenarioId: string) => {
    setActiveLedgerScenario(scenarioId);
    const preset = LEDGER_SCENARIO_PRESETS.find(p => p.id === scenarioId);
    if (!preset) return;

    setUtilityEscalationPct(preset.utilityEscalationPct);
    setCarbonPriceEscalationPct(preset.carbonPriceEscalationPct);

    // If scenario has custom adjustments, create systematic annual overrides
    if (scenarioId === 'severe-drought-demand') {
      const overrides: Record<number, AnnualCashFlowOverride> = {};
      for (let y = 1; y <= ledgerHorizon; y++) {
        const baseDemand = (economicResult.cashFlowSchedule.find(r => r.year === y)?.demandChargeSavingsUsd || 15000);
        overrides[y] = {
          year: y,
          demandChargeSavingsUsd: Math.round(baseDemand * 1.35),
          isOverridden: true,
          notes: 'High Summer Demand Peak Shaving Scenario (+35%)'
        };
      }
      setAnnualOverrides(overrides);
    } else if (scenarioId === 'conservative-om') {
      const overrides: Record<number, AnnualCashFlowOverride> = {};
      for (let y = 1; y <= ledgerHorizon; y++) {
        const baseOm = (economicResult.cashFlowSchedule.find(r => r.year === y)?.omExpensesUsd || 8000);
        const refreshExtra = (y === 5 || y === 10) ? Math.round(nameplateKwDc * 35) : 0;
        overrides[y] = {
          year: y,
          omExpensesUsd: Math.round(baseOm * 1.25) + refreshExtra,
          isOverridden: true,
          notes: 'Conservative O&M with Yr 5 & Yr 10 Inverter Refresh'
        };
      }
      setAnnualOverrides(overrides);
    } else {
      setAnnualOverrides({});
    }

    setSaveSuccessMsg(`📊 Applied Sensitivity Scenario: ${preset.name}`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Download Civic Twin v0.7 Release Package (Civic_Twin_Angel_Sharks_ap.V.07.zip)
  const handleDownloadV7Zip = async () => {
    setIsDownloadingV7Zip(true);
    try {
      const res = await fetch('/Civic_Twin_Angel_Sharks_ap.V.07.zip');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Civic_Twin_Angel_Sharks_ap.V.07.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        window.location.href = '/api/download/civic-twin-v0.7.zip';
      }
      setSaveSuccessMsg('📦 Downloading Civic Twin V.07 Release (Civic_Twin_Angel_Sharks_ap.V.07.zip)...');
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } catch (err) {
      console.warn('Direct zip fetch fallback:', err);
      window.location.href = '/v0.7.zip';
    } finally {
      setIsDownloadingV7Zip(false);
    }
  };

  // Download Variable Economic Cash Flow CSV
  const handleDownloadEconomicCsv = () => {
    const csvContent = generateEconomicCsv(economicResult, selectedLot.name, selectedLot.apn);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Solar_Economic_ROI_${selectedLot.apn}_${ledgerHorizon}Year_CashFlow.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Auto-Scale Canopy to 100% Self-Sufficiency
  const handleAutoScale100Percent = () => {
    if (annualBaselineKwh <= 0) return;
    // Calculate required nameplate kW DC to generate 100% of annualBaselineKwh
    const requiredAnnualKwh = annualBaselineKwh;
    const requiredDailyKwh = requiredAnnualKwh / 365;
    const requiredKwDc = requiredDailyKwh / (SANTA_BARBARA_PSH * effectiveDerate);
    const requiredApertureSqM = requiredKwDc / canopy.panelEfficiency;
    const requiredCanopySqFt = (requiredApertureSqM / 0.88) / 0.092903;

    // Calculate length assuming typical 100ft dual-row carport width
    const standardWidth = 100;
    const calculatedLength = Math.min(700, Math.max(120, Math.round(requiredCanopySqFt / standardWidth)));
    const calculatedStalls = Math.min(selectedLot.existingStalls, Math.round(calculatedLength / 18 * 4));
    const requiredBess = Math.round(selectedLot.peakKwDemand * 4.5);

    setCanopy(prev => ({
      ...prev,
      widthFt: standardWidth,
      lengthFt: calculatedLength,
      stallsCovered: calculatedStalls,
      bessCapacityKWh: requiredBess
    }));
    setIsAutoScaled(true);
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([canopy.lat, canopy.lng], 17);

      // Base Layer
      const tileUrl = mapMode === 'satellite'
        ? 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      
      const tileOptions: any = mapMode === 'satellite' 
        ? { subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], maxZoom: 20 }
        : { maxZoom: 19 };

      L.tileLayer(tileUrl, tileOptions).addTo(mapRef.current);

      stanchionLayerRef.current = L.layerGroup().addTo(mapRef.current);

      // Click to reposition canopy on parking lot
      mapRef.current.on('click', (e: any) => {
        setCanopy(prev => ({
          ...prev,
          lat: e.latlng.lat,
          lng: e.latlng.lng
        }));
      });
    } else {
      mapRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) {
          mapRef.current.removeLayer(layer);
        }
      });
      const tileUrl = mapMode === 'satellite'
        ? 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const tileOptions: any = mapMode === 'satellite'
        ? { subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], maxZoom: 20 }
        : { maxZoom: 19 };
      L.tileLayer(tileUrl, tileOptions).addTo(mapRef.current);
    }
  }, [mapMode]);

  // Update Canopy Geometry and Visual Overlays on Map
  useEffect(() => {
    if (!mapRef.current) return;

    // Calculate 4 rotated corner coordinates in feet, then project to lat/lng
    const rotDeg = canopy.rotationDeg || 0;
    const rotRad = (rotDeg * Math.PI) / 180;
    const cosR = Math.cos(rotRad);
    const sinR = Math.sin(rotRad);

    const halfL = canopy.lengthFt / 2;
    const halfW = canopy.widthFt / 2;

    // 4 local corners in feet relative to center:
    // [x (East/West in local space), y (North/South in local space)]
    const localCorners = [
      { x: -halfL, y: halfW },   // Top-Left (NW)
      { x: halfL, y: halfW },    // Top-Right (NE)
      { x: halfL, y: -halfW },   // Bottom-Right (SE)
      { x: -halfL, y: -halfW }   // Bottom-Left (SW)
    ];

    const cornerLatLngs: [number, number][] = localCorners.map(c => {
      // 2D Rotation transformation
      const rotX = c.x * cosR - c.y * sinR;
      const rotY = c.x * sinR + c.y * cosR;

      const lat = canopy.lat + rotY * 0.00000274;
      const lng = canopy.lng + rotX * 0.00000334;
      return [lat, lng];
    });

    // Remove previous polygon
    if (canopyPolygonRef.current) {
      mapRef.current.removeLayer(canopyPolygonRef.current);
    }
    if (canopyMarkerRef.current) {
      mapRef.current.removeLayer(canopyMarkerRef.current);
    }
    if (stanchionLayerRef.current) {
      stanchionLayerRef.current.clearLayers();
    }

    // Solar Canopy Photovoltaic Footprint (Rotated Polygon aligned with Parking Aisle)
    canopyPolygonRef.current = L.polygon(cornerLatLngs, {
      color: '#38bdf8',
      weight: 3,
      fillColor: '#0284c7',
      fillOpacity: 0.65,
      dashArray: '4, 2'
    }).addTo(mapRef.current);

    canopyPolygonRef.current.bindPopup(`
      <div style="font-family:sans-serif; min-width:230px; color:#0f172a;">
        <div style="font-weight:900; font-size:13px; color:#0284c7; margin-bottom:4px;">
          ☀️ ${canopy.name}
        </div>
        <div style="font-size:11px; margin-bottom:6px; color:#475569;">
          <strong>Civil 3D Carport Footprint:</strong> ${canopy.lengthFt}' × ${canopy.widthFt}' (${canopyAreaSqFt.toLocaleString()} sq ft)
        </div>
        <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; padding:6px; font-size:11px; margin-bottom:6px;">
          <div>📐 <strong>Aisle Alignment:</strong> <span style="color:#0284c7; font-weight:bold;">${rotDeg}°</span></div>
          <div>⚡ <strong>DC Rating:</strong> ${nameplateKwDc} kWp (${canopy.stallsCovered} Stalls)</div>
          <div>🔋 <strong>Self-Sufficiency:</strong> <span style="color:#059669; font-weight:bold;">${selfSufficiencyPct}% Net-Zero</span></div>
          <div>🔌 <strong>EV Chargers:</strong> ${canopy.evChargersCount} Dual-Ports</div>
        </div>
        <div style="font-size:10px; color:#64748b;">
          Lat: ${canopy.lat.toFixed(5)}, Lng: ${canopy.lng.toFixed(5)}
        </div>
      </div>
    `);

    // Center Draggable Handle
    canopyMarkerRef.current = L.marker([canopy.lat, canopy.lng], {
      draggable: true,
      icon: L.divIcon({
        className: 'custom-canopy-drag-pin',
        html: `<div style="background:#0284c7; color:#fff; border:2px solid #fff; border-radius:9999px; width:34px; height:34px; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 15px -3px rgba(0,0,0,0.5); cursor:grab; font-weight:bold; font-size:16px;">☀️</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      })
    }).addTo(mapRef.current);

    canopyMarkerRef.current.on('dragend', (e: any) => {
      const newPos = e.target.getLatLng();
      setCanopy(prev => ({
        ...prev,
        lat: newPos.lat,
        lng: newPos.lng
      }));
    });

    // Add Concrete Stanchion Pier Markers (Rotated Northing/Easting Footings for Civil 3D)
    const pierRows = 2;
    const pierCols = Math.max(2, Math.round(canopy.lengthFt / 40));
    for (let r = 0; r < pierRows; r++) {
      for (let c = 0; c < pierCols; c++) {
        const localX = -halfL + (c / (pierCols - 1 || 1)) * (canopy.lengthFt);
        const localY = -halfW + (r / (pierRows - 1 || 1)) * (canopy.widthFt);

        const rotX = localX * cosR - localY * sinR;
        const rotY = localX * sinR + localY * cosR;

        const pLat = canopy.lat + rotY * 0.00000274;
        const pLng = canopy.lng + rotX * 0.00000334;

        L.circleMarker([pLat, pLng], {
          radius: 4,
          color: '#ffffff',
          fillColor: '#f59e0b',
          fillOpacity: 1,
          weight: 2
        }).addTo(stanchionLayerRef.current).bindTooltip(`Pier #${r * pierCols + c + 1} (${rotDeg}° Rotated Footing)`);
      }
    }

  }, [canopy, mapMode]);

  // Commit Simulation to Property Detail Layer (New Digital Twin)
  const handleCommitToPropertyTwin = () => {
    const newPropertyTwin: PropertyDetailLayer = {
      id: `twin-${selectedLot.apn.replace(/-/g, '')}`,
      propertyName: selectedLot.name,
      apn: selectedLot.apn,
      lotSqFt: selectedLot.lotSqFt,
      buildingType: selectedLot.buildingType,
      annualBaselineKwh: annualBaselineKwh,
      peakKwDemand: selectedLot.peakKwDemand,
      canopies: [canopy],
      projectedAnnualKwh: simulationSummary.annualSolarYieldKwh,
      selfSufficiencyPct: simulationSummary.annualSelfSufficiencyPct,
      bessKWh: canopy.bessCapacityKWh,
      microgridIslandingHours: simulationSummary.microgridIslandingHours,
      co2OffsetTons: simulationSummary.annualCo2OffsetMetricTons,
      stormwaterCapturedGalYr: stormwaterCapturedGalYr,
      structuralSteelTons: structuralSteelTons,
      civil3DExported: false,
      status: 'committed',
      createdAt: new Date().toISOString()
    };

    const updated = [
      newPropertyTwin,
      ...committedProperties.filter(p => p.apn !== selectedLot.apn)
    ];
    setCommittedProperties(updated);
    try {
      localStorage.setItem('civic_twin_property_twins', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to local storage', e);
    }

    setSaveSuccessMsg(`✅ Successfully committed to Digital Twin Property Detail Layer for ${selectedLot.name} (APN: ${selectedLot.apn})!`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Export Executive Stakeholder Proposal Summary PDF & Real-Time Preview
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState<boolean>(false);

  const stakeholderPdfParams: StakeholderPdfParams = useMemo(() => ({
    lotName: selectedLot.name,
    apn: selectedLot.apn,
    address: selectedLot.address,
    buildingType: selectedLot.buildingType,
    lotSqFt: selectedLot.lotSqFt,
    existingStalls: selectedLot.existingStalls,
    canopy,
    annualBaselineKwh,
    peakKwDemand: selectedLot.peakKwDemand,
    scenarioName: CLIMATE_SCENARIOS.find(s => s.id === selectedScenarioId)?.name || 'NREL TMY3 Multi-Decadal Baseline',
    simulationSummary,
    economicResult,
    microclimate,
    structuralSteelTons,
    concretePiersCount,
    stormwaterCapturedGalYr,
    metadata
  }), [
    selectedLot,
    canopy,
    annualBaselineKwh,
    selectedScenarioId,
    simulationSummary,
    economicResult,
    microclimate,
    structuralSteelTons,
    concretePiersCount,
    stormwaterCapturedGalYr,
    metadata
  ]);

  const handleOpenPdfPreview = () => {
    setShowPdfPreviewModal(true);
  };

  const handleExportStakeholderPdf = () => {
    setIsExportingPdf(true);
    try {
      generateStakeholderProposalPdf(stakeholderPdfParams);
      setSaveSuccessMsg(`📄 Successfully generated Stakeholder Summary PDF for ${selectedLot.name} (APN: ${selectedLot.apn})!`);
      setTimeout(() => setSaveSuccessMsg(''), 4500);
    } catch (err) {
      console.error('Failed to generate stakeholder PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Generate and Download Official Autodesk Civil 3D LandXML 1.2 Package
  const handleDownloadLandXml = () => {
    const northingBase = 1978000 + (canopy.lat - 34.4) * 364000;
    const eastingBase = 6045000 + (canopy.lng + 119.7) * 300000;

    const rotDeg = canopy.rotationDeg || 0;
    const rotRad = (rotDeg * Math.PI) / 180;
    const cosR = Math.cos(rotRad);
    const sinR = Math.sin(rotRad);
    const halfL = canopy.lengthFt / 2;
    const halfW = canopy.widthFt / 2;

    const rotNW = { n: northingBase + (-halfL * sinR + halfW * cosR), e: eastingBase + (-halfL * cosR - halfW * sinR) };
    const rotNE = { n: northingBase + (halfL * sinR + halfW * cosR), e: eastingBase + (halfL * cosR - halfW * sinR) };
    const rotSE = { n: northingBase + (halfL * sinR - halfW * cosR), e: eastingBase + (halfL * cosR + halfW * sinR) };
    const rotSW = { n: northingBase + (-halfL * sinR - halfW * cosR), e: eastingBase + (-halfL * cosR + halfW * sinR) };

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
         xsi:schemaLocation="http://www.landxml.org/schema/LandXML-1.2 http://www.landxml.org/schema/LandXML-1.2/LandXML-1.2.xsd" 
         date="${new Date().toISOString().split('T')[0]}" 
         time="${new Date().toTimeString().split(' ')[0]}" 
         version="1.2" 
         language="English">
  <Units>
    <Imperial areaUnit="squareFoot" linearUnit="foot" temperatureUnit="fahrenheit" volumeUnit="cubicYard"/>
  </Units>
  <Project name="Solar-Canopy-${selectedLot.apn}" desc="Autodesk Civil 3D Solar Canopy Proposal for ${selectedLot.name} - 100% Self-Sufficiency Digital Twin"/>
  <Application name="Angel Sharks Civic Twin Civil 3D Proposal Studio" version="0.6.0" manufacturer="Angel Sharks" manufacturerURL="https://angelsharks.net"/>
  <CoordinateSystem desc="NAD83 California State Plane Zone V (US Survey Feet)" epsgCode="2229"/>
  <CgPoints>
    <!-- Solar Canopy Structural Column Footings & Invert Drainage Coordinates (Rotated ${rotDeg}° to Parking Aisle) -->
    <CgPoint name="CP-01" pntSurv="control" desc="CANOPY-CORNER-NW">${rotNW.n.toFixed(3)} ${rotNW.e.toFixed(3)} 38.500</CgPoint>
    <CgPoint name="CP-02" pntSurv="control" desc="CANOPY-CORNER-NE">${rotNE.n.toFixed(3)} ${rotNE.e.toFixed(3)} 39.200</CgPoint>
    <CgPoint name="CP-03" pntSurv="control" desc="CANOPY-CORNER-SE">${rotSE.n.toFixed(3)} ${rotSE.e.toFixed(3)} 37.800</CgPoint>
    <CgPoint name="CP-04" pntSurv="control" desc="CANOPY-CORNER-SW">${rotSW.n.toFixed(3)} ${rotSW.e.toFixed(3)} 37.100</CgPoint>
    <CgPoint name="BESS-01" pntSurv="utility" desc="TESLA-MEGAPACK-BESS-PAD">${(northingBase - canopy.lengthFt/2 - 25).toFixed(3)} ${(eastingBase).toFixed(3)} 37.000</CgPoint>
    <CgPoint name="EV-HUB-01" pntSurv="utility" desc="DC-FAST-CHARGING-TRANSFORMER">${(northingBase).toFixed(3)} ${(eastingBase - canopy.widthFt/2 - 15).toFixed(3)} 38.000</CgPoint>
  </CgPoints>
  <Surfaces>
    <Surface name="PROPOSED-SOLAR-CANOPY-ROOF-GRADE">
      <Definition surfType="TIN">
        <Pnts>
          <P id="1">${rotNW.n.toFixed(3)} ${rotNW.e.toFixed(3)} 53.500</P>
          <P id="2">${rotNE.n.toFixed(3)} ${rotNE.e.toFixed(3)} 54.200</P>
          <P id="3">${rotSE.n.toFixed(3)} ${rotSE.e.toFixed(3)} 51.800</P>
          <P id="4">${rotSW.n.toFixed(3)} ${rotSW.e.toFixed(3)} 51.100</P>
        </Pnts>
        <Faces>
          <F>1 2 3</F>
          <F>1 3 4</F>
        </Faces>
      </Definition>
    </Surface>
  </Surfaces>
  <Parcels>
    <Parcel name="${selectedLot.apn}" area="${selectedLot.lotSqFt}" desc="${selectedLot.name}">
      <CoordGeom>
        <Line>
          <Start>${(northingBase + 150).toFixed(3)} ${(eastingBase - 200).toFixed(3)}</Start>
          <End>${(northingBase + 150).toFixed(3)} ${(eastingBase + 200).toFixed(3)}</End>
        </Line>
      </CoordGeom>
    </Parcel>
  </Parcels>
</LandXML>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Civil3D_Solar_Proposal_${selectedLot.apn}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate and Download Engineering Proposal Summary Report
  const handleDownloadProposalReport = () => {
    const reportText = `================================================================================
AUTODESK CIVIL 3D & SOLAR CANOPY PROPOSAL REPORT
PROJECT: ${selectedLot.name}
ASSESSOR PARCEL NUMBER (APN): ${selectedLot.apn}
MUNICIPALITY: City of Santa Barbara, CA (https://santabarbaraca.gov/)
DATE: ${new Date().toLocaleDateString()}
ENGINEERING ARCHITECTURE: Angel Sharks Civic Twin v0.7.0
================================================================================

1. EXECUTIVE SUMMARY & 100% SELF-SUFFICIENCY VERIFICATION
--------------------------------------------------------------------------------
- Property Facility Type: ${selectedLot.buildingType}
- Property Address: ${selectedLot.address}
- Annual Baseline Electrical Consumption: ${annualBaselineKwh.toLocaleString()} kWh/year
- Proposed Solar Canopy Carport Array: ${canopy.lengthFt}' L x ${canopy.widthFt}' W (${canopyAreaSqFt.toLocaleString()} sq ft)
- Number of Parking Stalls Covered: ${canopy.stallsCovered} Stalls (out of ${selectedLot.existingStalls} stalls)
- Nameplate DC Generation Capacity: ${nameplateKwDc} kWp
- Projected Annual Solar Generation: ${projectedAnnualKwh.toLocaleString()} kWh/year
- NET ENERGY BALANCE: ${selfSufficiencyPct}% Net-Zero Self-Sufficiency
- Status: ${selfSufficiencyPct >= 100 ? '100% ENERGY SELF-SUFFICIENT & NET ZERO VERIFIED' : 'PARTIAL SELF-SUFFICIENCY (Scale canopy to 100%)'}

2. AUTODESK CIVIL 3D SPECIFICATIONS
--------------------------------------------------------------------------------
- Coordinate System: NAD83 California State Plane Zone V (US Survey Feet, EPSG: 2229)
- Centroid Coordinate: Lat ${canopy.lat.toFixed(6)}, Lng ${canopy.lng.toFixed(6)}
- Foundation Type: Cast-In-Place Concrete Drilled Shaft Piers (Qty: ${concretePiersCount})
- Structural Steel Tonnage: ${structuralSteelTons} Tons of A992 Structural Steel
- Stormwater Runoff Capture: ${stormwaterCapturedGalYr.toLocaleString()} Gallons/Year harvested via canopy gutters
- Invert Elevation / Drainage: Sloped to bioretention swale / underground infiltration cistern

3. ELECTRICAL MICROGRID & ENERGY STORAGE (BESS)
--------------------------------------------------------------------------------
- Photovoltaic Module: 550W Mono-PERC Bifacial Glass-on-Glass (21.8% STC Efficiency)
- Tilt Angle: ${canopy.tiltAngle}° (Optimized for Santa Barbara 34.4° N latitude)
- Azimuth: ${canopy.azimuthDeg}° (True South)
- Battery Energy Storage System (BESS): ${canopy.bessCapacityKWh.toLocaleString()} kWh Lithium-Iron-Phosphate (LFP)
- Islanding Outage Survival: ${microgridIslandingHours} continuous hours with daytime solar recharge
- Dual-Port EV Charging Stations: ${canopy.evChargersCount} Stations integrated into carport stanchions

4. ENVIRONMENTAL IMPACT & CARBON OFFSET
--------------------------------------------------------------------------------
- Metric Tons CO2 Eliminated Annually: ${simulationSummary.annualCo2OffsetMetricTons} MT CO2e
- Equivalent Gasoline Gallons Avoided: ${simulationSummary.equivalentBarrelsOfOil.toLocaleString()} barrels of oil
- Equivalent Mature Trees Planted: ${simulationSummary.equivalentTreesPlanted.toLocaleString()} trees

5. HISTORICAL SOLAR IRRADIANCE & YIELD SIMULATION METRICS
--------------------------------------------------------------------------------
- Historical Climate Dataset: ${CLIMATE_SCENARIOS.find(s => s.id === selectedScenarioId)?.name || 'NREL TMY3 Multi-Decadal Baseline'}
- Microclimate Calibration: ${microclimate.lotName} (Elevation: ${microclimate.elevationFt} ft, Morning Marine Fog Burnoff: ${microclimate.fogBurnoffTime})
- Annual Historical Solar Generation: ${simulationSummary.annualSolarYieldMwh} MWh/year (${simulationSummary.annualSolarYieldKwh.toLocaleString()} kWh/yr)
- Specific Yield Benchmark: ${simulationSummary.specificYieldKwhPerKwp} kWh/kWp/year (System Performance Ratio: ${simulationSummary.systemPerformanceRatio}%)
- Avoided Clean Power Alliance / SCE Commercial Grid Costs: $${simulationSummary.annualAvoidedUtilityCostUsd.toLocaleString()} / year
- 25-Year Cumulative Lifecycle Clean Generation: ${simulationSummary.twentyFiveYearGenerationGwh} GWh ($${simulationSummary.twentyFiveYearSavingsUsd.toLocaleString()} lifetime utility savings)
- Levelized Cost of Energy (LCOE): $${simulationSummary.lcoeUsdPerKwh} / kWh

6. 20-YEAR ECONOMIC IMPACT, ROI & CARBON REVENUE
--------------------------------------------------------------------------------
- Total Gross Project CapEx: $${economicResult.totalGrossCapexUsd.toLocaleString()}
- Subsidies & Tax Credits (IRA ITC + SGIP): -$${economicResult.totalIncentivesUsd.toLocaleString()}
- Net Initial Capital Investment: $${economicResult.netInitialInvestmentUsd.toLocaleString()}
- 20-Year Net Cost Savings: $${economicResult.twentyYearNetSavingsUsd.toLocaleString()} (Gross Savings: $${economicResult.twentyYearGrossSavingsUsd.toLocaleString()})
- Simple Payback Period: ${economicResult.simplePaybackYears} Years (Discounted: ${economicResult.discountedPaybackYears} Years)
- Project Internal Rate of Return (IRR): ${economicResult.irrPercentage}% (vs 4.5% Municipal Hurdle)
- Net Present Value (NPV at ${discountRatePct}%): $${economicResult.npvUsd.toLocaleString()}
- 20-Year Carbon Offset Credit Revenue: $${economicResult.twentyYearCarbonCreditRevenueUsd.toLocaleString()} (${economicResult.twentyYearCo2OffsetMetricTons.toLocaleString()} MT CO2e)
- Levelized Cost of Energy (LCOE): $${economicResult.lcoeUsdPerKwh} / kWh vs $${economicResult.blendedUtilityBenchmarkRateUsd.toFixed(3)} / kWh Grid Benchmark

7. WORDPRESS SHORTCODE EMBED CODE
--------------------------------------------------------------------------------
Add this interactive simulation into any Santa Barbara WordPress page or proposal:
[civic_twin_solar_canopy apn="${selectedLot.apn}" stalls="${canopy.stallsCovered}"]
[civic_twin_civil3d_proposal]
`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Solar_Canopy_Civil3D_Proposal_${selectedLot.apn}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Top Header Ribbon */}
      <header className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-amber-500/20">
            ☀️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">Autodesk Civil 3D Solar Canopy Proposal Studio</h2>
              <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-300 border border-emerald-500 rounded text-[10px] font-black uppercase tracking-widest">
                Edition V.07
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Autodesk AEC Data Model BIM Simulation • Variable 10-Year Annual Cash Flow Ledger • 100% Net-Zero Energy Verification
            </p>
          </div>
        </div>

        {/* View Switcher Tabs & Release Download */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-black">
            <button
              onClick={() => setActiveTab('designer')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'designer' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <span>🎯</span> Planner
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'simulation' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <span>⚡</span> Yield Sim
            </button>
            <button
              onClick={() => setActiveTab('economic')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'economic' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <span>📈</span> 10-Yr Cash Flow
            </button>
            <button
              onClick={() => setActiveTab('bim-import')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'bim-import' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <span>🏗️</span> Civil 3D &amp; BIM Sim
            </button>
            <button
              onClick={() => setActiveTab('property-twin')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'property-twin' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <span>🏛️</span> Twin ({committedProperties.length})
            </button>
            <button
              onClick={() => setActiveTab('civil3d-export')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'civil3d-export' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <span>📐</span> LandXML
            </button>
          </div>

          {/* Direct Release V0.7 ZIP Package Download */}
          <button
            type="button"
            onClick={handleDownloadV7Zip}
            disabled={isDownloadingV7Zip}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            title="Download complete civic-twin-v0.7.zip release package"
          >
            <span>📦</span> {isDownloadingV7Zip ? 'Downloading...' : 'Download V.07 (.zip)'}
          </button>
        </div>
      </header>

      {saveSuccessMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-black uppercase tracking-widest text-center shadow-lg transition-all animate-pulse">
          {saveSuccessMsg}
        </div>
      )}

      {/* Main Studio Viewport */}
      {activeTab === 'designer' && (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          
          {/* Left Side Controls & Self-Sufficiency Simulator */}
          <aside className="w-full lg:w-[480px] border-r border-slate-800 bg-slate-900/60 flex flex-col overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
            
            {/* Santa Barbara Parking Lot Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                <span>📍 Select Existing Parking Lot Parcel</span>
                <span className="text-sky-400 font-mono text-[10px]">Santa Barbara, CA</span>
              </label>
              <select
                value={selectedLot.id}
                onChange={(e) => {
                  const found = SB_PARKING_LOTS.find(l => l.id === e.target.value);
                  if (found) handleSelectLot(found);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
              >
                {SB_PARKING_LOTS.map(lot => (
                  <option key={lot.id} value={lot.id}>
                    {lot.name} ({lot.existingStalls} stalls)
                  </option>
                ))}
              </select>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Assessor Parcel Number:</span>
                  <span className="text-white font-mono font-bold">{selectedLot.apn}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Facility Use Type:</span>
                  <span className="text-sky-300 font-bold">{selectedLot.buildingType}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Parking Lot Footprint:</span>
                  <span className="text-white font-bold">{selectedLot.lotSqFt.toLocaleString()} sq ft</span>
                </div>
              </div>
            </div>

            {/* 100% Self-Sufficiency Scorecard Gauge */}
            <div className="p-4 bg-gradient-to-br from-slate-900 via-sky-950/40 to-slate-900 border border-sky-800/60 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">
                  Energy Self-Sufficiency Matrix
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${selfSufficiencyPct >= 100 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'}`}>
                  {selfSufficiencyPct >= 100 ? '100% Net-Zero Achieved' : `${selfSufficiencyPct}% of Net-Zero`}
                </span>
              </div>

              {/* Progress Bar Gauge */}
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700 mb-3">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${selfSufficiencyPct >= 100 ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-gradient-to-r from-amber-500 to-sky-400'}`}
                  style={{ width: `${Math.min(100, selfSufficiencyPct)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
                  <div className="text-[9px] uppercase font-black text-slate-400">Solar Generation</div>
                  <div className="text-lg font-black text-emerald-400">
                    {(projectedAnnualKwh / 1000).toFixed(0)} <span className="text-xs font-mono text-slate-400">MWh/yr</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">{nameplateKwDc} kWp Array</div>
                </div>

                <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
                  <div className="text-[9px] uppercase font-black text-slate-400">Property Demand</div>
                  <div className="text-lg font-black text-sky-300">
                    {(annualBaselineKwh / 1000).toFixed(0)} <span className="text-xs font-mono text-slate-400">MWh/yr</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">Peak: {selectedLot.peakKwDemand} kW</div>
                </div>
              </div>

              {/* 1-Click Auto Scale Button */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleAutoScale100Percent}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${isAutoScaled ? 'bg-emerald-600 text-white border border-emerald-400 shadow-emerald-600/30' : 'bg-sky-600 hover:bg-sky-500 text-white border border-sky-400 shadow-sky-600/30 active:scale-95'}`}
                >
                  <span>⚡</span>
                  {isAutoScaled ? 'Scaled to 100% Self-Sufficiency' : 'Auto-Scale Canopy to 100% Self-Sufficiency'}
                </button>
              </div>
            </div>

            {/* Click & Drag Solar Canopy Controls */}
            <div className="space-y-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-widest text-sky-400 flex items-center justify-between">
                <span>📐 Solar Canopy Sizing &amp; Stalls</span>
                <span className="text-[10px] text-slate-500 font-mono">Click or drag pin on map</span>
              </h3>

              {/* Stalls Covered Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">Parking Stalls Covered:</span>
                  <span className="text-sky-400 font-mono">{canopy.stallsCovered} / {selectedLot.existingStalls} stalls</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max={selectedLot.existingStalls}
                  value={canopy.stallsCovered}
                  onChange={(e) => {
                    const stalls = parseInt(e.target.value);
                    const length = Math.round(stalls * 8.5);
                    setCanopy(prev => ({
                      ...prev,
                      stallsCovered: stalls,
                      lengthFt: Math.max(80, length)
                    }));
                    setIsAutoScaled(false);
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>

              {/* Canopy Length & Width */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Length:</span>
                    <span className="text-white font-mono">{canopy.lengthFt} ft</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="650"
                    value={canopy.lengthFt}
                    onChange={(e) => {
                      setCanopy(prev => ({ ...prev, lengthFt: parseInt(e.target.value) }));
                      setIsAutoScaled(false);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Width:</span>
                    <span className="text-white font-mono">{canopy.widthFt} ft</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="180"
                    value={canopy.widthFt}
                    onChange={(e) => {
                      setCanopy(prev => ({ ...prev, widthFt: parseInt(e.target.value) }));
                      setIsAutoScaled(false);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              </div>

              {/* Canopy Rotation & Parking Aisle Alignment */}
              <div className="space-y-2 p-3 bg-slate-950/80 rounded-2xl border border-sky-900/40">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-sky-300 font-black uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <span>🔄</span> Parking Aisle Rotation &amp; Alignment
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAlignmentHelpModal(true)}
                      className="px-1.5 py-0.5 bg-sky-900/60 hover:bg-sky-800 text-sky-200 border border-sky-600/50 rounded text-[9px] font-bold transition-all"
                      title="View Canopy Alignment & Rotation Instructions"
                    >
                      ❓ Guide
                    </button>
                    <span className="text-amber-400 font-mono font-bold text-xs">{canopy.rotationDeg || 0}°</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={canopy.rotationDeg || 0}
                  onChange={(e) => setCanopy(prev => ({ ...prev, rotationDeg: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                
                {/* Quick Alignment Presets */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setCanopy(prev => ({ ...prev, rotationDeg: selectedLot.optimalRotationDeg }))}
                    className="col-span-4 py-1.5 px-2 bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-700/60 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                    title={`Auto-align with ${selectedLot.driveAisleOrientation}`}
                  >
                    <span>📐</span> Auto-Align with Parking Aisle ({selectedLot.optimalRotationDeg}°)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanopy(prev => ({ ...prev, rotationDeg: 0 }))}
                    className="py-1 px-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[9px] font-bold"
                  >
                    🧭 0° N-S
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanopy(prev => ({ ...prev, rotationDeg: 90 }))}
                    className="py-1 px-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[9px] font-bold"
                  >
                    ➡️ 90° E-W
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanopy(prev => ({ ...prev, rotationDeg: ((prev.rotationDeg || 0) - 15 + 360) % 360 }))}
                    className="py-1 px-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[9px] font-bold"
                  >
                    ↺ -15°
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanopy(prev => ({ ...prev, rotationDeg: ((prev.rotationDeg || 0) + 15) % 360 }))}
                    className="py-1 px-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[9px] font-bold"
                  >
                    ↻ +15°
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Preset: {selectedLot.driveAisleOrientation}
                </div>
              </div>

              {/* Tilt Angle & Azimuth Orientation */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Roof Tilt:</span>
                    <span className="text-amber-400 font-mono">{canopy.tiltAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    value={canopy.tiltAngle}
                    onChange={(e) => setCanopy(prev => ({ ...prev, tiltAngle: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Azimuth:</span>
                    <span className="text-amber-400 font-mono">{canopy.azimuthDeg}° (S)</span>
                  </div>
                  <input
                    type="range"
                    min="90"
                    max="270"
                    value={canopy.azimuthDeg}
                    onChange={(e) => setCanopy(prev => ({ ...prev, azimuthDeg: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* Battery Energy Storage System (BESS) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">Tesla Megapack / BESS Battery:</span>
                  <span className="text-emerald-400 font-mono">{canopy.bessCapacityKWh} kWh</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="3500"
                  step="50"
                  value={canopy.bessCapacityKWh}
                  onChange={(e) => setCanopy(prev => ({ ...prev, bessCapacityKWh: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Off-Grid Islanding Runtime:</span>
                  <span className="text-emerald-300 font-bold">{microgridIslandingHours} continuous hours</span>
                </div>
              </div>

              {/* Dual EV Chargers Count */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">EV Charging Dual-Stanchions:</span>
                  <span className="text-cyan-400 font-mono">{canopy.evChargersCount} Ports</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="64"
                  value={canopy.evChargersCount}
                  onChange={(e) => setCanopy(prev => ({ ...prev, evChargersCount: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>

            {/* Civil 3D Engineering & Environmental Impact Summary */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Civil 3D &amp; Environmental Telemetry
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Stormwater Harvested:</span>
                  <span className="text-cyan-400 font-bold font-mono">{(stormwaterCapturedGalYr / 1000).toFixed(0)}k gal/yr</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Structural Steel:</span>
                  <span className="text-white font-bold font-mono">{structuralSteelTons} Tons A992</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">CO₂ Emissions Offset:</span>
                  <span className="text-emerald-400 font-bold font-mono">{co2OffsetTons} MT/yr</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Foundation Piers:</span>
                  <span className="text-amber-400 font-bold font-mono">{concretePiersCount} Drilled Shafts</span>
                </div>
              </div>
            </div>

            {/* Run Historical Irradiance & Yield Simulation Action */}
            <button
              type="button"
              onClick={() => setActiveTab('simulation')}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 active:scale-95 transition-all text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-600/30"
            >
              <span>⚡</span> Run Historical Irradiance &amp; Yield Simulation →
            </button>

            {/* View 20-Year Economic Impact & ROI Action */}
            <button
              type="button"
              onClick={() => setActiveTab('economic')}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 active:scale-95 transition-all text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30"
            >
              <span>📈</span> View 20-Year Economic ROI &amp; Savings →
            </button>

            {/* Commit to Property Detail Layer Action */}
            <button
              type="button"
              onClick={handleCommitToPropertyTwin}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30"
            >
              <span>💾</span> Add Simulation to Property Detail Layer
            </button>

          </aside>

          {/* Right Side Leaflet Interactive Map View */}
          <main className="flex-1 relative bg-slate-900 min-h-[400px]">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Map Perspective Controls overlay */}
            <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-2xl">
              <button
                type="button"
                onClick={() => setMapMode('satellite')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mapMode === 'satellite' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                🌍 Satellite (High-Res)
              </button>
              <button
                type="button"
                onClick={() => setMapMode('street')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mapMode === 'street' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                🏙️ Street Map
              </button>
            </div>

            {/* Map Rotation Floating Tool */}
            <div className="absolute top-16 left-4 z-[1000] flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-2xl text-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 pl-1.5">
                Align: <strong className="font-mono text-amber-300">{canopy.rotationDeg || 0}°</strong>
              </span>
              <button
                type="button"
                onClick={() => setCanopy(prev => ({ ...prev, rotationDeg: ((prev.rotationDeg || 0) - 15 + 360) % 360 }))}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs"
                title="Rotate 15 degrees counter-clockwise"
              >
                ↺ -15°
              </button>
              <button
                type="button"
                onClick={() => setCanopy(prev => ({ ...prev, rotationDeg: ((prev.rotationDeg || 0) + 15) % 360 }))}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs"
                title="Rotate 15 degrees clockwise"
              >
                ↻ +15°
              </button>
              <button
                type="button"
                onClick={() => setCanopy(prev => ({ ...prev, rotationDeg: selectedLot.optimalRotationDeg }))}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-xs flex items-center gap-1"
                title={`Auto-align with ${selectedLot.driveAisleOrientation}`}
              >
                <span>📐</span> Auto-Align ({selectedLot.optimalRotationDeg}°)
              </button>
            </div>

            {/* Interactive Instructions floating pill */}
            <div className="absolute top-4 right-4 z-[1000] max-w-sm bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-2xl text-xs space-y-1">
              <div className="font-black text-sky-400 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                  <span className="text-[10px] tracking-wider uppercase">Canopy Placement &amp; Alignment</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAlignmentHelpModal(true)}
                  className="px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  📖 Guide
                </button>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                • <strong>Drag the blue sun icon</strong> to move canopy over parking stalls.<br/>
                • <strong>Click anywhere on parking lot</strong> to teleport the canopy.<br/>
                • <strong>Rotate &amp; align</strong> canopy with parking aisles using the rotation controls (<strong>{canopy.rotationDeg || 0}°</strong>).<br/>
                • Use sliders on left to expand canopy footprint and achieve <strong>100% Net-Zero</strong>!
              </p>
            </div>

            {/* Bottom floating quick-export toolbar */}
            <div className="absolute bottom-6 left-6 right-6 z-[1000] flex flex-wrap items-center justify-between gap-3 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px] font-black uppercase">Active Array:</span>
                  <span className="font-bold text-white">{canopy.name}</span>
                </div>
                <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
                <div className="text-xs hidden sm:block">
                  <span className="text-slate-400 block text-[10px] font-black uppercase">Dimensions:</span>
                  <span className="font-mono text-sky-300 font-bold">{canopy.lengthFt}' × {canopy.widthFt}' ({canopyAreaSqFt.toLocaleString()} sq ft)</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenPdfPreview}
                  className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                  title="Real-time preview and export 2-Page Executive Stakeholder Summary PDF with verified metadata"
                >
                  <span>📑</span> Preview &amp; Export PDF
                </button>
                <button
                  type="button"
                  onClick={handleDownloadLandXml}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                  title="Export Official Autodesk LandXML 1.2 for Civil 3D import"
                >
                  <span>📐</span> Download LandXML (.xml)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadProposalReport}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <span>📄</span> Proposal Report (.txt)
                </button>
              </div>
            </div>

          </main>
        </div>
      )}

      {/* Tab: Historical Solar Irradiance & Energy Yield Simulation Engine */}
      {activeTab === 'simulation' && (
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6 max-w-7xl mx-auto w-full scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Header Banner & Quick Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 p-5 rounded-3xl border border-amber-500/30 shadow-2xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-black uppercase tracking-wider">
                  NREL NSRDB &amp; TMY3 Historical Calibrated
                </span>
                <span className="text-xs text-slate-400 font-mono">34.42° N, 119.70° W</span>
              </div>
              <h3 className="text-xl font-black text-white mt-1 flex items-center gap-2">
                <span>⚡</span> Solar Irradiance &amp; Energy Yield Simulation
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Multi-decadal historical solar irradiance analysis, plane-of-array transposition, temperature derating, and 8,760 hourly energy balance for <strong>{selectedLot.name}</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenPdfPreview}
                className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all"
                title="Real-time preview and export 2-page Executive Stakeholder Summary PDF with verified metadata"
              >
                <span>📑</span> Preview &amp; Export PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadSimulationCsv}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-600/30 transition-all"
                title="Download complete 12-month historical irradiance & yield data sheet as CSV"
              >
                <span>📥</span> Export CSV Data
              </button>
              <button
                type="button"
                onClick={() => handleApplySimulationToCanopy(canopy.lengthFt, canopy.widthFt, canopy.bessCapacityKWh)}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-sky-600/30 transition-all"
                title="Sync simulated array geometry directly back to the 3D Planner"
              >
                <span>📐</span> Apply to 3D Planner
              </button>
              <button
                type="button"
                onClick={handleCommitToPropertyTwin}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <span>💾</span> Commit to Digital Twin
              </button>
            </div>
          </div>

          {/* Chosen Parking Lot & Microclimate Details Strip */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Chosen Parking Lot:</span>
              <span className="text-white font-bold block truncate">{selectedLot.name}</span>
              <span className="text-sky-400 font-mono text-[11px]">APN: {selectedLot.apn}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Parking Lot Area:</span>
              <span className="text-white font-bold">{selectedLot.lotSqFt.toLocaleString()} sq ft</span>
              <span className="text-slate-400 text-[11px] block">{selectedLot.existingStalls} existing stalls • {selectedLot.buildingType}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Canopy Footprint:</span>
              <span className="text-emerald-400 font-bold font-mono">{canopyAreaSqFt.toLocaleString()} sq ft ({((canopyAreaSqFt / selectedLot.lotSqFt) * 100).toFixed(1)}% of lot)</span>
              <span className="text-slate-400 text-[11px] block">{canopy.stallsCovered} stalls covered • {canopy.lengthFt}' × {canopy.widthFt}'</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Microclimate Station:</span>
              <span className="text-amber-300 font-bold font-mono">{microclimate.elevationFt} ft MSL • {microclimate.coastalDistanceMiles} mi coast</span>
              <span className="text-slate-400 text-[11px] block">Marine Fog Burnoff: {microclimate.fogBurnoffTime} • Albedo: {(microclimate.albedoFactor * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* KPI Scorecards (6 Grid Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Annual Generation */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1 shadow-lg">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Annual Solar Yield</span>
              <div className="text-lg font-black text-amber-400 font-mono">
                {simulationSummary.annualSolarYieldMwh} <span className="text-xs text-amber-200">MWh/yr</span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                {simulationSummary.annualSolarYieldKwh.toLocaleString()} kWh
              </span>
            </div>

            {/* Self-Sufficiency */}
            <div className={`border rounded-2xl p-3.5 space-y-1 shadow-lg ${simulationSummary.annualSelfSufficiencyPct >= 100 ? 'bg-emerald-950/40 border-emerald-600/50' : 'bg-amber-950/30 border-amber-600/40'}`}>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Net-Zero Balance</span>
              <div className={`text-lg font-black font-mono ${simulationSummary.annualSelfSufficiencyPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {simulationSummary.annualSelfSufficiencyPct}%
              </div>
              <span className={`text-[10px] font-bold block ${simulationSummary.annualSelfSufficiencyPct >= 100 ? 'text-emerald-300' : 'text-amber-300'}`}>
                {simulationSummary.annualSelfSufficiencyPct >= 100 ? '100% Net-Zero Energy' : 'Partial Net-Zero'}
              </span>
            </div>

            {/* Specific Yield */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1 shadow-lg">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Specific Yield</span>
              <div className="text-lg font-black text-sky-400 font-mono">
                {simulationSummary.specificYieldKwhPerKwp} <span className="text-xs text-sky-200">kWh/kWp</span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                PR: {simulationSummary.systemPerformanceRatio}% • CF: {simulationSummary.capacityFactorPct}%
              </span>
            </div>

            {/* Avoided Utility Cost */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1 shadow-lg">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Avoided Utility Cost</span>
              <div className="text-lg font-black text-emerald-400 font-mono">
                ${(simulationSummary.annualAvoidedUtilityCostUsd / 1000).toFixed(1)}k <span className="text-xs text-emerald-200">/yr</span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                Clean Power Alliance TOU
              </span>
            </div>

            {/* 25-Year Cumulative */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1 shadow-lg">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">25-Yr Clean Generation</span>
              <div className="text-lg font-black text-purple-400 font-mono">
                {simulationSummary.twentyFiveYearGenerationGwh} <span className="text-xs text-purple-200">GWh</span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                ${(simulationSummary.twentyFiveYearSavingsUsd / 1000000).toFixed(2)}M Lifetime
              </span>
            </div>

            {/* Microgrid Resilience */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1 shadow-lg">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Outage Resilience</span>
              <div className="text-lg font-black text-cyan-400 font-mono">
                {simulationSummary.microgridIslandingHours} <span className="text-xs text-cyan-200">Hours</span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                Islanding + BESS ({canopy.bessCapacityKWh} kWh)
              </span>
            </div>
          </div>

          {/* Interactive Simulation Controls & Sensitivity Toggles */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>⚙️</span> Simulation Controls &amp; Historical Climate Dataset
                </h4>
                <p className="text-[11px] text-slate-400">
                  Select multi-decadal historical climate scenarios and calibrate canopy engineering variables for the chosen parking lot.
                </p>
              </div>

              {/* Climate Scenario Selector Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {CLIMATE_SCENARIOS.map(scen => (
                  <button
                    key={scen.id}
                    type="button"
                    onClick={() => setSelectedScenarioId(scen.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedScenarioId === scen.id ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    {scen.id === 'tmy3' ? 'NREL TMY3 Multi-Decadal' : 
                     scen.id === 'high_solar_2021' ? '2021 High Sun' : 
                     scen.id === 'marine_layer_2019' ? '2019 Marine Fog' : 
                     scen.id === 'atmospheric_river_2023' ? '2023 Wet Year' : '2016 El Niño'}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-amber-300/90 bg-amber-950/20 border border-amber-600/30 p-2.5 rounded-xl font-medium flex items-center gap-2">
              <span className="text-amber-400 font-bold">Climate Scenario:</span>
              <span>{CLIMATE_SCENARIOS.find(s => s.id === selectedScenarioId)?.name} — {CLIMATE_SCENARIOS.find(s => s.id === selectedScenarioId)?.description}</span>
            </div>

            {/* Parameter Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              
              {/* Parking Lot Canopy Area Allocation */}
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Canopy Lot Coverage:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {((canopyAreaSqFt / selectedLot.lotSqFt) * 100).toFixed(0)}% ({canopyAreaSqFt.toLocaleString()} sq ft)
                  </span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max={Math.min(selectedLot.lotSqFt, 120000)}
                  step="2000"
                  value={canopyAreaSqFt}
                  onChange={(e) => {
                    const targetArea = Number(e.target.value);
                    const width = 100;
                    const length = Math.round(targetArea / width);
                    const stalls = Math.min(selectedLot.existingStalls, Math.round(targetArea / 340));
                    setCanopy(prev => ({
                      ...prev,
                      lengthFt: length,
                      widthFt: width,
                      stallsCovered: stalls
                    }));
                  }}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Covered: {canopy.stallsCovered} Stalls</span>
                  <span>Total: {selectedLot.existingStalls} Stalls</span>
                </div>
              </div>

              {/* Tilt & Azimuth Angle */}
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Tilt Angle:</span>
                  <span className="text-sky-300 font-mono font-bold">{canopy.tiltAngle}° (Optimal: 12°)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="1"
                  value={canopy.tiltAngle}
                  onChange={(e) => setCanopy(prev => ({ ...prev, tiltAngle: Number(e.target.value) }))}
                  className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                  <span>Azimuth:</span>
                  <select
                    value={canopy.azimuthDeg}
                    onChange={(e) => setCanopy(prev => ({ ...prev, azimuthDeg: Number(e.target.value) }))}
                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-white"
                  >
                    <option value={180}>180° (True South)</option>
                    <option value={210}>210° (South-Southwest / 4-9pm TOU Boost)</option>
                    <option value={225}>225° (Southwest)</option>
                    <option value={150}>150° (South-Southeast)</option>
                  </select>
                </div>
              </div>

              {/* Bifacial & Soiling Profile */}
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Bifacial Albedo Gain:</span>
                  <button
                    type="button"
                    onClick={() => setBifacialEnabled(!bifacialEnabled)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${bifacialEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    {bifacialEnabled ? 'ENABLED (+8.5%)' : 'MONOFACIAL (0%)'}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Soiling / Marine Salt:</span>
                  <select
                    value={soilingProfile}
                    onChange={(e) => setSoilingProfile(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-white font-medium"
                  >
                    <option value="clean">Clean (Bi-monthly wash, 1.5%)</option>
                    <option value="standard">Standard (Quarterly rain, 2.4%)</option>
                    <option value="coastal_heavy">Heavy Coastal Salt Fog (4.5%)</option>
                  </select>
                </div>
                <div className="text-[10px] text-slate-500">
                  Asphalt Albedo: {(microclimate.albedoFactor * 100).toFixed(0)}% reflectance
                </div>
              </div>

              {/* Battery BESS & Degradation Year */}
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Tesla Megapack BESS:</span>
                  <span className="text-amber-400 font-mono font-bold">{canopy.bessCapacityKWh} kWh</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="100"
                  value={canopy.bessCapacityKWh}
                  onChange={(e) => setCanopy(prev => ({ ...prev, bessCapacityKWh: Number(e.target.value) }))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                  <span>Lifecycle Year:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="range"
                      min="1"
                      max="25"
                      step="1"
                      value={degradationYear}
                      onChange={(e) => setDegradationYear(Number(e.target.value))}
                      className="w-16 accent-amber-500 h-1 bg-slate-800 rounded cursor-pointer"
                    />
                    <span className="text-white font-mono font-bold">Yr {degradationYear}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Visual Simulation Display 1: 12-Month Historical Generation vs Facility Demand */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <span>📊</span> 12-Month Historical Solar Yield vs. Property Baseline Demand
                </h4>
                <p className="text-xs text-slate-400">
                  Monthly yield in MWh calculated from historical Plane-of-Array (POA) irradiance and ambient temperatures. Click any month to inspect details.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-gradient-to-t from-emerald-600 to-amber-400"></span>
                  <span className="text-emerald-300">Simulated Solar Generation (MWh)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-sky-600"></span>
                  <span className="text-sky-300">Property Baseline Demand (MWh)</span>
                </div>
              </div>
            </div>

            {/* Interactive 12-Month Bar Chart */}
            <div className="h-64 pt-6 pb-2 flex items-end justify-between gap-2 sm:gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
              {simulationSummary.monthlyBreakdown.map((m) => {
                const maxMwh = Math.max(...simulationSummary.monthlyBreakdown.map(b => Math.max(b.monthlySolarYieldMwh, b.baselineDemandMwh))) * 1.15 || 100;
                const solarHeightPct = Math.min(100, Math.max(10, (m.monthlySolarYieldMwh / maxMwh) * 100));
                const baselineHeightPct = Math.min(100, Math.max(10, (m.baselineDemandMwh / maxMwh) * 100));
                const isSelected = selectedSimMonth === m.monthIndex;
                const isSurplus = m.netEnergyBalanceKwh >= 0;

                return (
                  <div
                    key={m.month}
                    onClick={() => setSelectedSimMonth(m.monthIndex)}
                    className={`flex-1 h-full flex flex-col justify-end items-center cursor-pointer transition-all group ${isSelected ? 'scale-105' : 'opacity-85 hover:opacity-100'}`}
                  >
                    {/* Status Pill on Top */}
                    <div className={`text-[9px] font-black font-mono mb-1.5 px-1 py-0.5 rounded transition-all ${isSurplus ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-sky-300 border border-slate-800'}`}>
                      {isSurplus ? `+${(m.netEnergyBalanceKwh / 1000).toFixed(0)}` : `${(m.netEnergyBalanceKwh / 1000).toFixed(0)}`}
                    </div>

                    {/* Dual Bars Container */}
                    <div className="w-full flex items-end justify-center gap-1 h-44">
                      {/* Solar Generation Bar */}
                      <div
                        style={{ height: `${solarHeightPct}%` }}
                        className={`w-1/2 rounded-t-md transition-all ${isSelected ? 'bg-gradient-to-t from-emerald-500 to-amber-300 shadow-lg shadow-emerald-500/30' : 'bg-gradient-to-t from-emerald-600 to-amber-500 group-hover:from-emerald-500 group-hover:to-amber-400'}`}
                        title={`${m.month} Solar Generation: ${m.monthlySolarYieldMwh} MWh (${m.selfSufficiencyPct}% of demand)`}
                      />
                      {/* Baseline Demand Bar */}
                      <div
                        style={{ height: `${baselineHeightPct}%` }}
                        className={`w-1/2 rounded-t-md transition-all ${isSelected ? 'bg-sky-500' : 'bg-sky-700/80 group-hover:bg-sky-600'}`}
                        title={`${m.month} Baseline Facility Demand: ${m.baselineDemandMwh} MWh`}
                      />
                    </div>

                    {/* Month Label */}
                    <span className={`text-[11px] font-black mt-2 tracking-wider ${isSelected ? 'text-amber-400 font-bold' : 'text-slate-400 group-hover:text-white'}`}>
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected Month Deep Metrics Callout Strip */}
            {(() => {
              const activeMonth = simulationSummary.monthlyBreakdown[selectedSimMonth] || simulationSummary.monthlyBreakdown[0];
              return (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Selected Month:</span>
                    <span className="text-white font-black text-sm">{activeMonth.month} ({activeMonth.days} days)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Hist. GHI Irradiance:</span>
                    <span className="text-amber-400 font-mono font-bold">{activeMonth.ghi} kWh/m²/day</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Plane of Array (POA):</span>
                    <span className="text-sky-300 font-mono font-bold">{activeMonth.poaIrradiance} kWh/m²/day</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Effective Cell Temp:</span>
                    <span className="text-orange-400 font-mono font-bold">{activeMonth.effectiveCellTempC}°C</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Monthly Solar Generation:</span>
                    <span className="text-emerald-400 font-mono font-bold">{activeMonth.monthlySolarYieldMwh} MWh</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Net Self-Sufficiency:</span>
                    <span className={`font-mono font-bold ${activeMonth.selfSufficiencyPct >= 100 ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {activeMonth.selfSufficiencyPct}% Net-Zero
                    </span>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* Visual Simulation Display 2: Diurnal 24-Hour Solar Production & Storage Dispatch Curve */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <span>📈</span> Diurnal 24-Hour Solar Generation &amp; Battery Storage Dispatch
                </h4>
                <p className="text-xs text-slate-400">
                  Hourly commercial load profile, mid-day solar charging (10am–3pm), and on-peak battery discharge (4pm–9pm) eliminating SCE demand charges.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="text-amber-300">Solar Power Output (kW)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                  <span className="text-sky-300">Facility Load (kW)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span className="text-emerald-300">BESS Charge (10am-3pm)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                  <span className="text-orange-300">BESS Peak Discharge (4pm-9pm)</span>
                </div>
              </div>
            </div>

            {/* Diurnal Hourly Profile Graph (24 Bars) */}
            <div className="h-56 pt-6 pb-2 flex items-end justify-between gap-1 sm:gap-2 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
              {simulationSummary.diurnalProfile.map((pt) => {
                const maxKw = Math.max(...simulationSummary.diurnalProfile.map(p => Math.max(p.solarGenerationKw, p.facilityLoadKw))) * 1.15 || 500;
                const solarHeightPct = Math.min(100, Math.max(2, (pt.solarGenerationKw / maxKw) * 100));
                const loadHeightPct = Math.min(100, Math.max(2, (pt.facilityLoadKw / maxKw) * 100));

                return (
                  <div key={pt.hour} className="flex-1 h-full flex flex-col justify-end items-center group">
                    <div className="w-full flex items-end justify-center gap-0.5 h-36">
                      {/* Solar Output bar */}
                      <div
                        style={{ height: `${solarHeightPct}%` }}
                        className={`w-1/2 rounded-t-sm transition-all ${pt.solarGenerationKw > 0 ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-sm' : 'bg-transparent'}`}
                        title={`${pt.hourLabel} Solar Generation: ${pt.solarGenerationKw} kW`}
                      />
                      {/* Facility Load bar */}
                      <div
                        style={{ height: `${loadHeightPct}%` }}
                        className="w-1/2 rounded-t-sm bg-sky-600/70 transition-all group-hover:bg-sky-500"
                        title={`${pt.hourLabel} Facility Demand: ${pt.facilityLoadKw} kW`}
                      />
                    </div>
                    {/* Hour label on x-axis */}
                    <span className="text-[8px] sm:text-[9px] font-mono text-slate-500 mt-2">
                      {pt.hour % 3 === 0 ? pt.hourLabel.replace(':00', 'h') : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Peak Shaving Strategy Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-amber-400 block mb-1">Peak Midday Generation</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Peak solar generation reaches <strong>{simulationSummary.peakGenerationKw} kW</strong> at 13:00 solar noon, providing 100% building power with surplus routed directly to battery storage and EV charging hubs.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-orange-400 block mb-1">4 PM – 9 PM Peak Demand Shaving</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  The {canopy.bessCapacityKWh} kWh Tesla Megapack automatically discharges during Southern California Edison's highest tariff window ($0.42/kWh), eliminating expensive non-coincident demand charges.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] font-black uppercase text-cyan-400 block mb-1">Islanded Outage Resilience</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  In the event of a PSPS wildfire grid shutoff, the parking lot solar canopy array microgrid maintains <strong>{simulationSummary.microgridIslandingHours} continuous hours</strong> of critical facility operations.
                </p>
              </div>
            </div>

          </div>

          {/* Full 12-Month Historical Irradiance & Yield Breakdown Data Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <span>📋</span> 12-Month Historical Irradiance &amp; Solar Yield Ledger
                </h4>
                <p className="text-xs text-slate-400">
                  Comprehensive monthly audit table based on NREL NSRDB &amp; Santa Barbara historical solar insolation datasets.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadSimulationCsv}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <span>📥</span> Download Data Sheet (.csv)
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Month</th>
                    <th className="py-3 px-3">Days</th>
                    <th className="py-3 px-3">Hist. GHI (kWh/m²/d)</th>
                    <th className="py-3 px-3">POA (kWh/m²/d)</th>
                    <th className="py-3 px-3">Cell Temp (°C)</th>
                    <th className="py-3 px-3">Solar Yield (MWh)</th>
                    <th className="py-3 px-3">Demand (MWh)</th>
                    <th className="py-3 px-3">Net Balance</th>
                    <th className="py-3 px-3">Self-Sufficiency</th>
                    <th className="py-3 px-3">Avoided Cost ($)</th>
                    <th className="py-3 px-3">CO₂ Offset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {simulationSummary.monthlyBreakdown.map((row) => (
                    <tr
                      key={row.month}
                      onClick={() => setSelectedSimMonth(row.monthIndex)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${selectedSimMonth === row.monthIndex ? 'bg-amber-950/20' : ''}`}
                    >
                      <td className="py-2.5 px-3 font-bold text-white">{row.month}</td>
                      <td className="py-2.5 px-3 text-slate-400">{row.days}</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">{row.ghi}</td>
                      <td className="py-2.5 px-3 text-sky-300">{row.poaIrradiance}</td>
                      <td className="py-2.5 px-3 text-orange-300">{row.effectiveCellTempC}°C</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.monthlySolarYieldMwh}</td>
                      <td className="py-2.5 px-3 text-sky-400">{row.baselineDemandMwh}</td>
                      <td className={`py-2.5 px-3 font-bold ${row.netEnergyBalanceKwh >= 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {row.netEnergyBalanceKwh >= 0 ? `+${(row.netEnergyBalanceKwh / 1000).toFixed(1)} MWh` : `${(row.netEnergyBalanceKwh / 1000).toFixed(1)} MWh`}
                      </td>
                      <td className={`py-2.5 px-3 font-bold ${row.selfSufficiencyPct >= 100 ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {row.selfSufficiencyPct}%
                      </td>
                      <td className="py-2.5 px-3 text-emerald-300 font-bold">${row.avoidedUtilityCostUsd.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-teal-300">{row.co2OffsetTons} MT</td>
                    </tr>
                  ))}
                  {/* Totals Summary Row */}
                  <tr className="bg-slate-950 font-bold text-white border-t-2 border-slate-700">
                    <td className="py-3 px-3 uppercase tracking-wider text-amber-400">Annual Total</td>
                    <td className="py-3 px-3 text-slate-400">365</td>
                    <td className="py-3 px-3 text-amber-300">5.42 avg</td>
                    <td className="py-3 px-3 text-sky-300">5.82 avg</td>
                    <td className="py-3 px-3 text-orange-300">16.8°C avg</td>
                    <td className="py-3 px-3 text-emerald-400 text-sm font-black">{simulationSummary.annualSolarYieldMwh} MWh</td>
                    <td className="py-3 px-3 text-sky-400 text-sm">{simulationSummary.annualBaselineDemandMwh} MWh</td>
                    <td className={`py-3 px-3 ${simulationSummary.netAnnualBalanceKwh >= 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {simulationSummary.netAnnualBalanceKwh >= 0 ? `+${(simulationSummary.netAnnualBalanceKwh / 1000).toFixed(1)} MWh` : `${(simulationSummary.netAnnualBalanceKwh / 1000).toFixed(1)} MWh`}
                    </td>
                    <td className="py-3 px-3 text-emerald-300 text-sm font-black">{simulationSummary.annualSelfSufficiencyPct}%</td>
                    <td className="py-3 px-3 text-emerald-300 text-sm font-black">${simulationSummary.annualAvoidedUtilityCostUsd.toLocaleString()}</td>
                    <td className="py-3 px-3 text-teal-300">{simulationSummary.annualCo2OffsetMetricTons} MT</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Civil 3D Engineering & Environmental Impact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
            
            {/* Civil 3D Engineering Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold">
                  📐
                </span>
                <div>
                  <h5 className="text-sm font-black text-white">Autodesk Civil 3D Integration Specs</h5>
                  <p className="text-[11px] text-slate-400">California State Plane Zone V (EPSG: 2229)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">A992 Structural Steel:</span>
                  <span className="text-white font-bold">{structuralSteelTons} Tons</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Foundation Piers:</span>
                  <span className="text-amber-400 font-bold">{concretePiersCount} Drilled Shafts</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Stormwater Captured:</span>
                  <span className="text-cyan-400 font-bold">{stormwaterCapturedGalYr.toLocaleString()} Gal/yr</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Levelized Cost (LCOE):</span>
                  <span className="text-emerald-400 font-bold">${simulationSummary.lcoeUsdPerKwh}/kWh</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadLandXml}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
              >
                <span>📐</span> Export Autodesk Civil 3D LandXML (.xml)
              </button>
            </div>

            {/* Action Bar Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold">
                  🏛️
                </span>
                <div>
                  <h5 className="text-sm font-black text-white">Commit Digital Twin Simulation</h5>
                  <p className="text-[11px] text-slate-400">Persist to Property Detail Layer &amp; Proposal Package</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Save this completed energy simulation into the <strong>Property Digital Twin Layer</strong> with full historical irradiance records, LandXML 1.2 geometry, and 100% self-sufficiency verification.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCommitToPropertyTwin}
                  className="flex-1 min-w-[150px] py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
                >
                  <span>💾</span> Commit to Digital Twin
                </button>
                <button
                  type="button"
                  onClick={handleOpenPdfPreview}
                  className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/25 transition-all"
                  title="Real-time preview and verify metadata before exporting Stakeholder PDF"
                >
                  <span>📑</span> Preview &amp; Export PDF
                </button>
                <button
                  type="button"
                  onClick={handleDownloadProposalReport}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <span>📄</span> Proposal (.txt)
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab: 20-Year Economic Impact, ROI & Carbon Revenue Engine */}
      {activeTab === 'economic' && (
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6 max-w-7xl mx-auto w-full scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Header Banner & Quick Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-5 lg:p-6 rounded-3xl border border-emerald-500/30 shadow-2xl">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {ledgerHorizon}-Year Variable Annual Cash Flow Ledger
                </span>
                {economicResult.hasUserOverrides ? (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-mono font-bold animate-pulse">
                    ✏️ {economicResult.overriddenYearsCount} Years User-Adjusted
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-mono">CPUC Regulated Rates • IRA Sec. 48 &amp; 6417</span>
                )}
              </div>
              <h3 className="text-xl lg:text-2xl font-black text-white flex items-center gap-2">
                <span>📈</span> Economic Impact &amp; User-Adjustable Cash Flow Ledger
              </h3>
              <p className="text-xs text-slate-300 max-w-3xl">
                Adjust yearly generation, tariff escalation, demand savings, and O&amp;M line items directly. Instant pro-forma recalculation of Payback Year, IRR, and 10-Year Net Savings for <strong>{selectedLot.name}</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingLedger(!isEditingLedger)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border active:scale-95 ${
                  isEditingLedger
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span>{isEditingLedger ? '💾 Save & Finish Editing' : '✏️ Edit Annual Rows'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadEconomicCsv}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 active:scale-95"
                title="Download user-adjusted annual cash flow ledger as CSV"
              >
                <span>📥</span> Export Ledger (.csv)
              </button>
              <button
                type="button"
                onClick={handleOpenPdfPreview}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all"
                title="Real-time preview and export 2-page Executive Stakeholder Summary PDF"
              >
                <span>📑</span> Preview &amp; Export PDF
              </button>
            </div>
          </div>

          {/* Horizon Switcher & Scenario Preset Toolbar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Ledger Horizon:
              </span>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setLedgerHorizon(10)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    ledgerHorizon === 10
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>⚡</span> 10-Year Annual Ledger (User Variable)
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerHorizon(20)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    ledgerHorizon === 20
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📅</span> 20-Year Pro-Forma Schedule
                </button>
              </div>
            </div>

            {/* Quick Sensitivity Scenarios */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Presets:
              </span>
              {LEDGER_SCENARIO_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyLedgerScenario(preset.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    activeLedgerScenario === preset.id
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                  title={preset.description}
                >
                  {preset.badge}
                </button>
              ))}
              {economicResult.hasUserOverrides && (
                <button
                  type="button"
                  onClick={handleResetAllOverrides}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition-all ml-1"
                  title="Reset all user-modified rows to baseline model"
                >
                  ↺ Reset All
                </button>
              )}
            </div>
          </div>

          {/* 6 Top Financial KPI Scorecards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Net Savings */}
            <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-3.5 shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                {ledgerHorizon}-Yr Net Savings
              </div>
              <div className="text-xl lg:text-2xl font-black text-white mt-0.5">
                ${((ledgerHorizon === 10 ? economicResult.tenYearNetSavingsUsd : economicResult.twentyYearNetSavingsUsd) / 1000000).toFixed(2)}M
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Gross: ${((ledgerHorizon === 10 ? economicResult.tenYearGrossSavingsUsd : economicResult.twentyYearGrossSavingsUsd) / 1000000).toFixed(2)}M
              </div>
            </div>

            {/* 2. Simple Payback */}
            <div className="bg-slate-900/90 border border-sky-500/40 rounded-2xl p-3.5 shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-black uppercase tracking-wider text-sky-400">Simple Payback</div>
              <div className="text-xl lg:text-2xl font-black text-white mt-0.5">
                {ledgerHorizon === 10 ? economicResult.tenYearPaybackYears : economicResult.simplePaybackYears} <span className="text-sm font-normal text-slate-400">Yrs</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Discounted: {economicResult.discountedPaybackYears} Yrs
              </div>
            </div>

            {/* 3. Internal Rate of Return (IRR) */}
            <div className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-3.5 shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                {ledgerHorizon}-Yr Project IRR
              </div>
              <div className="text-xl lg:text-2xl font-black text-purple-300 mt-0.5">
                {ledgerHorizon === 10 ? economicResult.tenYearIrrPercentage : economicResult.irrPercentage}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                vs 4.5% Municipal Hurdle
              </div>
            </div>

            {/* 4. Net Initial Outlay */}
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-3.5 shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">Net Initial Outlay</div>
              <div className="text-xl lg:text-2xl font-black text-amber-300 mt-0.5">
                ${(economicResult.netInitialInvestmentUsd / 1000).toFixed(0)}k
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                -${(economicResult.totalIncentivesUsd / 1000).toFixed(0)}k Subsidies
              </div>
            </div>

            {/* 5. Net Present Value (NPV) */}
            <div className="bg-slate-900/90 border border-teal-500/40 rounded-2xl p-3.5 shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-black uppercase tracking-wider text-teal-400">Net Present Value</div>
              <div className="text-xl lg:text-2xl font-black text-white mt-0.5">
                ${((ledgerHorizon === 10 ? economicResult.tenYearNpvUsd : economicResult.npvUsd) / 1000000).toFixed(2)}M
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                at {discountRatePct}% Discount Rate
              </div>
            </div>

            {/* 6. Carbon Revenue / User Overrides */}
            <div className="bg-slate-900/90 border border-rose-500/40 rounded-2xl p-3.5 shadow-lg relative overflow-hidden">
              <div className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                {ledgerHorizon}-Yr Carbon Rev
              </div>
              <div className="text-xl lg:text-2xl font-black text-rose-300 mt-0.5">
                ${((ledgerHorizon === 10 ? economicResult.tenYearCarbonCreditRevenueUsd : economicResult.twentyYearCarbonCreditRevenueUsd) / 1000).toFixed(0)}k
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {economicResult.hasUserOverrides ? 'Custom Overrides Active' : 'Baseline Model'}
              </div>
            </div>
          </div>

          {/* Interactive Financial & Policy Sensitivity Sliders (2-Column Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Panel A: Local Utility Tariff & Demand Charges */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center font-bold text-sm">
                    ⚡
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-white">Local Utility Tariffs &amp; Escalation</h4>
                    <p className="text-[11px] text-slate-400">Clean Power Alliance &amp; Southern California Edison</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-sky-900/60 text-sky-200 border border-sky-600 rounded text-[10px] font-mono font-bold">
                  ${economicResult.blendedUtilityBenchmarkRateUsd.toFixed(3)}/kWh
                </span>
              </div>

              {/* Tariff Preset Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Commercial Tariff Structure:</span>
                  <span className="text-sky-400 font-mono text-[10px]">{UTILITY_TARIFF_PRESETS.find(t => t.id === selectedTariffId)?.utility}</span>
                </label>
                <select
                  value={selectedTariffId}
                  onChange={(e) => setSelectedTariffId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {UTILITY_TARIFF_PRESETS.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} — ${t.blendedRatePerKwh.toFixed(3)}/kWh (${t.demandChargePerKwMonth.toFixed(2)}/kW-mo)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 italic">
                  {UTILITY_TARIFF_PRESETS.find(t => t.id === selectedTariffId)?.description}
                </p>
              </div>

              {/* Annual Utility Rate Escalator */}
              <div className="space-y-1.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">Annual Utility Rate Inflation (CPUC Trend):</span>
                  <span className="text-sky-400 font-mono">{utilityEscalationPct}% / year</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="7.0"
                  step="0.1"
                  value={utilityEscalationPct}
                  onChange={(e) => setUtilityEscalationPct(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1.0% (Conservative)</span>
                  <span>3.8% (California Historical Avg)</span>
                  <span>7.0% (High Inflation)</span>
                </div>
              </div>

              {/* Demand Charge Shaving Callout */}
              <div className="p-3 bg-emerald-950/40 rounded-2xl border border-emerald-800/40 text-xs space-y-1">
                <div className="text-[10px] font-black uppercase text-emerald-400 flex items-center justify-between">
                  <span>🔋 BESS Peak Demand Shaving Benefit</span>
                  <span className="font-mono text-white">Year 1: +${economicResult.cashFlowSchedule[0]?.demandChargeSavingsUsd.toLocaleString()}/yr</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  The {canopy.bessCapacityKWh} kWh Tesla Megapack autonomously discharges during the 4:00 PM – 9:00 PM on-peak demand window, mitigating ~35% of {selectedLot.name}'s {selectedLot.peakKwDemand} kW peak demand charges.
                </p>
              </div>
            </div>

            {/* Panel B: Carbon Offset Credits & Federal Incentives */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
                    🌱
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-white">Carbon Offset Markets &amp; Federal IRA</h4>
                    <p className="text-[11px] text-slate-400">Carbon Abatement Credits &amp; Investment Tax Credits</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-amber-900/60 text-amber-200 border border-amber-600 rounded text-[10px] font-mono font-bold">
                  ${CARBON_CREDIT_PRESETS.find(c => c.id === selectedCarbonCreditId)?.pricePerMetricTonUsd}/MT
                </span>
              </div>

              {/* Carbon Credit Preset */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Carbon Offset Crediting Standard:</span>
                  <span className="text-amber-400 font-mono text-[10px]">{CARBON_CREDIT_PRESETS.find(c => c.id === selectedCarbonCreditId)?.marketType.toUpperCase()}</span>
                </label>
                <select
                  value={selectedCarbonCreditId}
                  onChange={(e) => setSelectedCarbonCreditId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {CARBON_CREDIT_PRESETS.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — ${c.pricePerMetricTonUsd}/MT CO2e (+{c.annualPriceEscalationPct}%/yr)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 italic">
                  {CARBON_CREDIT_PRESETS.find(c => c.id === selectedCarbonCreditId)?.description}
                </p>
              </div>

              {/* Federal IRA ITC & Direct Pay */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 block">Federal IRA ITC Rate:</label>
                  <select
                    value={itcRatePct}
                    onChange={(e) => setItcRatePct(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value={30}>30% (Standard Base ITC)</option>
                    <option value={40}>40% (+10% Domestic Content)</option>
                    <option value={50}>50% (+20% Low-Income/Energy Community)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 block">IRA Entity Classification:</label>
                  <select
                    value={isDirectPay ? 'direct_pay' : 'taxable'}
                    onChange={(e) => {
                      const dp = e.target.value === 'direct_pay';
                      setIsDirectPay(dp);
                      if (dp) setApplyMacrs(false);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="direct_pay">Municipal Elective Direct Pay (Sec. 6417)</option>
                    <option value="taxable">Taxable Commercial Entity (PPA / MACRS)</option>
                  </select>
                </div>
              </div>

              {/* Discount Rate for NPV */}
              <div className="space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">Discount Rate for NPV:</span>
                  <span className="text-teal-400 font-mono">{discountRatePct}%</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="10.0"
                  step="0.5"
                  value={discountRatePct}
                  onChange={(e) => setDiscountRatePct(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>

            </div>

          </div>

          {/* Visual Chart 1: Variable Cumulative Cash Flow & Break-Even Curve */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <span>📊</span> {ledgerHorizon}-Year Cumulative Cash Flow &amp; Break-Even Curve
                </h4>
                <p className="text-xs text-slate-400">
                  Initial net capital outlay recovering to zero at Year <strong>{ledgerHorizon === 10 ? economicResult.tenYearPaybackYears : economicResult.simplePaybackYears}</strong>, accumulating to <strong>${((ledgerHorizon === 10 ? economicResult.tenYearNetSavingsUsd : economicResult.twentyYearNetSavingsUsd) / 1000000).toFixed(2)}M</strong> net cost savings.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-300">Cumulative Savings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-amber-400"></span>
                  <span className="text-slate-300">$0 Break-Even Line</span>
                </div>
                <div className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-600 rounded-lg font-bold">
                  Break-Even: Year {ledgerHorizon === 10 ? economicResult.tenYearPaybackYears : economicResult.simplePaybackYears}
                </div>
              </div>
            </div>

            {/* SVG Interactive Chart */}
            <div className="w-full h-72 relative">
              {(() => {
                const horizon = ledgerHorizon;
                const chartW = 900;
                const chartH = 260;
                const padLeft = 70;
                const padRight = 30;
                const padTop = 20;
                const padBottom = 35;
                const plotW = chartW - padLeft - padRight;
                const plotH = chartH - padTop - padBottom;

                const currentNetSavings = horizon === 10 ? economicResult.tenYearNetSavingsUsd : economicResult.twentyYearNetSavingsUsd;
                const minVal = -economicResult.netInitialInvestmentUsd;
                const maxVal = Math.max(100000, currentNetSavings * 1.05);
                const range = maxVal - minVal || 1;

                const getY = (val: number) => {
                  return padTop + plotH - ((val - minVal) / range) * plotH;
                };

                const getX = (yr: number) => {
                  return padLeft + (yr / horizon) * plotW;
                };

                const zeroY = getY(0);

                const points: [number, number][] = [
                  [getX(0), getY(minVal)]
                ];

                const relevantSchedule = economicResult.cashFlowSchedule.filter(r => r.year <= horizon);
                relevantSchedule.forEach(r => {
                  points.push([getX(r.year), getY(r.cumulativeCashFlowUsd)]);
                });

                const pathData = points.reduce((acc, p, idx) => {
                  return idx === 0 ? `M ${p[0]} ${p[1]}` : `${acc} L ${p[0]} ${p[1]}`;
                }, '');

                const areaData = `${pathData} L ${getX(horizon)} ${zeroY} L ${getX(0)} ${zeroY} Z`;

                return (
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full overflow-visible font-mono text-[10px]">
                    <defs>
                      <linearGradient id="cashFlowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {[minVal, minVal / 2, 0, maxVal * 0.33, maxVal * 0.66, maxVal].map((gVal, gIdx) => {
                      const gy = getY(gVal);
                      const isZero = Math.abs(gVal) < 1000;
                      return (
                        <g key={gIdx}>
                          <line
                            x1={padLeft}
                            y1={gy}
                            x2={chartW - padRight}
                            y2={gy}
                            stroke={isZero ? '#f59e0b' : '#334155'}
                            strokeDasharray={isZero ? '6,3' : '2,2'}
                            strokeWidth={isZero ? 1.5 : 1}
                          />
                          <text
                            x={padLeft - 8}
                            y={gy + 3}
                            textAnchor="end"
                            fill={isZero ? '#f59e0b' : '#64748b'}
                            className="text-[9px]"
                          >
                            {gVal >= 1000000 || gVal <= -1000000
                              ? `$${(gVal / 1000000).toFixed(1)}M`
                              : `$${(gVal / 1000).toFixed(0)}k`}
                          </text>
                        </g>
                      );
                    })}

                    {/* Area fill */}
                    <path d={areaData} fill="url(#cashFlowGrad)" />

                    {/* Line curve */}
                    <path d={pathData} fill="none" stroke="#10b981" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

                    {/* Year tick marks & vertical guidelines */}
                    {(horizon === 10 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]).map(yr => {
                      const gx = getX(yr);
                      return (
                        <g key={yr}>
                          <line x1={gx} y1={padTop} x2={gx} y2={chartH - padBottom} stroke="#1e293b" strokeWidth={1} />
                          <text x={gx} y={chartH - padBottom + 16} textAnchor="middle" fill="#94a3b8" className="text-[10px]">
                            {yr === 0 ? 'Yr 0 (CapEx)' : `Yr ${yr}`}
                          </text>
                        </g>
                      );
                    })}

                    {/* Payback marker highlight */}
                    {(() => {
                      const pbYears = horizon === 10 ? economicResult.tenYearPaybackYears : economicResult.simplePaybackYears;
                      if (pbYears > horizon) return null;
                      const pbX = getX(pbYears);
                      return (
                        <g>
                          <line x1={pbX} y1={padTop} x2={pbX} y2={chartH - padBottom} stroke="#38bdf8" strokeDasharray="3,3" strokeWidth={1.5} />
                          <circle cx={pbX} cy={zeroY} r={6} fill="#38bdf8" stroke="#ffffff" strokeWidth={2} />
                          <rect x={pbX - 45} y={zeroY - 26} width={90} height={18} rx={4} fill="#0369a1" />
                          <text x={pbX} y={zeroY - 14} textAnchor="middle" fill="#ffffff" fontWeight="bold" className="text-[9px]">
                            Payback: Yr {pbYears}
                          </text>
                        </g>
                      );
                    })()}

                    {/* Final Horizon Endpoint Marker */}
                    {(() => {
                      const lastX = getX(horizon);
                      const lastY = getY(currentNetSavings);
                      return (
                        <g>
                          <circle cx={lastX} cy={lastY} r={6} fill="#10b981" stroke="#ffffff" strokeWidth={2} />
                          <text x={lastX - 8} y={lastY - 10} textAnchor="end" fill="#34d399" fontWeight="bold" className="text-[10px]">
                            +${(currentNetSavings / 1000000).toFixed(2)}M
                          </text>
                        </g>
                      );
                    })()}
                  </svg>
                );
              })()}
            </div>
          </div>

          {/* Visual Chart 2: Annual Cost Savings Stacked Breakdown */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <span>💰</span> Annual Cost Savings &amp; Revenue Breakdown (Years 1 to {ledgerHorizon})
                </h4>
                <p className="text-xs text-slate-400">
                  Stacked visualization showing avoided utility bills, demand peak shaving, and verified carbon credit revenue against annual O&amp;M expenses.
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-500"></span>
                  <span className="text-slate-300">Avoided Electricity</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                  <span className="text-slate-300">Demand Shaving</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>
                  <span className="text-slate-300">Carbon Credits</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-400"></span>
                  <span className="text-slate-300">EV Margin</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                  <span className="text-slate-300">O&amp;M Expense</span>
                </div>
              </div>
            </div>

            {/* Stacked Bars Component */}
            <div className={`grid ${ledgerHorizon === 10 ? 'grid-cols-5 sm:grid-cols-10' : 'grid-cols-5 sm:grid-cols-10 lg:grid-cols-20'} gap-1.5 pt-2`}>
              {economicResult.cashFlowSchedule.filter(r => r.year <= ledgerHorizon).map(r => {
                const maxYearGross = Math.max(...economicResult.cashFlowSchedule.filter(s => s.year <= ledgerHorizon).map(s => s.totalGrossSavingsUsd)) || 1;
                const heightPct = Math.min(100, Math.round((r.totalGrossSavingsUsd / maxYearGross) * 100));
                const pbYear = ledgerHorizon === 10 ? economicResult.tenYearPaybackYears : economicResult.simplePaybackYears;
                const isPayback = Math.floor(pbYear) === r.year;

                return (
                  <div key={r.year} className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${isPayback ? 'bg-emerald-950/60 border-emerald-500' : r.isOverridden ? 'bg-amber-950/40 border-amber-600/60' : 'bg-slate-950 border-slate-800'}`}>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono text-slate-400 font-bold">Y{r.year}</span>
                      {r.isOverridden && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="User Adjusted"></span>}
                    </div>
                    
                    {/* Visual Bar Container */}
                    <div className="w-full h-32 flex flex-col justify-end items-center my-1.5">
                      <div className="w-full rounded-t flex flex-col overflow-hidden" style={{ height: `${heightPct}%` }}>
                        {/* Avoided Utility Bill */}
                        <div
                          className="bg-sky-500 w-full"
                          style={{ height: `${(r.avoidedUtilityBillUsd / r.totalGrossSavingsUsd) * 100}%` }}
                          title={`Year ${r.year} Avoided Utility: $${r.avoidedUtilityBillUsd.toLocaleString()}`}
                        />
                        {/* Demand Savings */}
                        <div
                          className="bg-emerald-500 w-full"
                          style={{ height: `${(r.demandChargeSavingsUsd / r.totalGrossSavingsUsd) * 100}%` }}
                          title={`Year ${r.year} Demand Shaving: $${r.demandChargeSavingsUsd.toLocaleString()}`}
                        />
                        {/* Carbon Credits */}
                        <div
                          className="bg-amber-400 w-full"
                          style={{ height: `${(r.carbonCreditRevenueUsd / r.totalGrossSavingsUsd) * 100}%` }}
                          title={`Year ${r.year} Carbon Credits: $${r.carbonCreditRevenueUsd.toLocaleString()}`}
                        />
                        {/* EV Charging */}
                        {r.evChargingRevenueUsd > 0 && (
                          <div
                            className="bg-purple-400 w-full"
                            style={{ height: `${(r.evChargingRevenueUsd / r.totalGrossSavingsUsd) * 100}%` }}
                            title={`Year ${r.year} EV Revenue: $${r.evChargingRevenueUsd.toLocaleString()}`}
                          />
                        )}
                      </div>
                    </div>

                    <span className="text-[9px] font-mono font-bold text-emerald-300">
                      ${(r.netAnnualCashFlowUsd / 1000).toFixed(0)}k
                    </span>
                    {isPayback && (
                      <span className="mt-1 px-1 py-0.5 bg-emerald-500 text-slate-950 text-[8px] font-black rounded uppercase">
                        Payback
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CapEx & Incentives Pro-Forma Summary Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Gross CapEx Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <h5 className="text-sm font-black text-white flex items-center gap-2">
                <span>🏗️</span> Initial Capital Outlay (Gross CapEx)
              </h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Solar Canopy Photovoltaic Array (Turnkey Carport):</span>
                  <span className="text-white font-mono font-bold">${economicResult.grossSolarCapexUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Tesla Megapack BESS Energy Storage ({canopy.bessCapacityKWh} kWh):</span>
                  <span className="text-white font-mono font-bold">${economicResult.bessCapexUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Dual-Port EV Charging Stanchions ({canopy.evChargersCount} Ports):</span>
                  <span className="text-white font-mono font-bold">${economicResult.evChargingCapexUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Civil &amp; Geotechnical Drilled Shaft Foundations:</span>
                  <span className="text-white font-mono font-bold">${economicResult.civilAndInterconnectionCapexUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-black">
                  <span className="text-slate-200">TOTAL GROSS PROJECT CAPEX:</span>
                  <span className="text-sky-300 font-mono">${economicResult.totalGrossCapexUsd.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Right: Incentives & Subsidies */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <h5 className="text-sm font-black text-white flex items-center gap-2">
                <span>🏛️</span> Subsidies, Tax Credits &amp; Direct Pay
              </h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Federal IRA Section 48/6417 ITC ({itcRatePct}%):</span>
                  <span className="text-emerald-400 font-mono font-bold">-${economicResult.federalItcBenefitUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">California SGIP Battery Storage Rebate ($250/kWh):</span>
                  <span className="text-emerald-400 font-mono font-bold">-${economicResult.sgipStorageIncentiveUsd.toLocaleString()}</span>
                </div>
                {economicResult.macrsDepreciationTaxShieldUsd > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">MACRS 5-Year Accelerated Depreciation Tax Shield:</span>
                    <span className="text-emerald-400 font-mono font-bold">-${economicResult.macrsDepreciationTaxShieldUsd.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Total Subsidies &amp; Capital Offsets:</span>
                  <span className="text-emerald-400 font-mono font-bold">-${economicResult.totalIncentivesUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-black">
                  <span className="text-slate-200">NET INITIAL CAPITAL INVESTMENT:</span>
                  <span className="text-amber-300 font-mono">${economicResult.netInitialInvestmentUsd.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Variable Cash Flow Ledger Table (User-Adjustable) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <span>📋</span> {ledgerHorizon}-Year Annual Variable Cash Flow Ledger
                  </h4>
                  {economicResult.hasUserOverrides && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[9px] font-mono font-bold">
                      {economicResult.overriddenYearsCount} Years Customized
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {isEditingLedger
                    ? '✏️ Inline Editing Mode Active: Type custom values directly into table cells to simulate unique operational contracts.'
                    : 'Audited annual financial schedule incorporating 0.5%/yr PV panel degradation, escalated utility rates, and carbon offset monetization.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingLedger(!isEditingLedger)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
                    isEditingLedger
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <span>{isEditingLedger ? '💾 Done Editing' : '✏️ Edit Annual Rows'}</span>
                </button>
                {economicResult.hasUserOverrides && (
                  <button
                    type="button"
                    onClick={handleResetAllOverrides}
                    className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-bold transition-all"
                  >
                    ↺ Reset All
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDownloadEconomicCsv}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <span>📥</span> Download Ledger (.csv)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Year</th>
                    <th className="py-2.5 px-3">Generation (MWh)</th>
                    <th className="py-2.5 px-3">Tariff ($/kWh)</th>
                    <th className="py-2.5 px-3">Avoided Bill ($)</th>
                    <th className="py-2.5 px-3">Demand Sav. ($)</th>
                    <th className="py-2.5 px-3">Carbon Credits</th>
                    <th className="py-2.5 px-3">O&amp;M Cost ($)</th>
                    <th className="py-2.5 px-3 text-emerald-400">Net Cash Flow ($)</th>
                    <th className="py-2.5 px-3 text-sky-400">Cumulative</th>
                    <th className="py-2.5 px-3 text-center">Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {economicResult.cashFlowSchedule.filter(r => r.year <= ledgerHorizon).map(r => {
                    const pbYear = ledgerHorizon === 10 ? economicResult.tenYearPaybackYears : economicResult.simplePaybackYears;
                    const isPayback = Math.floor(pbYear) === r.year;

                    return (
                      <tr
                        key={r.year}
                        className={`transition-colors ${
                          isPayback
                            ? 'bg-emerald-950/40 text-emerald-200'
                            : r.isOverridden
                            ? 'bg-amber-950/30 text-amber-200'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        {/* Year Label */}
                        <td className="py-2 px-3 font-bold text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>Year {r.year}</span>
                            {isPayback && (
                              <span className="px-1 py-0.5 bg-emerald-500 text-slate-950 text-[8px] font-black rounded uppercase">
                                Payback
                              </span>
                            )}
                            {r.isOverridden && (
                              <span className="px-1 py-0.5 bg-amber-500 text-slate-950 text-[8px] font-black rounded uppercase" title={r.overrideNotes}>
                                Adjusted
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Generation (MWh) */}
                        <td className="py-2 px-3">
                          {isEditingLedger ? (
                            <input
                              type="number"
                              step="1"
                              value={Math.round(r.solarGenerationKwh / 1000)}
                              onChange={(e) => handleUpdateYearOverride(r.year, 'solarGenerationKwh', parseFloat(e.target.value) * 1000)}
                              className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white"
                            />
                          ) : (
                            <span>{(r.solarGenerationKwh / 1000).toFixed(1)} MWh</span>
                          )}
                        </td>

                        {/* Utility Rate ($/kWh) */}
                        <td className="py-2 px-3 text-slate-400">
                          {isEditingLedger ? (
                            <input
                              type="number"
                              step="0.005"
                              value={r.gridElectricityRateUsd}
                              onChange={(e) => handleUpdateYearOverride(r.year, 'gridElectricityRateUsd', parseFloat(e.target.value))}
                              className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white"
                            />
                          ) : (
                            <span>${r.gridElectricityRateUsd.toFixed(3)}</span>
                          )}
                        </td>

                        {/* Avoided Utility Bill */}
                        <td className="py-2 px-3 text-sky-300">
                          ${r.avoidedUtilityBillUsd.toLocaleString()}
                        </td>

                        {/* Demand Savings */}
                        <td className="py-2 px-3 text-emerald-300">
                          {isEditingLedger ? (
                            <input
                              type="number"
                              step="500"
                              value={r.demandChargeSavingsUsd}
                              onChange={(e) => handleUpdateYearOverride(r.year, 'demandChargeSavingsUsd', parseFloat(e.target.value))}
                              className="w-24 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-emerald-300 font-bold"
                            />
                          ) : (
                            <span>+${r.demandChargeSavingsUsd.toLocaleString()}</span>
                          )}
                        </td>

                        {/* Carbon Credits */}
                        <td className="py-2 px-3 text-amber-300">
                          +${r.carbonCreditRevenueUsd.toLocaleString()}
                        </td>

                        {/* O&M Expenses */}
                        <td className="py-2 px-3 text-rose-400">
                          {isEditingLedger ? (
                            <input
                              type="number"
                              step="500"
                              value={r.omExpensesUsd}
                              onChange={(e) => handleUpdateYearOverride(r.year, 'omExpensesUsd', parseFloat(e.target.value))}
                              className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-rose-400"
                            />
                          ) : (
                            <span>-${r.omExpensesUsd.toLocaleString()}</span>
                          )}
                        </td>

                        {/* Net Annual Cash Flow */}
                        <td className="py-2 px-3 font-bold text-emerald-400">
                          {isEditingLedger ? (
                            <input
                              type="number"
                              step="1000"
                              value={r.netAnnualCashFlowUsd}
                              onChange={(e) => handleUpdateYearOverride(r.year, 'customNetAnnualUsd', parseFloat(e.target.value))}
                              className="w-24 bg-slate-950 border border-emerald-500 rounded px-1.5 py-0.5 text-xs text-emerald-400 font-bold"
                            />
                          ) : (
                            <span>+${r.netAnnualCashFlowUsd.toLocaleString()}</span>
                          )}
                        </td>

                        {/* Cumulative Cash Flow */}
                        <td className={`py-2 px-3 font-bold ${r.cumulativeCashFlowUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {r.cumulativeCashFlowUsd >= 0 ? `+$${r.cumulativeCashFlowUsd.toLocaleString()}` : `-$${Math.abs(r.cumulativeCashFlowUsd).toLocaleString()}`}
                        </td>

                        {/* Adjust Actions */}
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {r.isOverridden ? (
                            <button
                              type="button"
                              onClick={() => handleResetYearOverride(r.year)}
                              className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[9px] font-bold"
                              title="Reset this row to calculated model"
                            >
                              ↺ Reset
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingLedger(true);
                                handleUpdateYearOverride(r.year, 'customNetAnnualUsd', r.netAnnualCashFlowUsd);
                              }}
                              className="text-[10px] text-slate-500 hover:text-amber-400"
                              title="Tweak year values"
                            >
                              ✏️ Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab: Autodesk Civil 3D & Granular BIM Simulation */}
      {activeTab === 'bim-import' && (
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6 max-w-7xl mx-auto w-full scrollbar-thin scrollbar-thumb-slate-800">
          <Civil3DAecVisualSim
            onCommitToTwin={(model) => {
              setSaveSuccessMsg(`🏛️ Committed Autodesk Civil 3D Model "${model.name}" to Property Digital Twin Layer!`);
              setTimeout(() => setSaveSuccessMsg(''), 4000);
            }}
            onExportLandXml={handleDownloadLandXml}
          />
        </div>
      )}

      {/* Tab 2: Property Digital Twin Layer */}
      {activeTab === 'property-twin' && (
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6 max-w-6xl mx-auto w-full">
          <header className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>🏛️</span> Santa Barbara Property Detail Layer — Digital Twins
            </h3>
            <p className="text-sm text-slate-400">
              Committed property detail layers containing complete architectural, electrical, stormwater, and Autodesk Civil 3D geometry.
            </p>
          </header>

          {committedProperties.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 space-y-4">
              <span className="text-4xl">📐</span>
              <h4 className="text-lg font-bold text-white">No Properties Committed Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Use the <strong>Click &amp; Drag Planner</strong> tab to size a solar canopy carport over a parking lot, verify 100% self-sufficiency, and click <strong>"Add Simulation to Property Detail Layer"</strong>.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('designer')}
                className="px-5 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Go to Canopy Planner →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {committedProperties.map((prop) => (
                <div key={prop.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-slate-700 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 bg-sky-950 text-sky-300 border border-sky-800 rounded text-[10px] font-mono font-bold">
                        APN: {prop.apn}
                      </span>
                      <h4 className="text-base font-black text-white mt-1">{prop.propertyName}</h4>
                      <p className="text-xs text-slate-400">{prop.buildingType}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-600 rounded-xl text-xs font-black">
                      {prop.selfSufficiencyPct}% Net-Zero
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Annual Solar Output:</span>
                      <span className="text-emerald-400 font-bold font-mono">{(prop.projectedAnnualKwh / 1000).toFixed(0)} MWh/yr</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Baseline Demand:</span>
                      <span className="text-sky-300 font-bold font-mono">{(prop.annualBaselineKwh / 1000).toFixed(0)} MWh/yr</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Tesla Megapack BESS:</span>
                      <span className="text-amber-400 font-bold font-mono">{prop.bessKWh} kWh</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Islanding Resilience:</span>
                      <span className="text-emerald-300 font-bold font-mono">{prop.microgridIslandingHours} hrs off-grid</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">CO₂ Offset:</span>
                      <span className="text-teal-300 font-bold font-mono">{prop.co2OffsetTons} Tons/yr</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Stormwater Harvested:</span>
                      <span className="text-cyan-400 font-bold font-mono">{(prop.stormwaterCapturedGalYr / 1000).toFixed(0)}k gal/yr</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500">
                      Committed: {new Date(prop.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadLandXml}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider"
                      >
                        LandXML ↗
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Autodesk Civil 3D LandXML & WordPress Integration */}
      {activeTab === 'civil3d-export' && (
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 max-w-5xl mx-auto w-full">
          <header className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>📐</span> Autodesk Civil 3D LandXML &amp; WordPress Plugin Integration
            </h3>
            <p className="text-sm text-slate-400">
              Direct LandXML 1.2 pipeline for Autodesk Civil 3D civil engineers and WordPress proposal shortcodes.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Civil 3D LandXML Exporter Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white text-lg">
                  📐
                </div>
                <div>
                  <h4 className="text-base font-black text-white">LandXML 1.2 Surface &amp; Alignment</h4>
                  <p className="text-xs text-slate-400">Industry-standard civil engineering exchange</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Exports exact 3D TIN surfaces, carport stanchion structural pier coordinates, California State Plane Zone V (EPSG:2229) Northing/Easting grid, and parking lane alignments ready for direct import into <strong>Autodesk Civil 3D 2024 / 2025</strong>.
              </p>

              <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-purple-300 border border-slate-800 space-y-1">
                <div>• Schema: LandXML-1.2</div>
                <div>• CoordSystem: NAD83 State Plane CA Zone V</div>
                <div>• Features: CgPoints, TIN Surface, Parcels</div>
              </div>

              <button
                type="button"
                onClick={handleDownloadLandXml}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
              >
                <span>📥</span> Download LandXML (.xml) Package
              </button>
            </div>

            {/* WordPress Plugin Proposal Shortcodes Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center text-white text-lg">
                  🌐
                </div>
                <div>
                  <h4 className="text-base font-black text-white">WordPress Plugin Shortcodes</h4>
                  <p className="text-xs text-slate-400">Embed proposal simulator anywhere in WordPress</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Include the live interactive solar canopy carport proposal generator on any page or client proposal post in WordPress using the new <strong>Civic Twin V.07</strong> plugin.
              </p>

              <div className="space-y-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-black uppercase tracking-wider text-sky-400 mb-1">
                    Solar Canopy Carport Simulator:
                  </div>
                  <code className="text-xs text-emerald-400 font-mono select-all">
                    [civic_twin_solar_canopy apn="{selectedLot.apn}"]
                  </code>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-black uppercase tracking-wider text-sky-400 mb-1">
                    Full Civil 3D Proposal Studio:
                  </div>
                  <code className="text-xs text-purple-400 font-mono select-all">
                    [civic_twin_civil3d_proposal]
                  </code>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleOpenPdfPreview}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition-all"
                  title="Real-time preview & export 2-page Executive Stakeholder Summary PDF"
                >
                  <span>📑</span> Preview Stakeholder PDF
                </button>
                <button
                  type="button"
                  onClick={handleDownloadProposalReport}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>📄</span> Proposal (.txt)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Canopy Placement & Aisle Alignment Guide */}
      {showAlignmentHelpModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 lg:p-8 space-y-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-xl">
                  📐
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Canopy Placement &amp; Alignment Guide</h3>
                  <p className="text-xs text-sky-400 font-mono">Drive Aisle Azimuth • 2D Euclidean Rotation • State Plane Feet</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAlignmentHelpModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-black transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                Parking stalls and drive aisles in commercial lots are oriented according to access roadways, municipal street grids, and coastal topography rather than true North. Here is how to achieve pixel-perfect alignment:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-sky-400 block">1. Repositioning on Parking Lot</span>
                  <p className="text-[11px] text-slate-400">
                    • <strong>Drag Sun Pin (☀️):</strong> Click &amp; hold the blue sun icon on the satellite map to drag the canopy directly over parking stalls.<br/>
                    • <strong>Single-Click:</strong> Click anywhere on the asphalt to instantly teleport the array center.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-amber-400 block">2. Aisle Auto-Alignment Preset</span>
                  <p className="text-[11px] text-slate-400">
                    Click <strong className="text-white">"Auto-Align with Parking Aisle"</strong> in the sidebar. For <strong>{selectedLot.name}</strong>, this automatically aligns the frame to <strong>{selectedLot.optimalRotationDeg}°</strong> ({selectedLot.driveAisleOrientation}).
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-emerald-400 block">3. Fine-Tuning Slider</span>
                  <p className="text-[11px] text-slate-400">
                    Use the <strong>0° to 360° slider</strong> in 1-degree increments. Watch the high-res satellite layer to align the canopy borders with painted striping.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-purple-400 block">4. Floating Map Controls</span>
                  <p className="text-[11px] text-slate-400">
                    Use the <strong>↺ -15°</strong> and <strong>↻ +15°</strong> buttons on the map's upper-left floating tool to rotate in 15° increments without scrolling.
                  </p>
                </div>
              </div>

              {/* Visual Diagram */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-sky-900/40 font-mono text-[10px] text-sky-300">
                <div className="text-slate-400 font-bold mb-1">Rotated Coordinate Output (Civil 3D State Plane Zone V):</div>
                <pre>{`North (0°) ↑
           |    Parking Aisle: ${selectedLot.optimalRotationDeg}°
           |       ↗
           |     /   [====================]  <-- Canopy Array Rotated ${canopy.rotationDeg || 0}°
           |   /     |  P1   P2   P3   P4 |      (Stanchion Piers CP-01...CP-08)
           | /       [====================]
           +-------------------------------→ East (90°)`}</pre>
              </div>

              <p className="text-[11px] text-slate-400">
                All 4 corner boundary coordinates (CP-01 through CP-04) and drilled-shaft foundation piers are mathematically rotated in survey feet and exported to the <strong>LandXML 1.2</strong> and <strong>Stakeholder PDF</strong> files.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setCanopy(prev => ({ ...prev, rotationDeg: selectedLot.optimalRotationDeg }));
                  setShowAlignmentHelpModal(false);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Apply Preset ({selectedLot.optimalRotationDeg}°)
              </button>
              <button
                type="button"
                onClick={() => setShowAlignmentHelpModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Stakeholder PDF Export & Metadata Verification Modal */}
      <PdfExportPreviewModal
        isOpen={showPdfPreviewModal}
        onClose={() => setShowPdfPreviewModal(false)}
        params={stakeholderPdfParams}
        onSuccessNotification={(msg) => {
          setSaveSuccessMsg(msg);
          setTimeout(() => setSaveSuccessMsg(''), 4500);
        }}
      />

    </div>
  );
};
