# Civic Twin — Agent Guidelines & Project Persistent Rules

## Repository & Version Control Configuration
- **Active Repository**: `AngelSharks/Civic-Twin` (URL: `https://github.com/AngelSharks/Civic-Twin`)
- **Main Branch**: `main`
- **Latest Archive URL**: `https://github.com/AngelSharks/Civic-Twin/archive/refs/heads/main.zip`
- **Organizational Accounts**: `Add11` (owner/admin) and `Add12` (collaborator).
- **Daily Backup Policy**: Ensure changes, metadata configurations, and new features are staged with automated GitHub PR creation and manifest snapshots (`civic-twin-manifest.json`).

## Architecture Conventions
- All GIS layers (Parcels, Watershed & Basins, Utilities, Infrastructure, Public Safety, Greenery) are fully typed in `types.ts` and managed via `metadata.gisLayers`.
- Hydrology, Traffic, Connectivity, and Emergency simulation controls are centralized in `GISAnalysis.tsx` and mirrored on the interactive Leaflet `Map.tsx`.
- Keep the Tactical GIS Core navigation formatted in a balanced 2-row layout: Top row (Water & Traffic), Second row (Connectivity & Emergency).

## Open Source & Non-Proprietary Standard
- **No Proprietary Lock-In**: Use exclusively open-source, standard, permissive licensed libraries (MIT, Apache 2.0, BSD) and open web standards.
- **Open Spatial Standards**: Maintain Leaflet, OpenStreetMap, GeoJSON, and W3C open browser APIs for all map rendering, mesh communications, and data simulations.
- **Auditable & Exportable**: All source code, simulation algorithms, and data structures must remain transparent, self-contained, and exportable.

