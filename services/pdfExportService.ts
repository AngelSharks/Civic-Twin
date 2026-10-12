/**
 * PDF Export Service for Autodesk Civil 3D & Solar Canopy Proposals
 * Generates an executive stakeholder summary PDF document with historical irradiance data,
 * energy yield simulations, financial ROI, and Civil 3D engineering specifications.
 */

import { jsPDF } from 'jspdf';
import { SolarSimulationSummary } from './solarSimulationService';
import { EconomicSimulationResult } from './solarEconomicService';
import { SolarCanopyConfig, PropertyDetailLayer, TwinMetadata } from '../types';

export interface StakeholderPdfParams {
  lotName: string;
  apn: string;
  address: string;
  buildingType: string;
  lotSqFt: number;
  existingStalls: number;
  canopy: SolarCanopyConfig;
  annualBaselineKwh: number;
  peakKwDemand: number;
  scenarioName: string;
  simulationSummary: SolarSimulationSummary;
  economicResult?: EconomicSimulationResult;
  microclimate: {
    lotName: string;
    elevationFt: number;
    coastalDistanceMiles: number;
    fogBurnoffTime: string;
    windCoolingFactor: number;
    albedoFactor: number;
  };
  structuralSteelTons: number;
  concretePiersCount: number;
  stormwaterCapturedGalYr: number;
  metadata?: TwinMetadata | null;
}

export function createStakeholderProposalDoc(params: StakeholderPdfParams): jsPDF {
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

  // Initialize letter size document (612 x 792 points)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const darkNavy = [15, 23, 42];      // #0f172a
  const slateBorder = [226, 232, 240]; // #e2e8f0
  const skyBlue = [2, 132, 199];      // #0284c7
  const amberGold = [217, 119, 6];    // #d97706
  const emeraldGreen = [5, 150, 105]; // #059669
  const textDark = [30, 41, 59];      // #1e293b
  const textMuted = [100, 116, 139];  // #64748b
  const lightBg = [248, 250, 252];    // #f8fafc

  // =========================================================================
  // PAGE 1: EXECUTIVE SUMMARY & CANOPY ENGINEERING SPECIFICATIONS
  // =========================================================================

  // Top Header Banner
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(0, 0, pageWidth, 80, 'F');

  // Accent Line under header
  doc.setFillColor(amberGold[0], amberGold[1], amberGold[2]);
  doc.rect(0, 77, pageWidth, 3, 'F');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('AUTODESK CIVIL 3D SOLAR CANOPY PROPOSAL', margin, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(147, 197, 253);
  doc.text('Executive Stakeholder Summary • 100% Net-Zero Energy Simulation • Civil 3D Digital Twin', margin, 46);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Angel Sharks Civic Twin | Edition V.07  •  Date: ${new Date().toLocaleDateString()}  •  Doc ID: CT-SOLAR-${apn.replace(/-/g, '')}`, margin, 62);

  // Status Badge on Top Right
  const isNetZero = simulationSummary.annualSelfSufficiencyPct >= 100;
  if (isNetZero) {
    doc.setFillColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  } else {
    doc.setFillColor(amberGold[0], amberGold[1], amberGold[2]);
  }
  doc.roundedRect(pageWidth - margin - 150, 22, 150, 36, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`${simulationSummary.annualSelfSufficiencyPct}% Net-Zero`, pageWidth - margin - 75, 38, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text(isNetZero ? 'SELF-SUFFICIENT VERIFIED' : 'PARTIAL SELF-SUFFICIENCY', pageWidth - margin - 75, 49, { align: 'center' });

  let cursorY = 96;

  // Project Location & Assessor Parcel Section (2 columns box)
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.roundedRect(margin, cursorY, contentWidth, 70, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`PROPERTY: ${lotName}`, margin + 12, cursorY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Address: ${address}`, margin + 12, cursorY + 31);
  doc.text(`Facility Type: ${buildingType}`, margin + 12, cursorY + 44);
  doc.text(`Assessor Parcel Number (APN): ${apn}`, margin + 12, cursorY + 57);

  // Column 2 of Project Box
  const col2X = margin + contentWidth * 0.55;
  doc.text(`Total Parking Lot Area: ${lotSqFt.toLocaleString()} sq ft (${existingStalls} stalls)`, col2X, cursorY + 31);
  doc.text(`Annual Baseline Demand: ${(annualBaselineKwh / 1000).toLocaleString()} MWh/yr (${annualBaselineKwh.toLocaleString()} kWh)`, col2X, cursorY + 44);
  doc.text(`Peak Coincident Demand: ${peakKwDemand} kW  |  Jurisdiction: City of Santa Barbara, CA`, col2X, cursorY + 57);

  cursorY += 80;

  // 6 KPI Scorecard Stat Cards
  const cardWidth = (contentWidth - 10) / 3;
  const cardHeight = 44;

  const scorecards = [
    {
      label: 'ANNUAL SOLAR YIELD',
      val: `${simulationSummary.annualSolarYieldMwh} MWh/yr`,
      sub: `${simulationSummary.annualSolarYieldKwh.toLocaleString()} kWh/year`,
      color: amberGold
    },
    {
      label: 'NET-ZERO BALANCE',
      val: `${simulationSummary.annualSelfSufficiencyPct}%`,
      sub: isNetZero ? '100% Net-Zero Energy' : 'Partial Self-Sufficiency',
      color: isNetZero ? emeraldGreen : amberGold
    },
    {
      label: 'SPECIFIC YIELD (PR)',
      val: `${simulationSummary.specificYieldKwhPerKwp} kWh/kWp`,
      sub: `PR: ${simulationSummary.systemPerformanceRatio}%  CF: ${simulationSummary.capacityFactorPct}%`,
      color: skyBlue
    },
    {
      label: 'AVOIDED UTILITY COST',
      val: `$${simulationSummary.annualAvoidedUtilityCostUsd.toLocaleString()}/yr`,
      sub: 'Clean Power Alliance TOU',
      color: emeraldGreen
    },
    {
      label: economicResult ? '20-YR NET SAVINGS & ROI' : '25-YR CLEAN GENERATION',
      val: economicResult
        ? `$${(economicResult.twentyYearNetSavingsUsd / 1000000).toFixed(2)}M Net`
        : `${simulationSummary.twentyFiveYearGenerationGwh} GWh`,
      sub: economicResult
        ? `IRR: ${economicResult.irrPercentage}%  |  Payback: ${economicResult.simplePaybackYears}y`
        : `$${(simulationSummary.twentyFiveYearSavingsUsd / 1000000).toFixed(2)}M Lifetime Savings`,
      color: [126, 34, 206]
    },
    {
      label: 'OUTAGE RESILIENCE',
      val: `${simulationSummary.microgridIslandingHours} Hours`,
      sub: `BESS: ${canopy.bessCapacityKWh} kWh Storage`,
      color: [8, 145, 178]
    }
  ];

  scorecards.forEach((card, idx) => {
    const rx = margin + (idx % 3) * (cardWidth + 5);
    const ry = cursorY + Math.floor(idx / 3) * (cardHeight + 5);

    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
    doc.roundedRect(rx, ry, cardWidth, cardHeight, 3, 3, 'FD');

    // Left colored accent border
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(rx, ry, 3.5, cardHeight, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(card.label, rx + 10, ry + 12);

    doc.setFontSize(11);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.val, rx + 10, ry + 26);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(card.sub, rx + 10, ry + 36);
  });

  cursorY += (cardHeight * 2) + 18;

  // Section 2: Autodesk Civil 3D Engineering & Electrical Specifications
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('AUTODESK CIVIL 3D ENGINEERING & MICROGRID ARCHITECTURE', margin, cursorY);
  cursorY += 12;

  // 2 Side-by-Side Tables/Panels
  const panelWidth = (contentWidth - 10) / 2;
  const panelHeight = 135;

  // Panel 1: Civil 3D Physical Structure
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.roundedRect(margin, cursorY, panelWidth, panelHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(skyBlue[0], skyBlue[1], skyBlue[2]);
  doc.text('1. Civil 3D Carport Physical Specifications', margin + 10, cursorY + 16);

  const canopyAreaSqFt = canopy.lengthFt * canopy.widthFt;
  const canopyCoveragePct = ((canopyAreaSqFt / lotSqFt) * 100).toFixed(1);

  const civilSpecs = [
    ['Canopy Footprint:', `${canopy.lengthFt}' L × ${canopy.widthFt}' W (${canopyAreaSqFt.toLocaleString()} sq ft)`],
    ['Parking Stalls Covered:', `${canopy.stallsCovered} Stalls (${canopyCoveragePct}% of lot area)`],
    ['Coordinate System:', 'NAD83 CA State Plane Zone V (EPSG: 2229)'],
    ['Structural Foundation:', `${concretePiersCount} Cast-In-Place Drilled Shaft Piers`],
    ['Structural Steel:', `${structuralSteelTons} Tons A992 Structural Steel Frame`],
    ['Stormwater Harvesting:', `${stormwaterCapturedGalYr.toLocaleString()} Gallons/Year via Gutters`],
    ['TIN Surface Grade:', 'LandXML 1.2 Proposed Canopy Roof Surface']
  ];

  let specY = cursorY + 30;
  civilSpecs.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(k, margin + 10, specY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(v, margin + panelWidth - 10, specY, { align: 'right' });
    specY += 14;
  });

  // Panel 2: Electrical Microgrid & BESS
  const panel2X = margin + panelWidth + 10;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.roundedRect(panel2X, cursorY, panelWidth, panelHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(amberGold[0], amberGold[1], amberGold[2]);
  doc.text('2. Photovoltaic & Energy Storage (BESS)', panel2X + 10, cursorY + 16);

  const elecSpecs = [
    ['PV Module Technology:', '550W Mono-PERC Bifacial Glass-on-Glass'],
    ['Tilt Angle & Azimuth:', `${canopy.tiltAngle}° Tilt  |  ${canopy.azimuthDeg}° (True South)`],
    ['Bifacial Asphalt Boost:', '+8.5% Albedo Ground Reflectance Gain'],
    ['Tesla Megapack BESS:', `${canopy.bessCapacityKWh} kWh Lithium-Iron-Phosphate`],
    ['Peak Shaving Dispatch:', 'Automated 4 PM – 9 PM On-Peak Shaving'],
    ['EV Charging Stations:', `${canopy.evChargersCount} Dual-Port Stanchion Chargers`],
    ['Levelized Cost (LCOE):', `$${simulationSummary.lcoeUsdPerKwh} / kWh turnkey installed`]
  ];

  specY = cursorY + 30;
  elecSpecs.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(k, panel2X + 10, specY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(v, panel2X + panelWidth - 10, specY, { align: 'right' });
    specY += 14;
  });

  cursorY += panelHeight + 18;

  // Section 3: Environmental Sustainability & Carbon Offsets
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('ENVIRONMENTAL IMPACT & ESG CARBON ABATEMENT', margin, cursorY);
  cursorY += 12;

  // ESG Callout Box
  doc.setFillColor(240, 253, 244); // light green bg
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, cursorY, contentWidth, 54, 4, 4, 'FD');

  const esgItems = [
    { label: 'Annual CO2 Abatement', val: `${simulationSummary.annualCo2OffsetMetricTons} MT CO2e`, sub: 'California Grid Factor' },
    { label: '25-Yr Lifetime Offset', val: `${(simulationSummary.annualCo2OffsetMetricTons * 25).toLocaleString()} MT`, sub: 'Zero Emission Generation' },
    { label: 'Equivalent Trees Planted', val: `${simulationSummary.equivalentTreesPlanted.toLocaleString()}`, sub: 'Mature Urban Canopy' },
    { label: 'Barrels of Oil Avoided', val: `${simulationSummary.equivalentBarrelsOfOil.toLocaleString()}`, sub: 'Fossil Fuels Displaced' }
  ];

  const esgColWidth = contentWidth / 4;
  esgItems.forEach((esg, idx) => {
    const ex = margin + idx * esgColWidth;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(esg.label, ex + 12, cursorY + 16);

    doc.setFontSize(12);
    doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.text(esg.val, ex + 12, cursorY + 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(esg.sub, ex + 12, cursorY + 44);
  });

  cursorY += 66;

  // Historical Climate Calibration Callout
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.roundedRect(margin, cursorY, contentWidth, 48, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(amberGold[0], amberGold[1], amberGold[2]);
  doc.text('HISTORICAL SOLAR DATASET CALIBRATION', margin + 10, cursorY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`• Climate Scenario: ${scenarioName}`, margin + 10, cursorY + 26);
  doc.text(`• Microclimate Station: ${microclimate.lotName} (Elevation: ${microclimate.elevationFt} ft MSL, Coastal Dist: ${microclimate.coastalDistanceMiles} mi)`, margin + 10, cursorY + 38);
  doc.text(`• Morning Marine Fog Clearance: ${microclimate.fogBurnoffTime}  |  Afternoon Sea-Breeze Cooling: +${((microclimate.windCoolingFactor - 1) * 100).toFixed(1)}%`, margin + contentWidth * 0.52, cursorY + 26);
  doc.text(`• Southern California Edison Tariff: Blended Clean Power Alliance Commercial Rate (~$0.285/kWh)`, margin + contentWidth * 0.52, cursorY + 38);

  // Footer Page 1
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Civic Twin • Autodesk Civil 3D Solar Canopy Proposal Studio • Page 1 of 2', margin, pageHeight - 16);
  doc.text('Official Proposal Document • LandXML 1.2 Exchange Compatible', pageWidth - margin, pageHeight - 16, { align: 'right' });

  // =========================================================================
  // PAGE 2: 12-MONTH HISTORICAL IRRADIANCE LEDGER & FINANCIAL ANALYSIS
  // =========================================================================
  doc.addPage();

  // Page 2 Top Mini-Banner
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(0, 0, pageWidth, 50, 'F');
  doc.setFillColor(amberGold[0], amberGold[1], amberGold[2]);
  doc.rect(0, 48, pageWidth, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('HISTORICAL SOLAR IRRADIANCE & MONTHLY ENERGY YIELD LEDGER', margin, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Facility: ${lotName} (APN: ${apn}) • 8,760 Energy Balance Ledger`, margin, 39);

  let p2Y = 66;

  // 12-Month Historical Solar Data Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('12-MONTH HISTORICAL IRRADIANCE & PRODUCTION BREAKDOWN', margin, p2Y);
  p2Y += 10;

  // Table Column Definitions
  const columns = [
    { title: 'Month', width: 44, align: 'left' },
    { title: 'Days', width: 30, align: 'right' },
    { title: 'GHI (kWh/m²)', width: 62, align: 'right' },
    { title: 'POA (kWh/m²)', width: 62, align: 'right' },
    { title: 'Cell (°C)', width: 42, align: 'right' },
    { title: 'Solar (MWh)', width: 60, align: 'right' },
    { title: 'Demand (MWh)', width: 64, align: 'right' },
    { title: 'Net Energy', width: 60, align: 'right' },
    { title: 'Self-Suff.', width: 50, align: 'right' },
    { title: 'Savings ($)', width: 66, align: 'right' }
  ];

  // Table Header
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(margin, p2Y, contentWidth, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  let curX = margin;
  columns.forEach(col => {
    const textX = col.align === 'right' ? curX + col.width - 4 : curX + 4;
    doc.text(col.title, textX, p2Y + 12, { align: col.align as any });
    curX += col.width;
  });

  p2Y += 18;

  // Table Data Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  simulationSummary.monthlyBreakdown.forEach((row, i) => {
    const isAlt = i % 2 === 1;
    doc.setFillColor(isAlt ? 248 : 255, isAlt ? 250 : 255, isAlt ? 252 : 255);
    doc.rect(margin, p2Y, contentWidth, 15, 'F');

    // Bottom subtle border
    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
    doc.line(margin, p2Y + 15, margin + contentWidth, p2Y + 15);

    curX = margin;
    const rowValues = [
      row.month,
      row.days.toString(),
      row.ghi.toFixed(2),
      row.poaIrradiance.toFixed(2),
      `${row.effectiveCellTempC.toFixed(0)}°C`,
      row.monthlySolarYieldMwh.toFixed(1),
      row.baselineDemandMwh.toFixed(1),
      row.netEnergyBalanceKwh >= 0 
        ? `+${(row.netEnergyBalanceKwh / 1000).toFixed(1)}` 
        : `${(row.netEnergyBalanceKwh / 1000).toFixed(1)}`,
      `${row.selfSufficiencyPct}%`,
      `$${row.avoidedUtilityCostUsd.toLocaleString()}`
    ];

    rowValues.forEach((val, cIdx) => {
      const col = columns[cIdx];
      const textX = col.align === 'right' ? curX + col.width - 4 : curX + 4;

      if (cIdx === 7) {
        // Net energy color
        if (row.netEnergyBalanceKwh >= 0) {
          doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
        } else {
          doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        }
      } else if (cIdx === 8) {
        // Self sufficiency color
        if (row.selfSufficiencyPct >= 100) {
          doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
        } else {
          doc.setTextColor(amberGold[0], amberGold[1], amberGold[2]);
        }
      } else {
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      }

      doc.text(val, textX, p2Y + 10.5, { align: col.align as any });
      curX += col.width;
    });

    p2Y += 15;
  });

  // Table Annual Totals Row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, p2Y, contentWidth, 18, 'F');
  doc.setDrawColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.setLineWidth(1);
  doc.line(margin, p2Y, margin + contentWidth, p2Y);
  doc.line(margin, p2Y + 18, margin + contentWidth, p2Y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);

  curX = margin;
  const totalRow = [
    'ANNUAL',
    '365',
    '5.42 avg',
    '5.82 avg',
    '16.8°C',
    `${simulationSummary.annualSolarYieldMwh} MWh`,
    `${simulationSummary.annualBaselineDemandMwh} MWh`,
    simulationSummary.netAnnualBalanceKwh >= 0 
      ? `+${(simulationSummary.netAnnualBalanceKwh / 1000).toFixed(1)} MWh`
      : `${(simulationSummary.netAnnualBalanceKwh / 1000).toFixed(1)} MWh`,
    `${simulationSummary.annualSelfSufficiencyPct}%`,
    `$${simulationSummary.annualAvoidedUtilityCostUsd.toLocaleString()}`
  ];

  totalRow.forEach((val, cIdx) => {
    const col = columns[cIdx];
    const textX = col.align === 'right' ? curX + col.width - 4 : curX + 4;
    doc.text(val, textX, p2Y + 12, { align: col.align as any });
    curX += col.width;
  });

  p2Y += 32;

  // Diurnal 24-Hour Battery Storage & Demand Shaving Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('24-HOUR DIURNAL SOLAR PRODUCTION & BATTERY PEAK SHAVING', margin, p2Y);
  p2Y += 10;

  // 3 Explanatory Callout Cards
  const dispatchWidth = (contentWidth - 10) / 3;
  const dispatchHeight = 82;

  const dispatchCards = [
    {
      title: 'Solar Noon Harvest (10am–3pm)',
      body: `Canopy produces up to ${simulationSummary.peakGenerationKw} kW at solar noon. Surplus power charges the ${canopy.bessCapacityKWh} kWh Tesla Megapack and powers dual-port EV chargers directly.`,
      color: amberGold
    },
    {
      title: '4 PM – 9 PM Peak Demand Shaving',
      body: 'Battery storage dispatches automatically during high-cost SCE Clean Power Alliance peak window, slashing expensive commercial coincident demand charges.',
      color: [234, 88, 12]
    },
    {
      title: 'Emergency Islanding Resilience',
      body: `During PSPS wildfire shutdowns or grid outages, the microgrid provides ${simulationSummary.microgridIslandingHours} continuous hours of critical campus operations.`,
      color: skyBlue
    }
  ];

  dispatchCards.forEach((c, idx) => {
    const cx = margin + idx * (dispatchWidth + 5);
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
    doc.roundedRect(cx, p2Y, dispatchWidth, dispatchHeight, 4, 4, 'FD');

    doc.setFillColor(c.color[0], c.color[1], c.color[2]);
    doc.rect(cx, p2Y, dispatchWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.title, cx + 8, p2Y + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const splitBody = doc.splitTextToSize(c.body, dispatchWidth - 16);
    doc.text(splitBody, cx + 8, p2Y + 28);
  });

  p2Y += dispatchHeight + 16;

  // Stakeholder Approvals & Sign-off Signature Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('STAKEHOLDER VERIFICATION & PROPOSAL ENDORSEMENT', margin, p2Y);
  p2Y += 10;

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.roundedRect(margin, p2Y, contentWidth, 80, 4, 4, 'FD');

  const sigWidth = (contentWidth - 30) / 3;
  const sigs = [
    { title: 'CIVIL ENGINEERING / AUTODESK 3D', role: 'Registered Professional Engineer (PE)' },
    { title: 'PROPERTY OWNER / ASSET MANAGER', role: 'Facility Authorization & Site Lease' },
    { title: 'MUNICIPAL / PUBLIC WORKS', role: 'City of Santa Barbara Permitting' }
  ];

  sigs.forEach((sig, idx) => {
    const sx = margin + 10 + idx * (sigWidth + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(sig.title, sx, p2Y + 16);

    // Signature line
    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
    doc.line(sx, p2Y + 46, sx + sigWidth - 10, p2Y + 46);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`Authorized Signatory: ___________________`, sx, p2Y + 58);
    doc.text(`Title: ${sig.role}`, sx, p2Y + 68);
  });

  // Footer Page 2
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Civic Twin • Autodesk Civil 3D Solar Canopy Proposal Studio • Page 2 of 2', margin, pageHeight - 16);
  doc.text('Official Proposal Document • LandXML 1.2 Exchange Compatible', pageWidth - margin, pageHeight - 16, { align: 'right' });

  return doc;
}

export function generateStakeholderProposalPdf(params: StakeholderPdfParams): void {
  const doc = createStakeholderProposalDoc(params);
  const safeLot = params.apn.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Civil3D_Solar_Proposal_${safeLot}_Stakeholder_Summary.pdf`);
}

export function generateStakeholderProposalPdfBlob(params: StakeholderPdfParams): Blob {
  const doc = createStakeholderProposalDoc(params);
  return doc.output('blob');
}

export function generateStakeholderProposalPdfDataUri(params: StakeholderPdfParams): string {
  const doc = createStakeholderProposalDoc(params);
  return doc.output('datauristring');
}
