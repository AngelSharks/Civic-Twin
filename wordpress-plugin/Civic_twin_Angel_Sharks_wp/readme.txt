=== Civic Twin Angel Sharks - Autodesk Civil 3D Solar Canopy Proposal Studio V.07 (City of Santa Barbara, CA Demo) ===
Contributors: Angel Sharks
Donate link: https://angelsharks.net
Tags: santa barbara, civic twin, digital twin, gis, smart city, leaflet, civil 3d, autodesk, solar canopy, landxml, mesh, b-lan, github
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 8.2
Stable tag: 0.7.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Dedicated WordPress Digital Twin & Autodesk Civil 3D Proposal Plugin for the City of Santa Barbara, CA (https://santabarbaraca.gov/) by Angel Sharks. Synchronized with GitHub main fork (AngelSharks/Civic-Twin). Requires PHP 8.2 or higher.

== Description ==

This demo WordPress plugin provides a turnkey digital twin and **Autodesk Civil 3D proposal generator** specifically calibrated for the **City of Santa Barbara, CA** (official website: [santabarbaraca.gov](https://santabarbaraca.gov/)).

It empowers municipal webmasters, civil engineers, and solar developers to propose 100% energy self-sufficient projects by clicking and dragging solar canopy carports over existing parking lots. It generates real-time photovoltaic generation vs property consumption balances, sizes Tesla Megapack BESS storage for microgrid islanding, creates new property detail digital twin layers, and exports ready-to-import Autodesk Civil 3D LandXML 1.2 surface/alignment packages.

### Key Features:
* **Autodesk Civil 3D LandXML 1.2 Export:** Exports exact 3D TIN surfaces, carport stanchion structural pier coordinates, California State Plane Zone V (EPSG:2229) Northing/Easting grid, and parking lane alignments ready for direct import into Autodesk Civil 3D.
* **Click & Drag Solar Canopy Carport Planner:** Interactive Leaflet GIS tool to place, resize, and orient solar carports over Santa Barbara parking lots (SBCC West Campus, Airport, Cabrillo Pavilion, Paseo Nuevo, County Admin, Granada).
* **100% Net-Zero Self-Sufficiency Simulator:** Real-time calculation of annual solar kWh generation, property demand, BESS battery sizing, EV charging station integration, and carbon offsets.
* **Property Detail Digital Twin Layer:** Commit simulations to create persistent property digital twins with complete civil, electrical, and stormwater telemetry.
* **PHP 8.2+ Architecture:** Built with strict typing and modern WordPress coding standards.
* **Synchronized with GitHub Fork:** Tracks `AngelSharks/Civic-Twin` on the `main` branch with automated manifest snapshots.
* **Native Standalone GIS Engine:** Eliminates third-party iframe authentications, resolving Google Cloud Run 401 error screens permanently.

== Installation ==

1. Download `Civic_Twin_Angel_Sharks_ap.V.07.zip`.
2. Ensure your WordPress hosting server is running **PHP 8.2 or higher**.
3. In WordPress Admin, navigate to **Plugins > Add New > Upload Plugin**.
4. Select `Civic_Twin_Angel_Sharks_ap.V.07.zip` and click **Install Now**.
5. Click **Activate Plugin** (or **Replace current with uploaded** if upgrading).
6. Navigate to **SB Civic Twin > Civil 3D Proposals** in your WordPress sidebar to design solar carports and export LandXML packages.

== Shortcodes ==

* `[civic_twin_solar_canopy]` - Embeds the interactive Solar Canopy Carport Click & Drag Designer & 100% Self-Sufficiency Simulator.
* `[civic_twin_civil3d_proposal]` - Embeds the complete Autodesk Civil 3D Proposal Studio, Parking Lot selector, LandXML download, and property layer viewer.
* `[civic_twin_dashboard]` - Embeds the full Santa Barbara interactive Digital Twin matrix.
* `[civic_twin_map]` - Embeds the Santa Barbara Leaflet GIS map with coastal hydrology and transit layers.
* `[civic_twin_member_portal]` - Embeds the Santa Barbara Community Identity & emergency B-LAN portal.
* `[civic_twin_sb_info]` - Displays the official City of Santa Barbara municipal info badge linked to https://santabarbaraca.gov/.

== Changelog ==

= 0.7.0 =
* Version incremented to V.07 (`Civic_Twin_Angel_Sharks_ap.V.07.zip`).
* Added **Real-Time Executive Stakeholder PDF Export Modal Preview** with 5-category summary metadata audit & verification before download.
* Added **Variable 10-Year Annual Cash Flow Ledger** with inline year-by-year overrides for generation, utility tariffs, demand charge shaving, and net annual returns.
* Added **Autodesk AEC Data Model Granular BIM Simulation** with preloaded Civil 3D carport surface models and alignment geometry.
* Standardized WordPress packaging: Guaranteed clean single-folder archive structure for 100% error-free WordPress Upload & Installation.
* Updated GitHub repository token integration for persistent daily backup staging.

= 0.6.0 =
* Version incremented by +0.01 to V.06 (`Civic_Twin_Angel_Sharks_ap.V.06.zip`).
* Added **Autodesk Civil 3D Proposal Studio** with LandXML 1.2 surface, alignment, and column footing exports.
* Added interactive click-and-drag solar canopy carports over existing parking lots.
* Added 100% energy self-sufficiency calculation engine and 1-click auto-scale optimizer.
* Added Property Detail Layer for creating parcel-specific digital twins.
* Added `[civic_twin_solar_canopy]` and `[civic_twin_civil3d_proposal]` shortcodes.
* Added admin menu page: SB Civic Twin > Civil 3D Proposals.

= 0.5.0 =
* Version incremented to V.05 (`Civic_Twin_Angel_Sharks_ap.V.05.zip`).
* Dynamic header badge synchronization in admin template.
* Streamlined demo pages generation.

= 0.2.0 =
* Embedded Native Standalone Leaflet 1.9.4 GIS and hydrological threat simulation engine.
* Real-time storm surge and rainfall intensity dynamic runoff calculations.

= 0.1.0 =
* Initial dedicated demo fork for the City of Santa Barbara, CA.
