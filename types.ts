
export interface GeoLocation {
  lat: number;
  lng: number;
  displayName: string;
}

export type UserRole = 'CID_OPERATOR' | 'MAYOR' | 'CITY_MANAGER' | 'RESIDENT';

export interface CIDUser {
  id: string;
  role: UserRole;
  cid: string;
  name: string;
}

export interface MeshNode {
  id: string;
  status: 'active' | 'relay' | 'failing';
  signal: number; // 0-100
  type: 'Static' | 'Mobile' | 'Fog' | 'Fiber' | 'Wi-Fi';
  cidRef?: string; // Reference to which Community ID this node serves
}

export interface CID {
  id: string;
  name: string;
  population: number;
  meshActive: boolean;
}

export interface TacticalAlert {
  timestamp: string;
  sender: string;
  message: string;
  priority: 'low' | 'high' | 'critical';
  targetCid?: string;
}

export interface NeighborhoodBLan {
  name: string;
  nodes: number;
  health: number; // 0-100
  status: 'stable' | 'degraded' | 'isolated';
  cid: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isLocalInference?: boolean;
}

export interface GISLayerEndpoints {
  parcels: string;
  utilities: string;
  infrastructure: string;
  safety: string;
  greenery: string;
  watershed?: string;
}

export interface HydrologySimState {
  rainfallIntensity: number; // mm/hr
  soilPermeability: number; // percentage
  retentionBasinCapacity: number; // percentage
  projectedRunoff: number; // m3/s
  floodRiskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
}

export interface Feedback {
  id: string;
  type: 'bug' | 'feature';
  title: string;
  description: string;
  timestamp: string;
}

export interface TwinMetadata {
  name: string;
  address: string;
  location: GeoLocation | null;
  type: 'City' | 'Community' | 'Farm' | 'Special District';
  officialUrl?: string;
  isEmergencyMode?: boolean;
  cids: CID[]; 
  gisLayers?: GISLayerEndpoints;
  planetApiKey?: string;
  planetOrderId?: string;
  planetAiReport?: string;
  planetOrdersSql?: string;
  githubToken?: string;
  isGemmaProvisioned?: boolean;
  isProductionMode?: boolean;
  version?: string;
}

export enum NISTLayer {
  ENERGY = 'Energy',
  WATER = 'Water',
  WASTE = 'Waste',
  TRANSPORTATION = 'Transportation',
  PUBLIC_SAFETY = 'Public Safety',
  HEALTHCARE = 'Healthcare'
}

export interface SmartCityInsight {
  layer: NISTLayer;
  status: 'optimal' | 'warning' | 'critical';
  value: string;
  summary: string;
  recommendations: string[];
}

export interface BranchSuggestion {
  name: string;
  purpose: string;
  prTitle: string;
  prBody: string;
}

export interface PRInfo {
  number: number;
  html_url: string;
  title: string;
  user: {
    login: string;
    avatar_url: string;
  };
}

export interface DTNMetadata {
  node_id: string;
  hardware: {
    vram_available_mb: number;
    npu_type: string;
    compute_units: number;
    power_source: 'solar' | 'grid' | 'battery';
    battery_level: number;
  };
  network: {
    avg_latency_ms: number;
    mesh_hops_to_gateway: number;
    last_sync_timestamp: string;
  };
  supported_models: string[];
}

export interface InferenceTask {
  id: string;
  model_cid: string;
  input_data: string; // Base64 or JSON string
  priority: number;
  status: 'PENDING' | 'CLAIMED' | 'COMPLETED' | 'FAILED';
  result?: string;
  worker_id?: string;
}

export type ViewType = 'dashboard' | 'gis-analysis' | 'admin' | 'documentation' | 'mesh-gateway' | 'planet-4d' | 'civil3d-proposal';
export type ConnectivityStatus = 'online' | 'offline-fog' | 'disconnected';

export interface TrafficSimState {
  publicTransportAvailability: number;
  trafficDensity: number;
  peakHourDelay: number;
}

export interface SolarCanopyConfig {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lengthFt: number;
  widthFt: number;
  stallsCovered: number;
  tiltAngle: number; // degrees 5 - 35
  azimuthDeg: number; // 0 - 360 (180 = South)
  panelEfficiency: number; // e.g. 0.218 (21.8%)
  moduleWattage: number; // e.g. 550W
  structureType: 'dual-cantilever' | 'single-slope-y' | 'long-span-truss';
  evChargersCount: number; // Level 2 & DC Fast
  bessCapacityKWh: number; // Battery storage
  rotationDeg?: number; // 0 - 360 degrees alignment with parking stalls/drive aisles
}

export interface PropertyDetailLayer {
  id: string;
  propertyName: string;
  apn: string; // Assessor Parcel Number
  lotSqFt: number;
  buildingType: string;
  annualBaselineKwh: number;
  peakKwDemand: number;
  canopies: SolarCanopyConfig[];
  projectedAnnualKwh: number;
  selfSufficiencyPct: number;
  bessKWh: number;
  microgridIslandingHours: number;
  co2OffsetTons: number;
  stormwaterCapturedGalYr: number;
  structuralSteelTons: number;
  civil3DExported: boolean;
  status: 'draft' | 'simulated' | 'proposed' | 'committed';
  createdAt: string;
}
