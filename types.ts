
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

export type ViewType = 'dashboard' | 'gis-analysis' | 'admin' | 'documentation' | 'mesh-gateway' | 'planet-4d';
export type ConnectivityStatus = 'online' | 'offline-fog' | 'disconnected';

export interface TrafficSimState {
  publicTransportAvailability: number;
  trafficDensity: number;
  peakHourDelay: number;
}
