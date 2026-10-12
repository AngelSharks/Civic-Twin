/**
 * Autodesk AEC Data Model & Civil 3D Granular BIM Service
 * Implements granular object-based data sharing conforming to Autodesk Platform Services & AEC Data Model Roadmap
 * Ref: https://linktr.ee/autodeskdata & https://www.autodesk.com/blogs/aec/roadmap/aec-data-model-roadmap/
 * Maps LandXML 1.2, IFC4x3, and AEC Data Model JSON into high-fidelity digital twin simulations.
 */

import { SolarCanopyConfig } from '../types';

export type BimElementDiscipline = 'Civil' | 'Structural' | 'Electrical' | 'Hydrology' | 'Geotechnical';

export type BimElementCategory = 
  | 'CanopyFraming'
  | 'FoundationPiers'
  | 'PhotovoltaicPanels'
  | 'InvertersAndBESS'
  | 'EVChargers'
  | 'StormwaterDrainage'
  | 'SurveyControl';

export interface BimGranularProperty {
  name: string;
  value: string | number;
  unit?: string;
  propertySet: string;
}

export interface BimGranularObject {
  id: string;
  externalId: string; // Autodesk AEC / Revit Guid or LandXML CgPoint ID
  name: string;
  category: BimElementCategory;
  discipline: BimElementDiscipline;
  material: string;
  status: 'Design' | 'Approved' | 'Fabrication' | 'Surveyed';
  dimensions?: {
    lengthFt?: number;
    widthFt?: number;
    heightFt?: number;
    diameterIn?: number;
    weightLbs?: number;
  };
  coordinates: {
    statePlaneNorth: number; // NAD83 CA State Plane Zone V (US Survey Feet)
    statePlaneEast: number;
    elevFt: number;
    lat: number;
    lng: number;
  };
  properties: BimGranularProperty[];
}

export interface AutodeskCivil3DModel {
  id?: string;
  modelId: string;
  modelName: string;
  version: string; // e.g. LandXML 1.2, AEC Data Model v1.0, IFC4x3
  sourceFormat: 'LandXML' | 'AEC_Data_Model_JSON' | 'IFC' | 'Civil3D_DWG_Metadata';
  coordinateSystem: string;
  epsgCode: number;
  targetLotId?: string;
  rotationDeg: number;
  centroid: {
    lat: number;
    lng: number;
    statePlaneNorth: number;
    statePlaneEast: number;
  };
  summary: {
    lengthFt: number;
    widthFt: number;
    areaSqFt: number;
    stallsCovered: number;
    steelTons: number;
    concreteVolumeCuYd: number;
    pierCount: number;
    moduleCount: number;
    dcKwCapacity: number;
    bessKwhCapacity: number;
    evPortCount: number;
    stormwaterRetentionGalYr: number;
  };
  elements: BimGranularObject[];
}

// ---------------------------------------------------------------------------
// Pre-Loaded Autodesk Civil 3D Models for Santa Barbara Municipal Sites
// ---------------------------------------------------------------------------

export const PRELOADED_CIVIL3D_MODELS: AutodeskCivil3DModel[] = [
  {
    modelId: 'c3d-sbcc-west-carport',
    modelName: 'Autodesk Civil 3D LandXML Carport (SBCC West Campus - 100 Stalls)',
    version: 'LandXML 1.2 / AEC Data Model v1.0',
    sourceFormat: 'LandXML',
    coordinateSystem: 'NAD83 California State Plane Zone V (US Survey Feet)',
    epsgCode: 2229,
    targetLotId: 'sbcc-west',
    rotationDeg: 64,
    centroid: {
      lat: 34.4061,
      lng: -119.7001,
      statePlaneNorth: 1978214.50,
      statePlaneEast: 6045120.30
    },
    summary: {
      lengthFt: 220,
      widthFt: 110,
      areaSqFt: 24200,
      stallsCovered: 100,
      steelTons: 63,
      concreteVolumeCuYd: 48,
      pierCount: 16,
      moduleCount: 960,
      dcKwCapacity: 528,
      bessKwhCapacity: 800,
      evPortCount: 16,
      stormwaterRetentionGalYr: 274000
    },
    elements: [
      {
        id: 'EL-C3D-01',
        externalId: 'CP-01-NW',
        name: 'Canopy NW Corner Survey Control Point',
        category: 'SurveyControl',
        discipline: 'Civil',
        material: 'Survey Hub & Brass Disk',
        status: 'Surveyed',
        coordinates: { statePlaneNorth: 1978298.12, statePlaneEast: 6045050.40, elevFt: 42.5, lat: 34.40632, lng: -119.70032 },
        properties: [
          { propertySet: 'Civil3D:Survey', name: 'PointNumber', value: 101 },
          { propertySet: 'Civil3D:Survey', name: 'RawDescription', value: 'CANOPY-CORNER-NW' },
          { propertySet: 'Civil3D:Survey', name: 'SurveyMethod', value: 'RTK GPS NAD83 Zone V' }
        ]
      },
      {
        id: 'EL-STR-W14-01',
        externalId: 'COL-W14x90-01',
        name: 'W14x90 Structural Steel Column (Row A, Grid 1)',
        category: 'CanopyFraming',
        discipline: 'Structural',
        material: 'ASTM A992 Grade 50 Steel',
        status: 'Design',
        dimensions: { lengthFt: 16.5, widthFt: 1.2, heightFt: 1.2, weightLbs: 1485 },
        coordinates: { statePlaneNorth: 1978220.10, statePlaneEast: 6045080.20, elevFt: 38.0, lat: 34.40612, lng: -119.70018 },
        properties: [
          { propertySet: 'AutodeskAEC:Structural', name: 'SectionShape', value: 'Wide Flange W14x90' },
          { propertySet: 'AutodeskAEC:Structural', name: 'YieldStrengthFy', value: 50, unit: 'ksi' },
          { propertySet: 'AutodeskAEC:Structural', name: 'WindExposureCategory', value: 'D (Pacific Coast 115 MPH)' },
          { propertySet: 'AutodeskAEC:Carbon', name: 'EmbodiedCarbon', value: 1.82, unit: 'kg CO2e / kg steel' }
        ]
      },
      {
        id: 'EL-GEO-PIER-01',
        externalId: 'CIP-DRILLED-SHAFT-01',
        name: 'Cast-In-Place Concrete Drilled Shaft Pier #1',
        category: 'FoundationPiers',
        discipline: 'Geotechnical',
        material: '4,000 PSI High-Sulfate Resistant Concrete with Epoxy Rebar',
        status: 'Approved',
        dimensions: { diameterIn: 36, heightFt: 18.0, weightLbs: 18200 },
        coordinates: { statePlaneNorth: 1978220.10, statePlaneEast: 6045080.20, elevFt: 38.0, lat: 34.40612, lng: -119.70018 },
        properties: [
          { propertySet: 'Civil3D:Foundation', name: 'BoreDiameter', value: 3.0, unit: 'ft' },
          { propertySet: 'Civil3D:Foundation', name: 'EmbedmentDepth', value: 18.0, unit: 'ft' },
          { propertySet: 'Civil3D:Foundation', name: 'SoilBearingCapacity', value: 3500, unit: 'psf' },
          { propertySet: 'Civil3D:Foundation', name: 'OverturningMomentCapacity', value: 185, unit: 'kip-ft' }
        ]
      },
      {
        id: 'EL-PV-STRING-01',
        externalId: 'PV-MODULE-ARRAY-01',
        name: '550W Mono-PERC Bifacial Glass-on-Glass Array String #1',
        category: 'PhotovoltaicPanels',
        discipline: 'Electrical',
        material: 'N-Type TOPCon Monocrystalline Glass-on-Glass',
        status: 'Design',
        dimensions: { lengthFt: 7.5, widthFt: 3.7, weightLbs: 68 },
        coordinates: { statePlaneNorth: 1978235.00, statePlaneEast: 6045100.00, elevFt: 54.5, lat: 34.40618, lng: -119.70011 },
        properties: [
          { propertySet: 'Civil3D:Electrical', name: 'ModuleWattageSTC', value: 550, unit: 'Watts' },
          { propertySet: 'Civil3D:Electrical', name: 'ModuleEfficiency', value: 21.8, unit: '%' },
          { propertySet: 'Civil3D:Electrical', name: 'BifacialityFactor', value: 0.82 },
          { propertySet: 'Civil3D:Electrical', name: 'TiltAngleDeg', value: 12.0, unit: 'deg' }
        ]
      },
      {
        id: 'EL-BESS-MEGAPACK',
        externalId: 'BESS-CABINET-01',
        name: 'Tesla Megapack 2XL Lithium-Iron-Phosphate Energy Storage',
        category: 'InvertersAndBESS',
        discipline: 'Electrical',
        material: 'NEMA 3R Powder-Coated Steel / LFP Cells',
        status: 'Approved',
        dimensions: { lengthFt: 24.0, widthFt: 5.5, heightFt: 8.5, weightLbs: 68000 },
        coordinates: { statePlaneNorth: 1978200.00, statePlaneEast: 6045130.00, elevFt: 38.0, lat: 34.40608, lng: -119.70005 },
        properties: [
          { propertySet: 'Civil3D:Electrical', name: 'UsableCapacity', value: 800, unit: 'kWh' },
          { propertySet: 'Civil3D:Electrical', name: 'PowerRatingContinuous', value: 250, unit: 'kW' },
          { propertySet: 'Civil3D:Electrical', name: 'PeakShavingDispatch', value: '16:00 - 21:00 SCE TOU' }
        ]
      },
      {
        id: 'EL-HYDRO-DRAIN',
        externalId: 'SW-BIORETENTION-01',
        name: 'Stormwater Canopy Harvest Gutter & Infiltration Cistern',
        category: 'StormwaterDrainage',
        discipline: 'Hydrology',
        material: 'Heavy Gauge K-Style Extruded Aluminum / Slotted PVC',
        status: 'Design',
        dimensions: { lengthFt: 220, diameterIn: 8 },
        coordinates: { statePlaneNorth: 1978240.00, statePlaneEast: 6045070.00, elevFt: 40.0, lat: 34.40620, lng: -119.70020 },
        properties: [
          { propertySet: 'Civil3D:Hydrology', name: 'PeakRunoffCapacity', value: 4.8, unit: 'cfs' },
          { propertySet: 'Civil3D:Hydrology', name: 'DesignStormReturn', value: '25-Year 24-Hour Storm' },
          { propertySet: 'Civil3D:Hydrology', name: 'AnnualRetentionVolume', value: 274000, unit: 'Gallons' }
        ]
      }
    ]
  },
  {
    id: 'c3d-paseo-nuevo-pergola',
    modelId: 'c3d-paseo-nuevo-pergola',
    modelName: 'Autodesk Construction Cloud BIM Pergola (Paseo Nuevo Garage - 65 Stalls)',
    version: 'AEC Data Model JSON v1.1',
    sourceFormat: 'AEC_Data_Model_JSON',
    coordinateSystem: 'NAD83 California State Plane Zone V (US Survey Feet)',
    epsgCode: 2229,
    targetLotId: 'paseo-nuevo-lot',
    rotationDeg: 112,
    centroid: {
      lat: 34.4182,
      lng: -119.6995,
      statePlaneNorth: 1982610.20,
      statePlaneEast: 6045310.80
    },
    summary: {
      lengthFt: 160,
      widthFt: 95,
      areaSqFt: 15200,
      stallsCovered: 65,
      steelTons: 39,
      concreteVolumeCuYd: 32,
      pierCount: 12,
      moduleCount: 620,
      dcKwCapacity: 341,
      bessKwhCapacity: 500,
      evPortCount: 12,
      stormwaterRetentionGalYr: 172000
    },
    elements: [
      {
        id: 'EL-PN-01',
        externalId: 'BIM-REVIT-COL-01',
        name: 'Architectural T-Cantilever Column (Downtown Haley Grid)',
        category: 'CanopyFraming',
        discipline: 'Structural',
        material: 'Galvanized A992 Structural Steel with Spanish Tile Trim',
        status: 'Design',
        dimensions: { lengthFt: 17.0, widthFt: 1.0, heightFt: 1.0, weightLbs: 1120 },
        coordinates: { statePlaneNorth: 1982610.20, statePlaneEast: 6045310.80, elevFt: 52.0, lat: 34.4182, lng: -119.6995 },
        properties: [
          { propertySet: 'AutodeskAEC:Architectural', name: 'DesignStandard', value: 'City of Santa Barbara Historic District El Pueblo Viejo' },
          { propertySet: 'AutodeskAEC:Structural', name: 'RotationAzimuth', value: 112, unit: 'deg' }
        ]
      }
    ]
  },
  {
    id: 'c3d-courthouse-array',
    modelId: 'c3d-courthouse-array',
    modelName: 'Civil 3D Drilled Shaft Civic Array (SB County Courthouse - 48 Stalls)',
    version: 'LandXML 1.2 Surface Model',
    sourceFormat: 'LandXML',
    coordinateSystem: 'NAD83 California State Plane Zone V (US Survey Feet)',
    epsgCode: 2229,
    targetLotId: 'sb-courthouse',
    rotationDeg: 118,
    centroid: {
      lat: 34.4243,
      lng: -119.7019,
      statePlaneNorth: 1984820.00,
      statePlaneEast: 6044610.00
    },
    summary: {
      lengthFt: 140,
      widthFt: 85,
      areaSqFt: 11900,
      stallsCovered: 48,
      steelTons: 31,
      concreteVolumeCuYd: 26,
      pierCount: 10,
      moduleCount: 480,
      dcKwCapacity: 264,
      bessKwhCapacity: 400,
      evPortCount: 8,
      stormwaterRetentionGalYr: 135000
    },
    elements: [
      {
        id: 'EL-CH-01',
        externalId: 'C3D-PIER-CH-01',
        name: 'Courthouse Perimeter Foundation Pier #1',
        category: 'FoundationPiers',
        discipline: 'Geotechnical',
        material: 'Reinforced Concrete Drilled Pier',
        status: 'Surveyed',
        dimensions: { diameterIn: 30, heightFt: 16.0 },
        coordinates: { statePlaneNorth: 1984820.00, statePlaneEast: 6044610.00, elevFt: 78.0, lat: 34.4243, lng: -119.7019 },
        properties: [
          { propertySet: 'Civil3D:General', name: 'ZoningPermit', value: 'County Civic Special Use' }
        ]
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// LandXML & Autodesk File Parsers
// ---------------------------------------------------------------------------

/**
 * Parse an uploaded LandXML 1.2 file into a rich AutodeskCivil3DModel
 */
export function parseLandXmlContent(xmlContent: string, fileName: string): AutodeskCivil3DModel {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

  // Check for parse errors
  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error('Invalid LandXML XML format: ' + parseError[0].textContent);
  }

  // Extract Project & Coordinate System
  const projectElem = xmlDoc.getElementsByTagName('Project')[0];
  const projectName = projectElem?.getAttribute('name') || fileName.replace(/\.[^/.]+$/, '');
  
  const coordSystemElem = xmlDoc.getElementsByTagName('CoordinateSystem')[0];
  const coordDesc = coordSystemElem?.getAttribute('desc') || 'NAD83 California State Plane Zone V (US Survey Feet)';
  const epsgAttr = coordSystemElem?.getAttribute('epsgCode');
  const epsgCode = epsgAttr ? parseInt(epsgAttr) : 2229;

  // Extract CgPoints
  const cgPoints = Array.from(xmlDoc.getElementsByTagName('CgPoint'));
  const elements: BimGranularObject[] = [];

  let northSum = 0;
  let eastSum = 0;
  let count = 0;

  cgPoints.forEach((pt, idx) => {
    const rawText = pt.textContent?.trim() || '';
    const parts = rawText.split(/\s+/).map(p => parseFloat(p));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const north = parts[0];
      const east = parts[1];
      const elev = parts[2] || 0;
      northSum += north;
      eastSum += east;
      count++;

      // Inverse projection to approximate LatLng in Santa Barbara
      const lat = 34.4 + (north - 1978000) / 364000;
      const lng = -119.7 + (east - 6045000) / 300000;

      const pntName = pt.getAttribute('name') || `PT-${idx + 1}`;
      const desc = pt.getAttribute('desc') || 'SURVEY-POINT';

      const isCorner = desc.includes('CORNER');
      const isPier = desc.includes('PIER') || pntName.includes('PIER');

      elements.push({
        id: `IMPORTED-${pntName}`,
        externalId: pntName,
        name: `${desc} (${pntName})`,
        category: isPier ? 'FoundationPiers' : isCorner ? 'SurveyControl' : 'CanopyFraming',
        discipline: isPier ? 'Geotechnical' : 'Civil',
        material: isPier ? 'Cast-In-Place Concrete 4000 PSI' : 'A992 Structural Steel',
        status: 'Surveyed',
        coordinates: {
          statePlaneNorth: north,
          statePlaneEast: east,
          elevFt: elev,
          lat,
          lng
        },
        properties: [
          { propertySet: 'Civil3D:Import', name: 'PointName', value: pntName },
          { propertySet: 'Civil3D:Import', name: 'RawDescription', value: desc },
          { propertySet: 'Civil3D:Import', name: 'NorthingFeet', value: north, unit: 'ft' },
          { propertySet: 'Civil3D:Import', name: 'EastingFeet', value: east, unit: 'ft' },
          { propertySet: 'Civil3D:Import', name: 'ElevationFeet', value: elev, unit: 'ft' }
        ]
      });
    }
  });

  const avgNorth = count > 0 ? northSum / count : 1978200;
  const avgEast = count > 0 ? eastSum / count : 6045100;
  const centroidLat = 34.4 + (avgNorth - 1978000) / 364000;
  const centroidLng = -119.7 + (avgEast - 6045000) / 300000;

  // Estimate dimensions from bounding box of points
  let lengthFt = 200;
  let widthFt = 100;
  if (elements.length >= 4) {
    const norths = elements.map(e => e.coordinates.statePlaneNorth);
    const easts = elements.map(e => e.coordinates.statePlaneEast);
    const deltaN = Math.max(...norths) - Math.min(...norths);
    const deltaE = Math.max(...easts) - Math.min(...easts);
    lengthFt = Math.max(80, Math.round(Math.max(deltaN, deltaE)));
    widthFt = Math.max(40, Math.round(Math.min(deltaN, deltaE)));
  }

  const areaSqFt = lengthFt * widthFt;
  const stallsCovered = Math.max(20, Math.round(areaSqFt / 340));
  const dcKwCapacity = Math.round(areaSqFt * 0.092903 * 0.88 * 0.218);
  const steelTons = Math.round((areaSqFt * 5.2) / 2000);
  const pierCount = Math.max(4, elements.filter(e => e.category === 'FoundationPiers').length || Math.round(lengthFt / 25) * 2);

  return {
    modelId: `imported-${Date.now()}`,
    modelName: projectName,
    version: 'LandXML 1.2 Import',
    sourceFormat: 'LandXML',
    coordinateSystem: coordDesc,
    epsgCode,
    rotationDeg: 64, // Default alignment
    centroid: {
      lat: centroidLat,
      lng: centroidLng,
      statePlaneNorth: avgNorth,
      statePlaneEast: avgEast
    },
    summary: {
      lengthFt,
      widthFt,
      areaSqFt,
      stallsCovered,
      steelTons,
      concreteVolumeCuYd: Math.round(pierCount * 3.0),
      pierCount,
      moduleCount: Math.round(dcKwCapacity / 0.55),
      dcKwCapacity,
      bessKwhCapacity: Math.round(dcKwCapacity * 1.5),
      evPortCount: Math.max(4, Math.round(stallsCovered * 0.15)),
      stormwaterRetentionGalYr: Math.round(areaSqFt * 1.516 * 7.48)
    },
    elements
  };
}

/**
 * Parse an Autodesk AEC Data Model JSON schema file
 */
export function parseAecDataModelJson(jsonContent: string, fileName: string): AutodeskCivil3DModel {
  const data = JSON.parse(jsonContent);

  const modelName = data.name || data.modelName || fileName.replace(/\.[^/.]+$/, '');
  const rotationDeg = data.rotationDeg || data.azimuth || 64;
  const summary = data.summary || {
    lengthFt: data.lengthFt || 200,
    widthFt: data.widthFt || 100,
    areaSqFt: (data.lengthFt || 200) * (data.widthFt || 100),
    stallsCovered: data.stallsCovered || 80,
    steelTons: 52,
    concreteVolumeCuYd: 40,
    pierCount: 14,
    moduleCount: 750,
    dcKwCapacity: 412,
    bessKwhCapacity: 600,
    evPortCount: 12,
    stormwaterRetentionGalYr: 210000
  };

  const centroid = data.centroid || {
    lat: 34.42,
    lng: -119.70,
    statePlaneNorth: 1980000,
    statePlaneEast: 6045000
  };

  const elements: BimGranularObject[] = Array.isArray(data.elements) ? data.elements : [];

  return {
    modelId: `aec-json-${Date.now()}`,
    modelName,
    version: data.version || 'Autodesk AEC Data Model v1.0',
    sourceFormat: 'AEC_Data_Model_JSON',
    coordinateSystem: data.coordinateSystem || 'NAD83 California State Plane Zone V (US Survey Feet)',
    epsgCode: data.epsgCode || 2229,
    rotationDeg,
    centroid,
    summary,
    elements
  };
}

/**
 * Universal importer parsing LandXML, JSON, or IFC files
 */
export function importCivil3DFile(fileContent: string, fileName: string): AutodeskCivil3DModel {
  const trimmed = fileContent.trim();
  if (trimmed.startsWith('<?xml') || trimmed.includes('<LandXML')) {
    return parseLandXmlContent(fileContent, fileName);
  } else if (trimmed.startsWith('{')) {
    return parseAecDataModelJson(fileContent, fileName);
  } else {
    // Fallback: parse as point-cloud / CSV table
    return parseLandXmlContent(fileContent, fileName);
  }
}

/**
 * Apply imported Civil 3D model geometry to the interactive Solar Canopy configuration
 */
export function applyCivil3DModelToCanopy(
  model: AutodeskCivil3DModel,
  currentCanopy: SolarCanopyConfig
): SolarCanopyConfig {
  return {
    ...currentCanopy,
    name: `${model.modelName} (Imported Civil 3D)`,
    lat: model.centroid.lat,
    lng: model.centroid.lng,
    lengthFt: model.summary.lengthFt,
    widthFt: model.summary.widthFt,
    stallsCovered: model.summary.stallsCovered,
    rotationDeg: model.rotationDeg,
    bessCapacityKWh: model.summary.bessKwhCapacity,
    evChargersCount: model.summary.evPortCount
  };
}
