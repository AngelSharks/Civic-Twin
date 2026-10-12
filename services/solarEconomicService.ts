/**
 * 20-Year Economic Impact & Return on Investment (ROI) Service
 * Calibrated for Santa Barbara, California (Clean Power Alliance / SCE Commercial Tariffs)
 * Integrates Federal IRA ITC, MACRS, SGIP, Demand Shaving, and California Carbon Offset Markets.
 */

export interface UtilityTariffPreset {
  id: string;
  name: string;
  utility: string;
  blendedRatePerKwh: number;
  demandChargePerKwMonth: number;
  annualEscalationRatePct: number;
  description: string;
}

export const UTILITY_TARIFF_PRESETS: UtilityTariffPreset[] = [
  {
    id: 'cpa-tou-8-sec',
    name: 'Clean Power Alliance / SCE TOU-8-Sec (Large Commercial)',
    utility: 'Clean Power Alliance (100% Green Power)',
    blendedRatePerKwh: 0.315,
    demandChargePerKwMonth: 22.40,
    annualEscalationRatePct: 4.0,
    description: 'Standard institutional & large commercial tariff for SBCC, County Administration, and major civic facilities.'
  },
  {
    id: 'cpa-tou-gs-3',
    name: 'Clean Power Alliance / SCE TOU-GS-3 (Medium Commercial)',
    utility: 'Clean Power Alliance',
    blendedRatePerKwh: 0.345,
    demandChargePerKwMonth: 19.80,
    annualEscalationRatePct: 3.8,
    description: 'Commercial parking garages, downtown plazas (Paseo Nuevo, Granada, Waterfront).'
  },
  {
    id: 'sce-standard-commercial',
    name: 'Southern California Edison TOU-GS-2 (General Service)',
    utility: 'SCE Bundled Service',
    blendedRatePerKwh: 0.285,
    demandChargePerKwMonth: 17.50,
    annualEscalationRatePct: 3.5,
    description: 'Baseline commercial service without municipal Community Choice Aggregation premium.'
  }
];

export interface CarbonCreditPreset {
  id: string;
  name: string;
  pricePerMetricTonUsd: number;
  annualPriceEscalationPct: number;
  marketType: 'compliance' | 'voluntary' | 'lcfs';
  description: string;
}

export const CARBON_CREDIT_PRESETS: CarbonCreditPreset[] = [
  {
    id: 'ca-compliance-cap-trade',
    name: 'California Cap-and-Trade / CARB Compliance Offsets',
    pricePerMetricTonUsd: 36.50,
    annualPriceEscalationPct: 3.0,
    marketType: 'compliance',
    description: 'Official California Air Resources Board (CARB) compliance market trading under AB 32 / SB 32.'
  },
  {
    id: 'vcm-verified-standard',
    name: 'Voluntary Carbon Market (Verra / Gold Standard VCS)',
    pricePerMetricTonUsd: 22.00,
    annualPriceEscalationPct: 2.5,
    marketType: 'voluntary',
    description: 'Corporate ESG voluntary procurement for certified clean solar displacement.'
  },
  {
    id: 'ca-lcfs-ev-charging',
    name: 'California Low Carbon Fuel Standard (LCFS) + Clean Energy',
    pricePerMetricTonUsd: 68.00,
    annualPriceEscalationPct: 2.0,
    marketType: 'lcfs',
    description: 'High-value credits for solar-paired EV charging infrastructure under California LCFS.'
  }
];

export interface AnnualCashFlowOverride {
  year: number;
  solarGenerationKwh?: number;
  gridElectricityRateUsd?: number;
  avoidedUtilityBillUsd?: number;
  demandChargeSavingsUsd?: number;
  carbonCreditRevenueUsd?: number;
  evChargingRevenueUsd?: number;
  omExpensesUsd?: number;
  customNetAnnualUsd?: number;
  isOverridden?: boolean;
  notes?: string;
}

export interface LedgerScenarioPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  utilityEscalationPct: number;
  carbonPriceEscalationPct: number;
  demandSavingsMultiplier: number;
  omInflationMultiplier: number;
  inverterRefreshYears: number[];
}

export const LEDGER_SCENARIO_PRESETS: LedgerScenarioPreset[] = [
  {
    id: 'baseline',
    name: 'Clean Power Alliance Standard (Baseline)',
    description: 'CPUC-regulated 4.0% annual utility escalation, standard 0.5% PV degradation, standard $18/kW-yr O&M.',
    badge: 'Baseline CPA',
    utilityEscalationPct: 4.0,
    carbonPriceEscalationPct: 3.0,
    demandSavingsMultiplier: 1.0,
    omInflationMultiplier: 1.0,
    inverterRefreshYears: [10]
  },
  {
    id: 'high-inflation',
    name: 'High Utility Inflation (+6.0%/yr & +5.0% Carbon)',
    description: 'Accelerated grid tariff escalation reflecting California transmission grid modernization and wildfires.',
    badge: 'High Inflation (+6%)',
    utilityEscalationPct: 6.0,
    carbonPriceEscalationPct: 5.0,
    demandSavingsMultiplier: 1.15,
    omInflationMultiplier: 1.05,
    inverterRefreshYears: [10]
  },
  {
    id: 'severe-drought-demand',
    name: 'Extreme Summer Demand Peak Shaving (Aggressive BESS)',
    description: 'Elevated monthly demand charges ($28+/kW) with optimal Tesla Megapack peak dispatch saving an extra 25%.',
    badge: 'Peak Demand (+25%)',
    utilityEscalationPct: 4.5,
    carbonPriceEscalationPct: 3.5,
    demandSavingsMultiplier: 1.35,
    omInflationMultiplier: 1.0,
    inverterRefreshYears: [10]
  },
  {
    id: 'conservative-om',
    name: 'Conservative O&M Contingency (Mid-Life Overhaul)',
    description: 'Higher operating expenses (+25% reserve) with accelerated inverter refresh at Year 5 & Year 10.',
    badge: 'High O&M Reserve',
    utilityEscalationPct: 3.5,
    carbonPriceEscalationPct: 2.5,
    demandSavingsMultiplier: 0.95,
    omInflationMultiplier: 1.25,
    inverterRefreshYears: [5, 10]
  }
];

export interface EconomicModelInputs {
  // System Sizing
  dcRatingKw: number;
  annualSolarYieldKwhYear1: number;
  bessCapacityKwh: number;
  peakKwDemand: number;
  evChargersCount: number;
  stallsCovered: number;

  // Rate & Financial Settings
  tariffPresetId: string;
  customBlendedRate?: number;
  customDemandCharge?: number;
  utilityEscalationRatePct: number;

  carbonCreditPresetId: string;
  customCarbonPrice?: number;
  carbonPriceEscalationPct: number;

  // Incentives & Tax Options
  itcPercentagePct: number; // e.g. 30% or 40% (with IRA adders)
  isPublicEntityDirectPay: boolean; // Direct pay under IRA 6417
  applyMacrsDepreciation: boolean;
  sgipIncentivePerKwh: number; // e.g. $250/kWh for storage
  discountRatePct: number; // e.g. 6.0% for NPV calculation

  // Cost Assumptions ($/W and $/kWh)
  solarTurnkeyCostPerWatt: number; // default $3.25/Wdc
  bessInstalledCostPerKwh: number; // default $550/kWh
  evChargerCostPerPort: number; // default $3,800/port
  annualOmCostPerKwYear1: number; // default $18/kW/yr
  pvDegradationRatePct: number; // default 0.5%/yr
  projectionHorizonYears?: number; // e.g. 10, 20, 25 years (default: 10 or 20)

  // 10-Year Annual Variable Ledger Overrides
  annualOverrides?: Record<number, AnnualCashFlowOverride>;
}

export interface AnnualCashFlowRecord {
  year: number;
  solarGenerationKwh: number;
  gridElectricityRateUsd: number;
  avoidedUtilityBillUsd: number;
  demandChargeSavingsUsd: number;
  co2OffsetMetricTons: number;
  carbonCreditPriceUsd: number;
  carbonCreditRevenueUsd: number;
  evChargingRevenueUsd: number;
  totalGrossSavingsUsd: number;
  omExpensesUsd: number;
  netAnnualCashFlowUsd: number;
  discountedCashFlowUsd: number;
  cumulativeCashFlowUsd: number;
  isOverridden?: boolean;
  overrideNotes?: string;
}

export interface EconomicSimulationResult {
  // CapEx Breakdown
  grossSolarCapexUsd: number;
  bessCapexUsd: number;
  evChargingCapexUsd: number;
  civilAndInterconnectionCapexUsd: number;
  totalGrossCapexUsd: number;

  // Incentives
  federalItcBenefitUsd: number;
  macrsDepreciationTaxShieldUsd: number;
  sgipStorageIncentiveUsd: number;
  totalIncentivesUsd: number;
  netInitialInvestmentUsd: number;

  // Horizon & Lifecycle Totals
  projectionHorizonYears: number;
  totalGrossSavingsUsd: number;
  totalOmExpensesUsd: number;
  totalNetSavingsUsd: number;
  totalGenerationKwh: number;
  totalCo2OffsetMetricTons: number;
  totalCarbonCreditRevenueUsd: number;

  // 10-Year Annual Variable Ledger Metrics
  tenYearGrossSavingsUsd: number;
  tenYearOmExpensesUsd: number;
  tenYearNetSavingsUsd: number;
  tenYearGenerationKwh: number;
  tenYearCo2OffsetMetricTons: number;
  tenYearCarbonCreditRevenueUsd: number;
  tenYearPaybackYears: number;
  tenYearIrrPercentage: number;
  tenYearNpvUsd: number;
  hasUserOverrides: boolean;
  overriddenYearsCount: number;

  // Backwards compatibility aliases (20-Year)
  twentyYearGrossSavingsUsd: number;
  twentyYearOmExpensesUsd: number;
  twentyYearNetSavingsUsd: number;
  twentyYearGenerationKwh: number;
  twentyYearCo2OffsetMetricTons: number;
  twentyYearCarbonCreditRevenueUsd: number;

  // ROI Metrics
  simplePaybackYears: number;
  discountedPaybackYears: number;
  irrPercentage: number;
  npvUsd: number;
  roiMultiplier: number;
  lcoeUsdPerKwh: number;
  blendedUtilityBenchmarkRateUsd: number;

  // Annual Schedule
  cashFlowSchedule: AnnualCashFlowRecord[];
}

export function runEconomicSimulation(inputs: EconomicModelInputs): EconomicSimulationResult {
  const {
    dcRatingKw,
    annualSolarYieldKwhYear1,
    bessCapacityKwh,
    peakKwDemand,
    evChargersCount,
    tariffPresetId,
    customBlendedRate,
    customDemandCharge,
    utilityEscalationRatePct,
    carbonCreditPresetId,
    customCarbonPrice,
    carbonPriceEscalationPct,
    itcPercentagePct,
    isPublicEntityDirectPay,
    applyMacrsDepreciation,
    sgipIncentivePerKwh,
    discountRatePct,
    solarTurnkeyCostPerWatt,
    bessInstalledCostPerKwh,
    evChargerCostPerPort,
    annualOmCostPerKwYear1,
    pvDegradationRatePct
  } = inputs;

  const tariff = UTILITY_TARIFF_PRESETS.find(t => t.id === tariffPresetId) || UTILITY_TARIFF_PRESETS[0];
  const carbonPreset = CARBON_CREDIT_PRESETS.find(c => c.id === carbonCreditPresetId) || CARBON_CREDIT_PRESETS[0];

  const blendedRate = customBlendedRate ?? tariff.blendedRatePerKwh;
  const demandCharge = customDemandCharge ?? tariff.demandChargePerKwMonth;
  const carbonPrice = customCarbonPrice ?? carbonPreset.pricePerMetricTonUsd;

  // 1. Gross Capital Expenditure (CapEx)
  const systemWatts = dcRatingKw * 1000;
  const grossSolarCapexUsd = Math.round(systemWatts * solarTurnkeyCostPerWatt);
  const bessCapexUsd = Math.round(bessCapacityKwh * bessInstalledCostPerKwh);
  const evChargingCapexUsd = Math.round(evChargersCount * evChargerCostPerPort);
  const civilAndInterconnectionCapexUsd = Math.round(systemWatts * 0.45); // Structural foundations & utility interconnection
  const totalGrossCapexUsd = grossSolarCapexUsd + bessCapexUsd + evChargingCapexUsd + civilAndInterconnectionCapexUsd;

  // 2. Incentives & Tax Credits
  // Federal ITC applies to Solar + BESS (Section 48 / 6417 direct pay)
  const itcEligibleBasis = grossSolarCapexUsd + bessCapexUsd + civilAndInterconnectionCapexUsd;
  const federalItcBenefitUsd = Math.round(itcEligibleBasis * (itcPercentagePct / 100));

  // SGIP for Battery Energy Storage
  const sgipStorageIncentiveUsd = Math.round(bessCapacityKwh * sgipIncentivePerKwh);

  // MACRS 5-year accelerated depreciation tax shield (approx 26% net present tax benefit if for-profit taxable entity)
  const macrsBasis = Math.max(0, itcEligibleBasis - (federalItcBenefitUsd * 0.5));
  const macrsDepreciationTaxShieldUsd = (!isPublicEntityDirectPay && applyMacrsDepreciation)
    ? Math.round(macrsBasis * 0.25)
    : 0;

  const totalIncentivesUsd = federalItcBenefitUsd + sgipStorageIncentiveUsd + macrsDepreciationTaxShieldUsd;
  const netInitialInvestmentUsd = Math.max(0, totalGrossCapexUsd - totalIncentivesUsd);

  // 3. Demand Charge Reduction via BESS
  // A properly sized BESS shaves 25% - 40% of peak monthly kW demand
  const effectiveDemandShavedKw = bessCapacityKwh > 0
    ? Math.min(peakKwDemand * 0.35, bessCapacityKwh / 4)
    : 0;
  const year1MonthlyDemandSavings = effectiveDemandShavedKw * demandCharge;
  const year1AnnualDemandSavings = year1MonthlyDemandSavings * 12;

  // 4. Multi-Year Cash Flow Projection
  const projectionHorizonYears = Math.max(1, Math.min(35, inputs.projectionHorizonYears || 20));
  const cashFlowSchedule: AnnualCashFlowRecord[] = [];
  let cumulativeCashFlow = -netInitialInvestmentUsd;
  let totalGrossSavings = 0;
  let totalOmExpenses = 0;
  let totalGeneration = 0;
  let totalCo2Offset = 0;
  let totalCarbonRevenue = 0;
  let simplePaybackYears = projectionHorizonYears;
  let discountedPaybackYears = projectionHorizonYears;
  let foundSimplePayback = false;
  let foundDiscountedPayback = false;
  let cumulativeDiscounted = -netInitialInvestmentUsd;

  let tenYearGrossSavings = 0;
  let tenYearOmExpenses = 0;
  let tenYearNetSavings = 0;
  let tenYearGeneration = 0;
  let tenYearCo2Offset = 0;
  let tenYearCarbonRevenue = 0;
  let overriddenYearsCount = 0;

  for (let year = 1; year <= projectionHorizonYears; year++) {
    const userOverride = inputs.annualOverrides && inputs.annualOverrides[year];
    const isOverridden = Boolean(userOverride && userOverride.isOverridden !== false);
    if (isOverridden) {
      overriddenYearsCount++;
    }

    // Solar generation with annual PV degradation (or user override)
    const degradationMultiplier = Math.pow(1 - (pvDegradationRatePct / 100), year - 1);
    const calculatedSolarGen = Math.round(annualSolarYieldKwhYear1 * degradationMultiplier);
    const solarGen = (isOverridden && userOverride?.solarGenerationKwh !== undefined)
      ? userOverride.solarGenerationKwh
      : calculatedSolarGen;
    totalGeneration += solarGen;

    // Escalated utility rate (or user override)
    const utilityEscalator = Math.pow(1 + (utilityEscalationRatePct / 100), year - 1);
    const calculatedUtilityRate = blendedRate * utilityEscalator;
    const currentUtilityRate = (isOverridden && userOverride?.gridElectricityRateUsd !== undefined)
      ? userOverride.gridElectricityRateUsd
      : calculatedUtilityRate;

    // Avoided utility bill
    const calculatedAvoidedBill = Math.round(solarGen * currentUtilityRate);
    const avoidedUtilityBill = (isOverridden && userOverride?.avoidedUtilityBillUsd !== undefined)
      ? userOverride.avoidedUtilityBillUsd
      : calculatedAvoidedBill;

    // Escalated demand charge savings
    const calculatedDemandSavings = Math.round(year1AnnualDemandSavings * utilityEscalator);
    const currentDemandSavings = (isOverridden && userOverride?.demandChargeSavingsUsd !== undefined)
      ? userOverride.demandChargeSavingsUsd
      : calculatedDemandSavings;

    // Carbon offset credit revenue
    // California grid factor: ~0.00022 MT CO2e / kWh
    const currentCo2Offset = solarGen * 0.00022;
    totalCo2Offset += currentCo2Offset;

    const carbonEscalator = Math.pow(1 + (carbonPriceEscalationPct / 100), year - 1);
    const currentCarbonPrice = carbonPrice * carbonEscalator;
    const calculatedCarbonRevenue = Math.round(currentCo2Offset * currentCarbonPrice);
    const carbonRevenue = (isOverridden && userOverride?.carbonCreditRevenueUsd !== undefined)
      ? userOverride.carbonCreditRevenueUsd
      : calculatedCarbonRevenue;
    totalCarbonRevenue += carbonRevenue;

    // EV Charging utilization revenue (approx $0.15/kWh margin on commercial charging)
    const calculatedEvRevenue = evChargersCount > 0
      ? Math.round(evChargersCount * 365 * 18 * 0.12 * utilityEscalator)
      : 0;
    const evRevenue = (isOverridden && userOverride?.evChargingRevenueUsd !== undefined)
      ? userOverride.evChargingRevenueUsd
      : calculatedEvRevenue;

    const totalGross = avoidedUtilityBill + currentDemandSavings + carbonRevenue + evRevenue;
    totalGrossSavings += totalGross;

    // O&M with 2.5% inflation, plus Year 10 inverter/string maintenance refresh ($35/kW)
    const omEscalator = Math.pow(1.025, year - 1);
    let calculatedOmExpense = Math.round(dcRatingKw * annualOmCostPerKwYear1 * omEscalator);
    if (year === 10) {
      calculatedOmExpense += Math.round(dcRatingKw * 35); // 10-year inverter refresh reserve
    }
    const omExpense = (isOverridden && userOverride?.omExpensesUsd !== undefined)
      ? userOverride.omExpensesUsd
      : calculatedOmExpense;
    totalOmExpenses += omExpense;

    const netAnnual = (isOverridden && userOverride?.customNetAnnualUsd !== undefined)
      ? userOverride.customNetAnnualUsd
      : (totalGross - omExpense);
    cumulativeCashFlow += netAnnual;

    // Discounted cash flow for NPV calculation
    const discountMultiplier = Math.pow(1 + (discountRatePct / 100), year);
    const discountedNet = netAnnual / discountMultiplier;
    cumulativeDiscounted += discountedNet;

    // Track 10-year milestone totals
    if (year <= 10) {
      tenYearGrossSavings += totalGross;
      tenYearOmExpenses += omExpense;
      tenYearNetSavings += netAnnual;
      tenYearGeneration += solarGen;
      tenYearCo2Offset += currentCo2Offset;
      tenYearCarbonRevenue += carbonRevenue;
    }

    // Simple payback tracking
    if (!foundSimplePayback && cumulativeCashFlow >= 0) {
      const prevCumulative = cumulativeCashFlow - netAnnual;
      const fraction = prevCumulative < 0 && netAnnual > 0 ? Math.abs(prevCumulative) / netAnnual : 0;
      simplePaybackYears = Number(((year - 1) + fraction).toFixed(1));
      foundSimplePayback = true;
    }

    // Discounted payback tracking
    if (!foundDiscountedPayback && cumulativeDiscounted >= 0) {
      const prevDisc = cumulativeDiscounted - discountedNet;
      const frac = prevDisc < 0 && discountedNet > 0 ? Math.abs(prevDisc) / discountedNet : 0;
      discountedPaybackYears = Number(((year - 1) + frac).toFixed(1));
      foundDiscountedPayback = true;
    }

    cashFlowSchedule.push({
      year,
      solarGenerationKwh: solarGen,
      gridElectricityRateUsd: Number(currentUtilityRate.toFixed(4)),
      avoidedUtilityBillUsd: avoidedUtilityBill,
      demandChargeSavingsUsd: currentDemandSavings,
      co2OffsetMetricTons: Number(currentCo2Offset.toFixed(1)),
      carbonCreditPriceUsd: Number(currentCarbonPrice.toFixed(2)),
      carbonCreditRevenueUsd: carbonRevenue,
      evChargingRevenueUsd: evRevenue,
      totalGrossSavingsUsd: totalGross,
      omExpensesUsd: omExpense,
      netAnnualCashFlowUsd: netAnnual,
      discountedCashFlowUsd: Math.round(discountedNet),
      cumulativeCashFlowUsd: Math.round(cumulativeCashFlow),
      isOverridden,
      overrideNotes: userOverride?.notes || (isOverridden ? 'User custom adjusted value' : undefined)
    });
  }

  const twentyYearNetSavingsUsd = totalGrossSavings - totalOmExpenses;

  // 5. Internal Rate of Return (IRR) calculation via binary search approximation
  let irrPercentage = 0;
  try {
    let low = -0.5;
    let high = 1.0;
    for (let iter = 0; iter < 40; iter++) {
      const mid = (low + high) / 2;
      let npvTest = -netInitialInvestmentUsd;
      for (const record of cashFlowSchedule) {
        npvTest += record.netAnnualCashFlowUsd / Math.pow(1 + mid, record.year);
      }
      if (npvTest > 0) {
        low = mid;
      } else {
        high = mid;
      }
    }
    irrPercentage = Number(((low + high) / 2 * 100).toFixed(1));
  } catch (e) {
    irrPercentage = 12.5;
  }

  // 6. Net Present Value (NPV)
  let npvUsd = -netInitialInvestmentUsd;
  for (const record of cashFlowSchedule) {
    npvUsd += record.netAnnualCashFlowUsd / Math.pow(1 + (discountRatePct / 100), record.year);
  }
  npvUsd = Math.round(npvUsd);

  // 7. Levelized Cost of Energy (LCOE)
  // LCOE = (Net Initial Investment + NPV of O&M) / (Discounted 20-Yr Generation)
  let npvOm = 0;
  let discountedKwh = 0;
  for (const record of cashFlowSchedule) {
    const disc = Math.pow(1 + (discountRatePct / 100), record.year);
    npvOm += record.omExpensesUsd / disc;
    discountedKwh += record.solarGenerationKwh / disc;
  }
  const lcoeUsdPerKwh = discountedKwh > 0
    ? Number(((netInitialInvestmentUsd + npvOm) / discountedKwh).toFixed(3))
    : 0.055;

  const roiMultiplier = netInitialInvestmentUsd > 0
    ? Number((twentyYearNetSavingsUsd / netInitialInvestmentUsd).toFixed(2))
    : 5.0;

  // 10-Year specific metrics for variable user-adjusted ledger
  let tenYearNpvUsd = -netInitialInvestmentUsd;
  for (const record of cashFlowSchedule.filter(r => r.year <= 10)) {
    tenYearNpvUsd += record.netAnnualCashFlowUsd / Math.pow(1 + (discountRatePct / 100), record.year);
  }
  tenYearNpvUsd = Math.round(tenYearNpvUsd);

  let tenYearIrrPercentage = 0;
  try {
    let low = -0.5;
    let high = 1.0;
    const tenYearRecords = cashFlowSchedule.filter(r => r.year <= 10);
    for (let iter = 0; iter < 40; iter++) {
      const mid = (low + high) / 2;
      let npvTest = -netInitialInvestmentUsd;
      for (const record of tenYearRecords) {
        npvTest += record.netAnnualCashFlowUsd / Math.pow(1 + mid, record.year);
      }
      if (npvTest > 0) {
        low = mid;
      } else {
        high = mid;
      }
    }
    tenYearIrrPercentage = Number(((low + high) / 2 * 100).toFixed(1));
  } catch (e) {
    tenYearIrrPercentage = irrPercentage;
  }

  const tenYearPaybackYears = simplePaybackYears <= 10 ? simplePaybackYears : 10;

  return {
    grossSolarCapexUsd,
    bessCapexUsd,
    evChargingCapexUsd,
    civilAndInterconnectionCapexUsd,
    totalGrossCapexUsd,
    federalItcBenefitUsd,
    macrsDepreciationTaxShieldUsd,
    sgipStorageIncentiveUsd,
    totalIncentivesUsd,
    netInitialInvestmentUsd,
    projectionHorizonYears,
    totalGrossSavingsUsd: Math.round(totalGrossSavings),
    totalOmExpensesUsd: Math.round(totalOmExpenses),
    totalNetSavingsUsd: Math.round(twentyYearNetSavingsUsd),
    totalGenerationKwh: Math.round(totalGeneration),
    totalCo2OffsetMetricTons: Math.round(totalCo2Offset),
    totalCarbonCreditRevenueUsd: Math.round(totalCarbonRevenue),

    // 10-Year Annual Variable Ledger Metrics
    tenYearGrossSavingsUsd: Math.round(tenYearGrossSavings),
    tenYearOmExpensesUsd: Math.round(tenYearOmExpenses),
    tenYearNetSavingsUsd: Math.round(tenYearNetSavings),
    tenYearGenerationKwh: Math.round(tenYearGeneration),
    tenYearCo2OffsetMetricTons: Math.round(tenYearCo2Offset),
    tenYearCarbonCreditRevenueUsd: Math.round(tenYearCarbonRevenue),
    tenYearPaybackYears,
    tenYearIrrPercentage: Math.max(0, tenYearIrrPercentage),
    tenYearNpvUsd,
    hasUserOverrides: overriddenYearsCount > 0,
    overriddenYearsCount,

    // Backwards compatibility aliases
    twentyYearGrossSavingsUsd: Math.round(totalGrossSavings),
    twentyYearOmExpensesUsd: Math.round(totalOmExpenses),
    twentyYearNetSavingsUsd: Math.round(twentyYearNetSavingsUsd),
    twentyYearGenerationKwh: Math.round(totalGeneration),
    twentyYearCo2OffsetMetricTons: Math.round(totalCo2Offset),
    twentyYearCarbonCreditRevenueUsd: Math.round(totalCarbonRevenue),
    simplePaybackYears,
    discountedPaybackYears,
    irrPercentage: Math.max(0, irrPercentage),
    npvUsd,
    roiMultiplier,
    lcoeUsdPerKwh,
    blendedUtilityBenchmarkRateUsd: blendedRate,
    cashFlowSchedule
  };
}

/**
 * Generate Multi-Year Economic Cash Flow CSV for stakeholder financial models
 */
export function generateEconomicCsv(
  result: EconomicSimulationResult,
  propertyName: string,
  apn: string
): string {
  const headers = [
    'Year',
    'Solar Generation (kWh)',
    'Utility Rate ($/kWh)',
    'Avoided Utility Bill ($)',
    'Demand Charge Savings ($)',
    'CO2 Offset (MT)',
    'Carbon Credit Price ($/MT)',
    'Carbon Credit Revenue ($)',
    'EV Charging Revenue ($)',
    'Total Gross Savings ($)',
    'O&M Expenses ($)',
    'Net Annual Cash Flow ($)',
    'Discounted Cash Flow ($)',
    'Cumulative Cash Flow ($)',
    'User Adjusted Status',
    'Notes'
  ];

  const metaRows = [
    `# Civic Twin — Variable Annual Cash Flow Ledger (${result.projectionHorizonYears}-Year Horizon)`,
    `# Property: ${propertyName} (APN: ${apn})`,
    `# Generated: ${new Date().toISOString()}`,
    `# User Custom Overrides Active: ${result.hasUserOverrides ? `YES (${result.overriddenYearsCount} years modified)` : 'NO (Standard Model)'}`,
    `# Total Gross CapEx: $${result.totalGrossCapexUsd.toLocaleString()}`,
    `# Total Incentives (ITC + SGIP + MACRS): $${result.totalIncentivesUsd.toLocaleString()}`,
    `# Net Initial Outlay: $${result.netInitialInvestmentUsd.toLocaleString()}`,
    `# 10-Year Net Savings: $${result.tenYearNetSavingsUsd.toLocaleString()} | 10-Yr IRR: ${result.tenYearIrrPercentage}%`,
    `# ${result.projectionHorizonYears}-Year Net Savings: $${result.totalNetSavingsUsd.toLocaleString()}`,
    `# Simple Payback: ${result.simplePaybackYears} Years  |  Lifetime IRR: ${result.irrPercentage}%  |  NPV: $${result.npvUsd.toLocaleString()}`,
    `# LCOE: $${result.lcoeUsdPerKwh}/kWh vs Utility Benchmark: $${result.blendedUtilityBenchmarkRateUsd}/kWh`,
    `# Carbon Credits: $${result.totalCarbonCreditRevenueUsd.toLocaleString()} (${result.totalCo2OffsetMetricTons.toLocaleString()} MT CO2e)`,
    ``
  ];

  const dataRows = result.cashFlowSchedule.map(r => [
    r.year,
    r.solarGenerationKwh,
    r.gridElectricityRateUsd,
    r.avoidedUtilityBillUsd,
    r.demandChargeSavingsUsd,
    r.co2OffsetMetricTons,
    r.carbonCreditPriceUsd,
    r.carbonCreditRevenueUsd,
    r.evChargingRevenueUsd,
    r.totalGrossSavingsUsd,
    r.omExpensesUsd,
    r.netAnnualCashFlowUsd,
    r.discountedCashFlowUsd,
    r.cumulativeCashFlowUsd,
    r.isOverridden ? 'USER_CUSTOM_ADJUSTED' : 'CALCULATED_BASELINE',
    `"${r.overrideNotes || ''}"`
  ].join(','));

  return [...metaRows, headers.join(','), ...dataRows].join('\n');
}
