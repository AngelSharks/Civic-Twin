# Civic Twin — Digital Twin for AI-Enabled Smart Cities

[![Repository](https://img.shields.io/badge/GitHub-AngelSharks%2FCivic--Twin-0284c7?style=flat&logo=github)](https://github.com/AngelSharks/Civic-Twin)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Autodesk Civil 3D](https://img.shields.io/badge/Autodesk-Civil%203D%20LandXML%201.2-purple.svg)](https://landxml.org)
[![NREL NSRDB](https://img.shields.io/badge/NREL-NSRDB%20%26%20TMY3-amber.svg)](https://nsrdb.nrel.gov)
[![Status](https://img.shields.io/badge/Release-V.06-blue.svg)](https://github.com/AngelSharks/Civic-Twin)

**Civic Twin** is an open-source, non-proprietary spatial digital twin and simulation platform designed for municipalities, civil engineers, and urban planners. Grounded in the coastal geography of **Santa Barbara, California** (34.42° N, 119.70° W), Civic Twin integrates parcel-level municipal GIS, tactical emergency mesh communication (B-LAN), multi-decadal solar physics simulation, and automated CAD/LandXML workflows.

---

## 🌟 Key Subsystems & Capabilities

### 1. 📐 Autodesk Civil 3D Solar Canopy Proposal Studio
- **Interactive Click & Drag Canopy Planner**: Drag the canopy centroid marker (`☀️`) or single-click anywhere on high-resolution satellite imagery to position photovoltaic carport canopies over parking bays.
- **Aisle Alignment & Continuous Rotation**: Rotate the canopy array between 0° and 360° to precisely match angled parking drive aisles, curb lines, and property boundaries using automated presets or continuous sliders.
- **100% Net-Zero Auto-Scaling**: One-click algorithm reads the facility's annual electricity consumption and automatically calculates the exact carport surface area, stall count, and BESS battery capacity required to reach 100% net-zero self-sufficiency.
- **Microgrid Resilience & EV Integration**: Models utility outage islanding survival hours and integrates 2 to 64 Level-2/DC Fast EV charging ports.
- **Autodesk Civil 3D LandXML 1.2 Export**: Direct export of official LandXML files mapped to **NAD83 California State Plane Zone V (US Survey Feet, EPSG: 2229)**, containing 3D survey control points (`CgPoints`) for rotated canopy corners and foundation pier footings, plus TIN surface retention models.

### 2. ⚡ Historical Solar Irradiance & Energy Yield Simulation Engine
- **NREL NSRDB & Santa Barbara TMY3 Baseline**: Multi-decadal historical solar irradiance (5.42 Peak Sun Hours/day avg) with plane-of-array (POA) transposition modeling.
- **Historical Climate Scenarios**:
  - *TMY3 Baseline*: Standard typical meteorological multi-decadal model.
  - *2021 La Niña Marine Fog*: Models delayed morning coastal fog burn-off.
  - *2016 El Niño Wet Year*: Models elevated winter cloud cover and natural rainfall panel cleaning.
  - *2024 Heat Dome & Extreme Heat*: Calculates PV cell temperature derating (-0.35%/°C Pmax loss).
- **Parking Lot Microclimates**: Accounts for distance to shoreline, marine layer dissipation times, and afternoon ocean breeze convective cooling.
- **8,760 Energy Balance & Battery Dispatch**: 12-month generation ledger and 24-hour diurnal dispatch curve modeling peak utility cost avoidance (4:00 PM – 9:00 PM CPA/SCE TOU windows).

### 3. 📑 Executive Stakeholder PDF Summary Export
- Generates a 2-page executive summary PDF for city councils, property owners, and engineering review boards:
  - **Page 1**: Executive scorecards (Annual Yield, Net-Zero Balance, Specific Yield, Avoided Utility Cost, 25-Year Cumulative Yield, Outage Resilience), Civil 3D physical specifications, structural steel tonnage, foundation pier count, and stormwater harvesting capacity.
  - **Page 2**: 12-Month historical irradiance and energy balance table (GHI, POA, Cell Temp, Solar MWh, Demand MWh, Net Balance, Self-Sufficiency %, Savings), battery dispatch profile, and official PE/Municipal signature block.
- Automated client-side PDF compilation via `jspdf`.

### 4. 🗺️ Tactical GIS Core & Urban Simulations
- **6 Integrated Spatial Layers**: Parcels, Hydrology & Watershed Basins, Municipal Utilities (Water/Sewer/Storm), Transportation Infrastructure, Public Safety, and Urban Forest Canopy.
- **Simulation Controllers**: Real-time modeling of storm surge runoff, drainage saturation, traffic choke-points, and emergency mesh network latency.

### 5. 📡 B-LAN Tactical Mesh Network
- Offline, peer-to-peer field communication engine utilizing Web Bluetooth Low Energy (BLE).
- Transmits emergency alerts, telemetry packets, and audio broadcasts during total grid and internet failure.

### 6. 🔌 WordPress Plugin Integration
- Pre-built WordPress plugin (`wordpress-plugin/Civic_twin_Angel_Sharks_wp.V.06.zip`).
- Embedding shortcodes:
  - `[civic_twin_solar_canopy]`: Embeds the interactive 3D solar canopy planner.
  - `[civic_twin_civil3d_proposal]`: Embeds the complete proposal studio, simulation engine, and LandXML exporter.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ or Bun
- Modern web browser (Chrome, Edge, or Firefox with Web Bluetooth enabled)

### Local Development
```bash
# Clone the repository
git clone https://github.com/AngelSharks/Civic-Twin.git
cd Civic-Twin

# Install dependencies
npm install

# Start local development server (Port 3000)
npm run dev
```

The application will be live at `http://localhost:3000`.

### Production Build
```bash
# Compile and build production bundle
npm run build

# Start production server
npm run start
```

---

## 📐 How to Rotate & Align Interactive Canopies

Parking stalls in commercial lots are oriented according to access drive aisles rather than true north. The Civil 3D Proposal Studio provides three convenient ways to align canopy structures:

1. **One-Click Parking Aisle Preset**:
   - In the left configuration sidebar under **"Parking Aisle Rotation & Alignment"**, click:  
     `📐 Auto-Align with Parking Aisle ({optimalRotationDeg}°)`
   - This snaps the canopy frame to the pre-measured drive aisle angle of the selected parking facility (e.g. `64°` for SBCC Cliff Drive, `112°` for Paseo Nuevo, `118°` for SB County Courthouse).
2. **On-Canvas Map Floating Alignment Widget**:
   - On the upper-left of the satellite map, use the **`↺ -15°`** and **`↻ +15°`** buttons to rotate the canopy in 15-degree increments without scrolling the sidebar.
3. **Continuous Rotation Slider**:
   - Slide between **0° and 360°** in 1-degree increments while viewing the high-resolution satellite layer to align the canopy edges with asphalt striping.
4. **Cardinal Snapping**:
   - Use `🧭 0° N-S` or `➡️ 90° E-W` for true cardinal orientations.

For mathematical formulas and complete transformation details, see [docs/CANOPY_ALIGNMENT_AND_USER_GUIDE.md](docs/CANOPY_ALIGNMENT_AND_USER_GUIDE.md).

---

## 🛠️ Tool Use Summary

| Tool Name | Location | Primary Output | Description |
|:---|:---|:---|:---|
| **Canopy 3D Planner** | Header > "📐 Civil 3D Solar Proposal" > *Click & Drag 3D Planner* | Visual Leaflet Overlay | Interactive placement, sizing, and aisle alignment of photovoltaic canopies. |
| **Net-Zero Auto-Scaler** | Sidebar > `⚡ Auto-Scale 100% Net-Zero` | Auto-sized Canopy | Calculates required square footage and battery capacity to offset 100% of property consumption. |
| **Solar Simulation Engine** | Header > *⚡ Simulation* | 8,760 Energy Balance | Multi-decadal irradiance analysis, climate scenario modeling, and financial savings. |
| **Economic Impact & ROI Engine** | Header > *📈 Economic Impact & ROI* | 20-Yr Cash Flow & CSV | 20-Year ROI, simple/discounted payback, IRR, NPV, CPA tariffs, and carbon offset monetization. |
| **Stakeholder PDF Exporter** | Simulation / Designer Toolbar > `📑 Stakeholder PDF` | 2-Page Executive PDF | Downloads branded executive summary with KPI cards, monthly ledger, and PE signature block. |
| **LandXML 1.2 Exporter** | Quick Export Toolbar > `📐 Download LandXML` | `.xml` File | Exports survey control points (`CgPoints`) and TIN surface for direct import into Autodesk Civil 3D. |
| **Property Twin Layer** | Header > *Property Digital Twin Layer* | Saved Twin Record | Persists property simulation to municipal GIS registry and local storage. |
| **GIS Tactical Core** | Header > "GIS Analysis" | Spatial Map Simulation | Centralized control of municipal layers (hydrology, utilities, traffic, mesh). |
| **B-LAN Mesh Panel** | Header > "B-LAN Tactical Mesh" | Bluetooth P2P Network | Off-grid emergency communication and node telemetry. |

---

## 📄 License & Open Standards

This project is licensed under the **MIT License**. In strict compliance with open municipal standards, Civic Twin utilizes exclusively permissive open-source libraries:
- **Leaflet & OpenStreetMap**: Open spatial mapping and geometry.
- **LandXML 1.2**: Open civil engineering exchange standard.
- **W3C Web Bluetooth**: Open browser-based mesh telemetry.
- **NREL NSRDB**: Open solar radiation datasets.
