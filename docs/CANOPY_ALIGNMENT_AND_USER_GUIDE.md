# Civic Twin — Interactive Solar Canopy Placement, Alignment & Platform Tool Use Guide

**Project Repository:** [AngelSharks/Civic-Twin](https://github.com/AngelSharks/Civic-Twin)  
**Target City:** Santa Barbara, California (Latitude 34.42° N, Longitude 119.70° W)  
**Document Classification:** Official Engineering & Stakeholder Documentation (Version V.07)

---

## 1. Overview & Architectural Intent

The **Civic Twin Solar Canopy Proposal Studio** (`Civil3DSolarProposal`) bridges municipal spatial GIS, satellite parcel datasets, and computer-aided civil engineering (Autodesk Civil 3D). It enables urban planners, facility directors, renewable energy developers, and structural engineers to interactively design commercial photovoltaic carport canopies directly over parking areas, simulate multi-decadal energy yields, and generate official Autodesk LandXML 1.2 models and executive PDF summaries.

---

## 2. Interactive Canopy Placement & Parking Area Alignment

Designing solar carports requires matching the structural framing to the geometry of parking drive aisles, circulation bays, and parcel setbacks. The system provides multi-modal controls to rotate and align canopy structures with any parking lot shape.

```
       True North (0°)
             ↑
             |   Parking Drive Aisle Orientation (e.g. 64° NE)
             |      ↗
             |    /  [====================]  <-- Canopy Array Rotated to match aisle
             |  /    |  P1   P2   P3   P4 |      (Stanchion Piers CP-01...CP-08 aligned)
             |/      [====================]
             +------------------------------→ East (90°)
```

### 2.1 Methods for Canopy Placement on Parking Lots
1. **Interactive Center Pin Drag (`☀️`)**:
   - On the interactive Leaflet satellite map, locate the glowing blue circular pin (`☀️`) at the center of the canopy array.
   - Click and hold the pin with your cursor.
   - Drag the pin over the desired parking stalls or drive aisle.
   - Releasing the mouse button recalculates the geographic centroid (`canopy.lat`, `canopy.lng`) and instantly transforms the 4 corner points and foundation pier coordinates.

2. **Single-Click Instant Teleportation**:
   - Click anywhere within the parking lot surface on the satellite or street map.
   - The canopy array instantly teleports its centroid to the clicked latitude/longitude coordinates while preserving all current dimensional and rotation parameters.

---

### 2.2 Rotating & Aligning Canopies with Parking Lot Shapes

Parking spaces and drive aisles in Santa Barbara are rarely oriented true North-South; they follow coastal topography, property boundaries, and municipal street grids (e.g. the 1851 Haley Grid angled at ~48°–50°, or coastal bluffs angled at ~64°–112°).

To align the canopy footprint with parking aisles:

#### Method A: One-Click Aisle Auto-Alignment Presets
In the left sidebar under **"Parking Aisle Rotation & Alignment"**, click the primary button:
- **`📐 Auto-Align with Parking Aisle ({optimalRotationDeg}°)`**:
  - Instantly aligns the canopy frame with the designated drive aisle orientation of the active lot preset.
  - Examples calibrated for Santa Barbara:
    - **SBCC West Campus (Cliff Drive):** `64°` (aligns with the Pacific coastal bluff drive aisle).
    - **Paseo Nuevo Garage Lot (Chapala St):** `112°` (aligns with downtown Haley Grid circulation).
    - **SB County Courthouse Lot (Anacapa St):** `118°` (aligns with historic civil core perimeter).
    - **Cabrillo Blvd Waterfront Lot:** `108°` (aligns with Harbor shoreline and palm promenade).
    - **Granada Garage / Anacapa Lot:** `115°` (aligns with downtown arterial bays).

#### Method B: Continuous Fine-Tuning Rotation Slider
- Use the **0° to 360° continuous rotation slider** in the sidebar.
- Move the slider in 1-degree increments.
- The canopy polygon and foundation piers update in real time on the satellite map, allowing pixel-perfect visual alignment with painted parking stall striping and asphalt curbing.

#### Method C: On-Canvas Map Floating Alignment Tool
- Located in the upper-left of the satellite map is the floating **Align Widget**:
  - Displays current rotation angle (e.g., `Align: 64°`).
  - Contains quick-nudge buttons:
    - **`↺ -15°`**: Rotates counter-clockwise in 15-degree steps.
    - **`↻ +15°`**: Rotates clockwise in 15-degree steps.
  - Allows full rotational alignment without closing or scrolling the configuration sidebar.

#### Method D: Cardinal Direction Presets
- **`🧭 0° N-S`**: Snaps the canopy array to True North-South.
- **`➡️ 90° E-W`**: Snaps the canopy array to True East-West.

---

### 2.3 Mathematical Transformation Engine

When the rotation angle ($\theta$) changes, the system applies a 2D Euclidean rotation matrix to the local dimensional box (length $L$, width $W$) in local coordinate space (feet):

$$\begin{bmatrix} X_{rot} \\ Y_{rot} \end{bmatrix} = \begin{bmatrix} \cos(\theta) & -\sin(\theta) \\ \sin(\theta) & \cos(\theta) \end{bmatrix} \begin{bmatrix} X_{local} \\ Y_{local} \end{bmatrix}$$

For local corner vertices relative to center:
- **NW (Top-Left):** $(-L/2, +W/2)$
- **NE (Top-Right):** $(+L/2, +W/2)$
- **SE (Bottom-Right):** $(+L/2, -W/2)$
- **SW (Bottom-Left):** $(-L/2, -W/2)$

These local Cartesian offsets in survey feet are converted into geodesic coordinates:

$$\text{Lat}_{corner} = \text{Lat}_{center} + (Y_{rot} \times 0.00000274)$$
$$\text{Lng}_{corner} = \text{Lng}_{center} + (X_{rot} \times 0.00000334)$$

*(where conversion coefficients are latitude-corrected for Santa Barbara at 34.42° N).*

The exact same rotated transformation is calculated for every drilled-shaft foundation pier and exported into the LandXML 1.2 file in California State Plane Zone V (EPSG: 2229) coordinates.

---

## 3. Comprehensive Tool Use Across Civic Twin

The Civic Twin platform provides specialized tools accessible via the navigation header and sub-modules:

### Tool 1: 3D Click & Drag Solar Canopy Planner (`Civil3DSolarProposal.tsx`)
- **Map Perspectives**: Switch between high-resolution Google Satellite (`🌍 Satellite`) and OpenStreetMap cartography (`🏙️ Street Map`).
- **Interactive Dimension Sliders**: Adjust canopy length (60 to 650 ft), width (40 to 180 ft), and stalls covered (20 to lot maximum).
- **100% Net-Zero Auto-Scaler**: Click the green **`⚡ Auto-Scale Canopy for 100% Net-Zero`** button. The engine automatically reads the property's annual electricity baseline and calculates the exact physical canopy dimensions and battery storage (BESS) capacity needed to hit 100% self-sufficiency.
- **Microgrid Resilience Controls**: Configure BESS battery capacity (up to 3,500 kWh) and Level 2/DC Fast Dual EV Charging stanchions (2 to 64 ports). Displays continuous off-grid islanding hours during power outages.

### Tool 2: Historical Solar Irradiance & Yield Simulation Engine (`solarSimulationService.ts`)
- **NREL NSRDB & TMY3 Calibration**: Built on multi-decadal solar insolation for Santa Barbara, California (average 5.42 Peak Sun Hours/day).
- **Climate Scenario Switcher**:
  - *NREL TMY3 Multi-Decadal Baseline*: Typical Meteorological Year.
  - *2021 La Niña Marine Layer*: Models prolonged morning coastal fog with delayed burn-off.
  - *2016 El Niño High-Rainfall Year*: Simulates increased cloud cover and natural panel rinsing.
  - *2024 Heat Dome & Extreme High Temperature*: Simulates elevated cell operating temperatures and Pmax thermal losses (-0.35%/°C).
- **Microclimate Profiler**: Select microclimate stations (Waterfront/Harbor, West Campus, Paseo Nuevo, Courthouse) incorporating elevation, distance to coast, marine fog clearance time, and afternoon sea breeze wind cooling.
- **Bifacial Module & Soiling Switchers**: Model bifacial rear-side albedo boost (+8% to +14% energy yield from asphalt reflection) and seasonal soiling degradation.
- **Hourly Dispatch Analysis**: Generates 24-hour diurnal curves comparing solar generation, facility demand, BESS charging during mid-day solar peak, and BESS discharging during CPA/SCE peak utility pricing (4:00 PM – 9:00 PM).

### Tool 3: Executive Stakeholder PDF Summary Exporter (`pdfExportService.ts`)
- **2-Page Executive Document Generation**: Produces a clean, print-ready PDF containing:
  - **Page 1**: Executive project summary, 6 KPI scorecards (Annual Yield, Net-Zero Balance, Specific Yield, Avoided Utility Cost, 25-Year Cumulative Yield, Outage Resilience), Civil 3D carport physical specs, foundation pier count, structural steel tonnage, and stormwater capture volume.
  - **Page 2**: 12-Month historical irradiance and energy balance table (GHI, POA, Cell Temp, Solar MWh, Demand MWh, Net Balance, Self-Sufficiency %, Savings), 3-phase microgrid battery dispatch profile, and official PE/Asset Manager signature block.
- **Direct Download**: Automatically saves as `Civil3D_Solar_Proposal_{APN}_Stakeholder_Summary.pdf`.

### Tool 4: Autodesk Civil 3D LandXML 1.2 Package Exporter
- Exports an official LandXML 1.2 document (`.xml`) complying with Autodesk Civil 3D, Bentley InRoads, and Trimble civil workflows.
- Contains:
  - `<CoordinateSystem>`: NAD83 California State Plane Zone V (US Survey Feet), EPSG: 2229.
  - `<CgPoints>`: Rotated 4-corner canopy boundaries (`CP-01` through `CP-04`) and every drilled-shaft foundation pier footing (`CP-PIER-01`, etc.).
  - `<Parcels>` & `<Surfaces>`: TIN Surface representation with drainage slopes for stormwater retention.

### Tool 5: Property Digital Twin Layer (`PropertyDetailLayer`)
- Click **`💾 Add Simulation to Property Detail Layer`** to store the canopy configuration, simulated yield, carbon offsets, and structural specs.
- Persisted locally via `localStorage` (`civic_twin_property_twins`) and integrated with the municipal GIS layer.

### Tool 6: Tactical GIS Core (`GISAnalysis.tsx` & `Map.tsx`)
- Centralized GIS layer toggles: Parcels, Hydrology/Watersheds, Municipal Utilities, Transportation, Emergency Response, and Urban Forest Canopy.
- Simulation engines:
  - *Hydrology*: Runoff velocity, drainage basin saturation, stormwater pipe surcharge.
  - *Traffic*: Peak-hour congestion, vehicle trips displaced by micro-mobility.
  - *Mesh Connectivity*: B-LAN node coverage and relay hop latency.

### Tool 7: B-LAN Tactical Mesh & Offline Emergency Hub (`BLanTacticalPanel.tsx`)
- Bluetooth Low Energy (BLE) / Web Bluetooth mesh networking for emergency off-grid city communications.
- Real-time node heartbeats, tactical broadcast dispatch, packet telemetry, and emergency voice broadcast.

### Tool 8: WordPress Plugin Integration (`wordpress-plugin/`)
- Packaged as `Civic_Twin_Angel_Sharks_ap.V.07.zip`.
- Embed shortcodes:
  - `[civic_twin_solar_canopy]`: Embeds the interactive 3D canopy designer on any WordPress page.
  - `[civic_twin_civil3d_proposal]`: Embeds the full proposal generator and LandXML export tool.

---

## 4. Step-by-Step Workflow: From Lot Selection to LandXML & Stakeholder PDF

1. **Open Proposal Studio**: In the top navigation bar, click **"📐 Civil 3D Solar Proposal"**.
2. **Select Parking Lot**: In the left sidebar, pick a preset lot (e.g., *SBCC West Campus Parking Lot*). The map flies to the parcel.
3. **Align Canopy with Aisle**:
   - Click **`📐 Auto-Align with Parking Aisle`** to snap the canopy to the parking striping angle.
   - Or click **`↺ -15°` / `↻ +15°`** on the map floating widget for fine adjustments.
4. **Hit Net-Zero**: Click **`⚡ Auto-Scale Canopy for 100% Net-Zero`**. The canopy expands to cover the optimal number of stalls and sizes the battery.
5. **Run Simulation**: Click **`⚡ Run Historical Irradiance & Yield Simulation`** or click the **"⚡ Simulation"** tab in the header.
6. **Select Climate Scenario**: Test resilience under *TMY3*, *La Niña Marine Fog*, or *2024 Heat Dome*.
7. **Export Stakeholder PDF**: Click **`📑 Stakeholder PDF`** in the header or floating toolbar.
8. **Export LandXML for Civil 3D**: Click **`📐 Download LandXML (.xml)`** to import directly into Autodesk Civil 3D as a TIN surface and survey point group.
9. **Commit to Twin**: Click **`💾 Commit Simulation to Property Detail Layer`** to update the municipal GIS record.
