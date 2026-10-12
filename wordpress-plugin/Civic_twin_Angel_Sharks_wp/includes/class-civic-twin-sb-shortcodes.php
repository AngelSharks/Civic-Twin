<?php
/**
 * Civic_Twin Santa Barbara Shortcodes Controller (PHP 8.2+)
 * 
 * Provides native, self-contained interactive Santa Barbara Leaflet GIS and NIST Digital Twin shortcodes.
 * Eliminates Google 401 errors by executing natively within WordPress without external iframe authentication hurdles.
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

class Civic_Twin_SB_Shortcodes {

    public static function init(): void {
        add_shortcode('civic_twin_dashboard', array(__CLASS__, 'render_dashboard'));
        add_shortcode('civic_twin_map', array(__CLASS__, 'render_map'));
        add_shortcode('civic_twin_member_portal', array(__CLASS__, 'render_member_portal'));
        add_shortcode('civic_twin_sb_info', array(__CLASS__, 'render_sb_info'));
        add_shortcode('civic_twin_solar_canopy', array(__CLASS__, 'render_solar_canopy'));
        add_shortcode('civic_twin_civil3d_proposal', array(__CLASS__, 'render_civil3d_proposal'));
    }

    /**
     * [civic_twin_dashboard]
     * Renders the complete Santa Barbara Digital Twin Matrix
     */
    public static function render_dashboard(array|string $atts): string {
        $atts = shortcode_atts(array(
            'height' => '720px',
            'border_radius' => '1.5rem',
            'mode' => ''
        ), (array)$atts, 'civic_twin_dashboard');

        $embed_mode = !empty($atts['mode']) ? sanitize_text_field($atts['mode']) : (string)get_option('civic_twin_sb_embed_mode', 'native');
        $city_name = (string)get_option('civic_twin_sb_city_name', CIVIC_TWIN_SB_DEFAULT_CITY);
        $city_website = (string)get_option('civic_twin_sb_city_website', CIVIC_TWIN_SB_DEFAULT_WEBSITE);
        $city_lat = (string)get_option('civic_twin_sb_city_lat', (string)CIVIC_TWIN_SB_DEFAULT_LAT);
        $city_lng = (string)get_option('civic_twin_sb_city_lng', (string)CIVIC_TWIN_SB_DEFAULT_LNG);
        $city_hall = (string)get_option('civic_twin_sb_city_hall', CIVIC_TWIN_SB_DEFAULT_ADDRESS);
        $accent_color = sanitize_hex_color((string)get_option('civic_twin_sb_theme_accent', '#0284c7'));

        // NATIVE MODE ONLY (Zero 401 errors - runs 100% self-contained in WordPress)
        ob_start();
        ?>
        <div class="ct-public-container" id="ct-sb-main-wrapper" style="--ct-accent-color: <?php echo esc_attr($accent_color); ?>;">
            
            <!-- ONBOARDING & CALIBRATION QUESTIONS WIZARD (Steps 1-5 Pre-answered for Santa Barbara Demo) -->
            <div id="ct-sb-wizard-container" class="ct-wizard-card" style="display: none;">
                
                <!-- STEP 1: INITIALIZE CIVIC TWIN -->
                <div class="ct-wizard-step" id="ct-step-1">
                    <div class="ct-wizard-header">
                        <span class="ct-wizard-step-tag"><?php _e('Step 1 of 5 • Region Calibration', 'civic-twin-sb'); ?></span>
                        <h2 class="ct-wizard-title"><?php _e('Initialize Civic Twin', 'civic-twin-sb'); ?></h2>
                        <p class="ct-wizard-desc"><?php _e('Calibrate your physical municipal region for spatial simulation.', 'civic-twin-sb'); ?></p>
                    </div>

                    <!-- Santa Barbara Demo Preset Banner -->
                    <div class="ct-preset-banner">
                        <div class="ct-preset-info">
                            <span class="ct-preset-icon">🌊</span>
                            <div>
                                <div class="ct-preset-name"><?php _e('City of Santa Barbara, CA Demo', 'civic-twin-sb'); ?></div>
                                <div class="ct-preset-meta">santabarbaraca.gov • Pre-calibrated GIS Centroid (34.4208° N, -119.6982° W)</div>
                            </div>
                        </div>
                        <button type="button" class="ct-btn-load-preset" id="ct-btn-preset-sb">
                            <?php _e('Load Preset', 'civic-twin-sb'); ?>
                        </button>
                    </div>

                    <form id="ct-form-step-1" class="ct-wizard-form">
                        <div class="ct-form-group">
                            <label class="ct-form-label"><?php _e('Community Identity', 'civic-twin-sb'); ?></label>
                            <input type="text" id="ct-input-city-name" class="ct-input" value="<?php echo esc_attr($city_name); ?>" required placeholder="e.g. City of Santa Barbara, CA" />
                        </div>

                        <div class="ct-form-group">
                            <label class="ct-form-label"><?php _e('Official Address / Headquarters', 'civic-twin-sb'); ?></label>
                            <input type="text" id="ct-input-city-address" class="ct-input" value="<?php echo esc_attr($city_hall); ?>" required placeholder="e.g. 735 Anacapa Street, Santa Barbara, CA 93101" />
                        </div>

                        <div class="ct-form-group">
                            <label class="ct-form-label"><?php _e('Jurisdiction Type', 'civic-twin-sb'); ?></label>
                            <select id="ct-input-city-type" class="ct-select">
                                <option value="City" selected>City / Municipality</option>
                                <option value="County">County</option>
                                <option value="District">Water / Utility District</option>
                                <option value="Regional">Regional Council of Governments</option>
                            </select>
                        </div>

                        <div class="ct-wizard-actions">
                            <button type="button" class="ct-btn-launch-direct" id="ct-btn-skip-to-twin">
                                ⚡ <?php _e('Fast-Launch Santa Barbara Twin', 'civic-twin-sb'); ?>
                            </button>
                            <button type="submit" class="ct-btn-primary" id="ct-btn-step1-next">
                                <?php _e('Next: Scan GIS Portals →', 'civic-twin-sb'); ?>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- STEP 1.5: SEARCHING GIS PORTALS (EXACT SCREENSHOT 2 REPRODUCTION) -->
                <div class="ct-wizard-step" id="ct-step-1-5" style="display: none;">
                    <div class="ct-scanning-card">
                        <div class="ct-scanning-icon-wrap">
                            <span class="ct-scanning-icon">🔍</span>
                        </div>
                        <h2 class="ct-scanning-title"><?php _e('Searching GIS Portals', 'civic-twin-sb'); ?></h2>
                        <p class="ct-scanning-subtitle">
                            Gemini is scanning for official Open Data repositories for <span id="ct-scan-city-label"><?php echo esc_html($city_name); ?></span>...
                        </p>
                        <div class="ct-scan-progress-bar">
                            <div class="ct-scan-progress-fill" id="ct-scan-fill"></div>
                        </div>
                        <div class="ct-scan-log" id="ct-scan-log-text">
                            Querying santabarbaraca.gov GIS REST endpoints &amp; USGS HUC-12 Mission Creek basins...
                        </div>
                    </div>
                </div>

                <!-- STEP 2: CONNECT PORTAL -->
                <div class="ct-wizard-step" id="ct-step-2" style="display: none;">
                    <div class="ct-wizard-header">
                        <span class="ct-wizard-step-tag"><?php _e('Step 2 of 5 • Municipal Ingestion', 'civic-twin-sb'); ?></span>
                        <h2 class="ct-wizard-title"><?php _e('Connect Portal', 'civic-twin-sb'); ?></h2>
                        <p class="ct-wizard-desc"><?php _e('Link your official city website for AI spatial data scraping.', 'civic-twin-sb'); ?></p>
                    </div>

                    <form id="ct-form-step-2" class="ct-wizard-form">
                        <div class="ct-form-group">
                            <label class="ct-form-label"><?php _e('Official Website / GIS Hub', 'civic-twin-sb'); ?></label>
                            <input type="url" id="ct-input-official-url" class="ct-input" value="<?php echo esc_attr($city_website); ?>" required placeholder="https://santabarbaraca.gov/" />
                        </div>

                        <!-- Suggested Portals Found from Scan -->
                        <div class="ct-suggested-portals-box">
                            <div class="ct-suggested-title">✓ <?php _e('Official Santa Barbara GIS Portals Identified:', 'civic-twin-sb'); ?></div>
                            <div class="ct-suggested-tags">
                                <button type="button" class="ct-portal-pill" data-url="https://santabarbaraca.gov/maps">
                                    🌐 santabarbaraca.gov/maps
                                </button>
                                <button type="button" class="ct-portal-pill" data-url="https://open-data.santabarbaraca.gov/">
                                    📊 open-data.santabarbaraca.gov
                                </button>
                                <button type="button" class="ct-portal-pill" data-url="https://santabarbara.maps.arcgis.com/">
                                    🗺️ santabarbara.maps.arcgis.com
                                </button>
                            </div>
                        </div>

                        <div class="ct-wizard-actions">
                            <button type="button" class="ct-btn-secondary ct-step-back" data-target="1">
                                ← <?php _e('Back', 'civic-twin-sb'); ?>
                            </button>
                            <button type="submit" class="ct-btn-primary">
                                <?php _e('Next: Strategy Selection →', 'civic-twin-sb'); ?>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- STEP 3: GIS DATA STRATEGY -->
                <div class="ct-wizard-step" id="ct-step-3" style="display: none;">
                    <div class="ct-wizard-header">
                        <span class="ct-wizard-step-tag"><?php _e('Step 3 of 5 • Data Ingestion', 'civic-twin-sb'); ?></span>
                        <h2 class="ct-wizard-title"><?php _e('GIS Data Strategy', 'civic-twin-sb'); ?></h2>
                        <p class="ct-wizard-desc"><?php _e('Select how spatial layers (parcels, hydrology, utilities) will be ingested.', 'civic-twin-sb'); ?></p>
                    </div>

                    <div class="ct-strategy-grid">
                        <button type="button" class="ct-strategy-card primary" id="ct-btn-strategy-defaults">
                            <div class="ct-strat-top">
                                <span class="ct-strat-icon">⚡</span>
                                <span class="ct-strat-badge"><?php _e('Recommended for Demo', 'civic-twin-sb'); ?></span>
                            </div>
                            <h3 class="ct-strat-title"><?php _e('Use AI Data Defaults', 'civic-twin-sb'); ?></h3>
                            <p class="ct-strat-desc">
                                Automatically loads calibrated Santa Barbara front-country layers: Mission Creek Basin, Arroyo Burro Basin, Stearns Wharf, and B-LAN mesh relays.
                            </p>
                            <div class="ct-strat-footer">
                                <span><?php _e('Fast Ingestion (0s latency)', 'civic-twin-sb'); ?></span>
                                <span>→</span>
                            </div>
                        </button>

                        <button type="button" class="ct-strategy-card" id="ct-btn-strategy-custom">
                            <div class="ct-strat-top">
                                <span class="ct-strat-icon">🛠️</span>
                                <span class="ct-strat-badge secondary"><?php _e('Advanced', 'civic-twin-sb'); ?></span>
                            </div>
                            <h3 class="ct-strat-title"><?php _e('Add Custom GIS Layers', 'civic-twin-sb'); ?></h3>
                            <p class="ct-strat-desc">
                                Provide custom GeoJSON or FeatureLayer endpoints for municipal parcels, underground utilities, and evacuation corridors.
                            </p>
                            <div class="ct-strat-footer">
                                <span><?php _e('Configure Endpoints', 'civic-twin-sb'); ?></span>
                                <span>→</span>
                            </div>
                        </button>
                    </div>

                    <div class="ct-wizard-actions">
                        <button type="button" class="ct-btn-secondary ct-step-back" data-target="2">
                            ← <?php _e('Back', 'civic-twin-sb'); ?>
                        </button>
                    </div>
                </div>

                <!-- STEP 4: CONFIGURE GIS LAYERS -->
                <div class="ct-wizard-step" id="ct-step-4" style="display: none;">
                    <div class="ct-wizard-header">
                        <span class="ct-wizard-step-tag"><?php _e('Step 4 of 5 • Spatial Endpoints', 'civic-twin-sb'); ?></span>
                        <h2 class="ct-wizard-title"><?php _e('Configure GIS Layers', 'civic-twin-sb'); ?></h2>
                        <p class="ct-wizard-desc"><?php _e('Provide spatial endpoints (GeoJSON / FeatureServer) for modeling.', 'civic-twin-sb'); ?></p>
                    </div>

                    <form id="ct-form-step-4" class="ct-wizard-form">
                        <div class="ct-gis-inputs-grid">
                            <div class="ct-form-group">
                                <label class="ct-form-label"><?php _e('Parcel Boundaries', 'civic-twin-sb'); ?></label>
                                <input type="url" class="ct-input" value="https://santabarbaraca.gov/api/gis/parcels" placeholder="https://gis.santabarbaraca.gov/api/parcels" />
                            </div>
                            <div class="ct-form-group">
                                <label class="ct-form-label"><?php _e('Watershed & Basin Boundaries', 'civic-twin-sb'); ?></label>
                                <input type="url" class="ct-input" value="https://santabarbaraca.gov/api/gis/watershed" placeholder="https://gis.santabarbaraca.gov/api/watershed" />
                            </div>
                            <div class="ct-form-group">
                                <label class="ct-form-label"><?php _e('Underground Utilities', 'civic-twin-sb'); ?></label>
                                <input type="url" class="ct-input" value="https://santabarbaraca.gov/api/gis/utilities" placeholder="https://gis.santabarbaraca.gov/api/utilities" />
                            </div>
                            <div class="ct-form-group">
                                <label class="ct-form-label"><?php _e('Public Green Space', 'civic-twin-sb'); ?></label>
                                <input type="url" class="ct-input" value="https://santabarbaraca.gov/api/gis/greenery" placeholder="https://gis.santabarbaraca.gov/api/greenery" />
                            </div>
                            <div class="ct-form-group">
                                <label class="ct-form-label"><?php _e('General Infrastructure', 'civic-twin-sb'); ?></label>
                                <input type="url" class="ct-input" value="https://santabarbaraca.gov/api/gis/infrastructure" placeholder="https://gis.santabarbaraca.gov/api/infrastructure" />
                            </div>
                            <div class="ct-form-group">
                                <label class="ct-form-label"><?php _e('Public Safety Nodes', 'civic-twin-sb'); ?></label>
                                <input type="url" class="ct-input" value="https://santabarbaraca.gov/api/gis/safety" placeholder="https://gis.santabarbaraca.gov/api/safety" />
                            </div>
                        </div>

                        <div class="ct-wizard-actions">
                            <button type="button" class="ct-btn-secondary ct-step-back" data-target="3">
                                ← <?php _e('Back', 'civic-twin-sb'); ?>
                            </button>
                            <button type="submit" class="ct-btn-primary">
                                <?php _e('Next: Define CIDs →', 'civic-twin-sb'); ?>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- STEP 5: DEFINE COMMUNITY IDENTIFIERS (CIDS) -->
                <div class="ct-wizard-step" id="ct-step-5" style="display: none;">
                    <div class="ct-wizard-header">
                        <span class="ct-wizard-step-tag"><?php _e('Step 5 of 5 • Decentralized B-LAN Mesh', 'civic-twin-sb'); ?></span>
                        <h2 class="ct-wizard-title"><?php _e('Define Community IDs', 'civic-twin-sb'); ?></h2>
                        <p class="ct-wizard-desc"><?php _e('Link local Community Identifiers (CIDs) to your Wi-Fi Mesh Fog network (B-lan).', 'civic-twin-sb'); ?></p>
                    </div>

                    <div class="ct-cid-creator">
                        <div class="ct-cid-input-row">
                            <input type="text" id="ct-new-cid-input" class="ct-input" placeholder="e.g. Waterfront & Harbor Patrol CID" />
                            <button type="button" id="ct-btn-add-cid" class="ct-btn-primary">
                                + <?php _e('Add CID', 'civic-twin-sb'); ?>
                            </button>
                        </div>

                        <div class="ct-cid-list" id="ct-cid-list-container">
                            <div class="ct-cid-item">
                                <div>
                                    <strong class="ct-cid-item-name">Santa Barbara Central CID</strong>
                                    <span class="ct-cid-item-sub">Population: 1,200 • Mesh Active</span>
                                </div>
                                <span class="ct-cid-badge">CID-772</span>
                            </div>
                            <div class="ct-cid-item">
                                <div>
                                    <strong class="ct-cid-item-name">Santa Barbara Highlands CID</strong>
                                    <span class="ct-cid-item-sub">Population: 850 • Mesh Active</span>
                                </div>
                                <span class="ct-cid-badge">CID-104</span>
                            </div>
                            <div class="ct-cid-item">
                                <div>
                                    <strong class="ct-cid-item-name">Waterfront &amp; Harbor Patrol CID</strong>
                                    <span class="ct-cid-item-sub">Population: 620 • Marine Mesh Active</span>
                                </div>
                                <span class="ct-cid-badge">CID-308</span>
                            </div>
                        </div>
                    </div>

                    <div class="ct-wizard-actions">
                        <button type="button" class="ct-btn-secondary ct-step-back" data-target="3">
                            ← <?php _e('Back', 'civic-twin-sb'); ?>
                        </button>
                        <button type="button" class="ct-btn-launch-core" id="ct-btn-launch-final">
                            🚀 <?php _e('Launch Digital Twin Core', 'civic-twin-sb'); ?>
                        </button>
                    </div>
                </div>

            </div>

            <!-- TACTICAL DIGITAL TWIN RUNTIME (LEAFLET + HYDROLOGY HUD) - Displayed Immediately for Santa Barbara Visitors -->
            <div class="ct-native-twin-wrap" id="ct-sb-twin-root" style="display: block;">
                
                <!-- Municipal Header -->
                <div class="ct-frame-header">
                    <div class="ct-frame-brand">
                        <span class="ct-indicator online"></span>
                        <span class="ct-header-title">🌊 <span id="ct-hdr-city-name"><?php echo esc_html(strtoupper($city_name)); ?></span> — TACTICAL DIGITAL TWIN</span>
                        <span class="ct-chip-pill" style="background:#059669; color:#fff; font-weight:700;">✓ PRE-CALIBRATED DEMO</span>
                        <span class="ct-chip-pill">NATIVE LEAFLET GIS</span>
                    </div>
                    <div class="ct-frame-actions">
                        <button type="button" class="ct-btn-recalibrate" id="ct-btn-recalibrate" title="View or edit pre-calibrated Steps 1-5">
                            ⚙️ <?php _e('Calibration Settings (Steps 1-5)', 'civic-twin-sb'); ?>
                        </button>
                        <a href="<?php echo esc_url($city_website); ?>" target="_blank" rel="noopener noreferrer" class="ct-btn-header-link">
                            🏛️ <?php _e('santabarbaraca.gov', 'civic-twin-sb'); ?> ↗
                        </a>
                        <button type="button" class="ct-btn-toggle-fs" id="ct-btn-toggle-fullscreen" title="Toggle Fullscreen">
                            ⛶ <?php _e('Fullscreen', 'civic-twin-sb'); ?>
                        </button>
                    </div>
                </div>

            <!-- Top Telemetry Ribbon (NIST Metrics) -->
            <div class="ct-telemetry-ribbon">
                <div class="ct-telemetry-card">
                    <span class="ct-telem-label">Mission Creek Discharge</span>
                    <div class="ct-telem-val-wrap">
                        <span class="ct-telem-val" id="ct-val-discharge">14.2</span>
                        <span class="ct-telem-unit">m³/s</span>
                    </div>
                    <span class="ct-telem-status normal" id="ct-status-discharge">Nominal Capacity</span>
                </div>

                <div class="ct-telemetry-card">
                    <span class="ct-telem-label">Watershed Saturation</span>
                    <div class="ct-telem-val-wrap">
                        <span class="ct-telem-val" id="ct-val-saturation">64</span>
                        <span class="ct-telem-unit">%</span>
                    </div>
                    <span class="ct-telem-status normal" id="ct-status-saturation">Moderate Infiltration</span>
                </div>

                <div class="ct-telemetry-card">
                    <span class="ct-telem-label">B-LAN Mesh Relay Status</span>
                    <div class="ct-telem-val-wrap">
                        <span class="ct-telem-val" id="ct-val-mesh">4/4</span>
                        <span class="ct-telem-unit">Nodes</span>
                    </div>
                    <span class="ct-telem-status active">915 MHz Operational</span>
                </div>

                <div class="ct-telemetry-card">
                    <span class="ct-telem-label">Evacuation Readiness</span>
                    <div class="ct-telem-val-wrap">
                        <span class="ct-telem-val" id="ct-val-evac">Grade A</span>
                    </div>
                    <span class="ct-telem-status active">Corridors Open</span>
                </div>
            </div>

            <!-- Main Interactive Body (Map + Simulation Controls) -->
            <div class="ct-main-workspace" style="min-height: <?php echo esc_attr($atts['height']); ?>;">
                
                <!-- Leaflet Spatial Map -->
                <div class="ct-map-pane">
                    <!-- Layer Filter Bar -->
                    <div class="ct-map-layer-bar">
                        <span class="ct-layer-bar-label">GIS Layers:</span>
                        <button type="button" class="ct-layer-btn active" data-layer="all">🌐 All Layers</button>
                        <button type="button" class="ct-layer-btn active" data-layer="watersheds">💧 Watersheds</button>
                        <button type="button" class="ct-layer-btn active" data-layer="mesh">📡 B-LAN Mesh</button>
                        <button type="button" class="ct-layer-btn active" data-layer="transit">🚗 Corridors</button>
                        <button type="button" class="ct-layer-btn" id="ct-btn-recenter" title="Recenter on City Hall">📍 Recenter</button>
                    </div>

                    <!-- The Map Container -->
                    <div id="ct-sb-leaflet-map" class="ct-leaflet-container" style="height: calc(<?php echo esc_attr($atts['height']); ?> - 50px);"></div>
                </div>

                <!-- Interactive Simulation & Mesh HUD -->
                <div class="ct-controls-pane">
                    
                    <!-- Hydrology Simulation Panel -->
                    <div class="ct-control-card">
                        <div class="ct-control-header">
                            <h4>🌧️ Mission Creek Hydrology Sim</h4>
                            <span class="ct-badge-indicator" id="ct-threat-badge">Stage 1: Normal</span>
                        </div>
                        <p class="ct-control-desc">Adjust synthetic precipitation rate to test Mission Creek basin runoff thresholds.</p>

                        <div class="ct-slider-group">
                            <div class="ct-slider-label">
                                <span>Rainfall Intensity:</span>
                                <strong id="ct-label-rainfall">22 mm/hr</strong>
                            </div>
                            <input type="range" id="ct-slider-rainfall" min="0" max="150" value="22" step="1" class="ct-range" />
                            <div class="ct-slider-ticks">
                                <span>0 (Dry)</span>
                                <span>50 (Heavy)</span>
                                <span>100 (100-Yr)</span>
                                <span>150 (Extreme)</span>
                            </div>
                        </div>

                        <div class="ct-slider-group" style="margin-top: 14px;">
                            <div class="ct-slider-label">
                                <span>Coastal Storm Surge:</span>
                                <strong id="ct-label-surge">0.8 m</strong>
                            </div>
                            <input type="range" id="ct-slider-surge" min="0" max="4.5" value="0.8" step="0.1" class="ct-range" />
                        </div>

                        <div class="ct-sim-btn-row">
                            <button type="button" class="ct-btn-action" id="ct-btn-simulate-flood">
                                ⚡ Trigger 100-Yr Storm Event
                            </button>
                            <button type="button" class="ct-btn-action secondary" id="ct-btn-reset-sim">
                                🔄 Reset
                            </button>
                        </div>
                    </div>

                    <!-- B-LAN Emergency Mesh Panel -->
                    <div class="ct-control-card">
                        <div class="ct-control-header">
                            <h4>📡 Tactical B-LAN Mesh Nodes</h4>
                            <span class="ct-badge-indicator green">4 Nodes Active</span>
                        </div>
                        <p class="ct-control-desc">Real-time telemetry from Santa Barbara front-country decentralized relay beacons.</p>

                        <ul class="ct-mesh-node-list">
                            <li class="ct-mesh-node-item">
                                <div class="ct-node-info">
                                    <span class="ct-node-name">🏛️ City Hall Primary (Root)</span>
                                    <span class="ct-node-meta">735 Anacapa St • 915.2 MHz</span>
                                </div>
                                <span class="ct-node-ping" id="ct-ping-node-1">11ms • -58dBm</span>
                            </li>
                            <li class="ct-mesh-node-item">
                                <div class="ct-node-info">
                                    <span class="ct-node-name">🏥 Cottage Hospital Relay</span>
                                    <span class="ct-node-meta">Pueblo St • Trauma Center Link</span>
                                </div>
                                <span class="ct-node-ping" id="ct-ping-node-2">16ms • -69dBm</span>
                            </li>
                            <li class="ct-mesh-node-item">
                                <div class="ct-node-info">
                                    <span class="ct-node-name">⚓ Harbor Waterfront Patrol</span>
                                    <span class="ct-node-meta">Cabrillo Blvd • Marine Zone</span>
                                </div>
                                <span class="ct-node-ping" id="ct-ping-node-3">14ms • -64dBm</span>
                            </li>
                            <li class="ct-mesh-node-item">
                                <div class="ct-node-info">
                                    <span class="ct-node-name">✈️ SB Airport Corridor Link</span>
                                    <span class="ct-node-meta">Hollister Ave • West Gateway</span>
                                </div>
                                <span class="ct-node-ping" id="ct-ping-node-4">22ms • -74dBm</span>
                            </li>
                        </ul>

                        <div style="margin-top: 12px;">
                            <button type="button" class="ct-btn-action" id="ct-btn-broadcast-ping" style="background:#059669;">
                                📡 Broadcast Emergency Mesh Ping
                            </button>
                        </div>
                        <div class="ct-mesh-log" id="ct-mesh-terminal-log">
                            <div>[B-LAN] Mesh ready. Encryption: ChaCha20-Poly1305.</div>
                        </div>
                    </div>

                    <!-- Municipal Info Badge -->
                    <div class="ct-control-card ct-card-mini-info">
                        <div class="ct-mini-info-row">
                            <strong>Official Portal:</strong>
                            <a href="<?php echo esc_url($city_website); ?>" target="_blank" rel="noopener noreferrer">
                                santabarbaraca.gov ↗
                            </a>
                        </div>
                        <div class="ct-mini-info-row">
                            <strong>Headquarters:</strong>
                            <span><?php echo esc_html($city_hall); ?></span>
                        </div>
                        <div class="ct-mini-info-row">
                            <strong>Spatial Centroid:</strong>
                            <span><?php echo esc_html($city_lat); ?>° N, <?php echo esc_html($city_lng); ?>° W</span>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Footer Attribution -->
            <div class="ct-native-footer">
                <span>Angel Sharks Civic Twin • City of Santa Barbara, CA Demonstration Edition • PHP 8.2+ Architecture</span>
            </div>
        </div>
        </div>
        <?php
        return (string)ob_get_clean();
    }

    /**
     * [civic_twin_map]
     * Standalone high-resolution Leaflet GIS map with Santa Barbara layers
     */
    public static function render_map(array|string $atts): string {
        $atts = shortcode_atts(array(
            'height' => '650px',
            'border_radius' => '1.5rem',
        ), (array)$atts, 'civic_twin_map');

        $city_name = (string)get_option('civic_twin_sb_city_name', CIVIC_TWIN_SB_DEFAULT_CITY);
        $city_website = (string)get_option('civic_twin_sb_city_website', CIVIC_TWIN_SB_DEFAULT_WEBSITE);
        $accent_color = sanitize_hex_color((string)get_option('civic_twin_sb_theme_accent', '#0284c7'));

        ob_start();
        ?>
        <div class="ct-public-container" style="--ct-accent-color: <?php echo esc_attr($accent_color); ?>;">
            <div class="ct-frame-header">
                <div class="ct-frame-brand">
                    <span class="ct-indicator online"></span>
                    <span>🗺️ <?php echo esc_html(strtoupper($city_name)); ?> — SPATIAL GIS & HYDROLOGY</span>
                </div>
                <div class="ct-frame-actions">
                    <a href="<?php echo esc_url($city_website); ?>" target="_blank" rel="noopener noreferrer" class="ct-btn-header-link">
                        🏛️ santabarbaraca.gov ↗
                    </a>
                </div>
            </div>

            <div class="ct-map-layer-bar">
                <span class="ct-layer-bar-label">Layers:</span>
                <button type="button" class="ct-layer-btn active" data-layer="all">🌐 All Layers</button>
                <button type="button" class="ct-layer-btn active" data-layer="watersheds">💧 Watersheds</button>
                <button type="button" class="ct-layer-btn active" data-layer="mesh">📡 Mesh Nodes</button>
                <button type="button" class="ct-layer-btn active" data-layer="transit">🚗 Corridors</button>
            </div>

            <div id="ct-sb-leaflet-map-standalone" class="ct-leaflet-container" style="height: <?php echo esc_attr($atts['height']); ?>; border-radius: 0 0 1.2rem 1.2rem;"></div>
        </div>
        <?php
        return (string)ob_get_clean();
    }

    /**
     * [civic_twin_member_portal]
     * Santa Barbara Resident Community Identity & B-LAN Mesh Gateway
     */
    public static function render_member_portal(array|string $atts): string {
        $atts = shortcode_atts(array(
            'height' => '650px',
            'border_radius' => '1.5rem',
        ), (array)$atts, 'civic_twin_member_portal');

        $city_name = (string)get_option('civic_twin_sb_city_name', CIVIC_TWIN_SB_DEFAULT_CITY);
        $city_website = (string)get_option('civic_twin_sb_city_website', CIVIC_TWIN_SB_DEFAULT_WEBSITE);

        ob_start();
        ?>
        <div class="ct-public-container">
            <div class="ct-frame-header">
                <div class="ct-frame-brand">
                    <span class="ct-indicator online"></span>
                    <span>🛡️ <?php echo esc_html(strtoupper($city_name)); ?> — RESIDENT IDENTITY &amp; MESH PORTAL</span>
                </div>
                <div class="ct-frame-actions">
                    <a href="<?php echo esc_url($city_website); ?>" target="_blank" rel="noopener noreferrer" class="ct-btn-header-link">
                        santabarbaraca.gov ↗
                    </a>
                </div>
            </div>

            <div class="ct-member-portal-body" style="min-height: <?php echo esc_attr($atts['height']); ?>; border-radius: 0 0 1.2rem 1.2rem;">
                <div class="ct-portal-grid">
                    
                    <!-- Resident Registration Card -->
                    <div class="ct-portal-card">
                        <h3>👤 Santa Barbara Resident Enrollment</h3>
                        <p>Generate your decentralized Community Identity (CID) for localized municipal hazard updates and offline B-LAN beacon reception.</p>

                        <form id="ct-resident-form" class="ct-resident-form" onsubmit="event.preventDefault(); alert('✅ Community Identity CID generated for Santa Barbara node!');">
                            <div class="ct-form-group">
                                <label>Resident Name / Handle:</label>
                                <input type="text" required placeholder="e.g. Elena Vance" class="ct-input" />
                            </div>
                            <div class="ct-form-group">
                                <label>Neighborhood Zone:</label>
                                <select class="ct-input">
                                    <option>Downtown / State St District</option>
                                    <option>The Riviera / Foothills</option>
                                    <option>The Mesa / Coastal Bluff</option>
                                    <option>Waterfront &amp; West Beach</option>
                                    <option>Upper State &amp; San Roque</option>
                                </select>
                            </div>
                            <div class="ct-form-group">
                                <label>B-LAN Radio Channel:</label>
                                <input type="text" value="Channel 915.2 MHz (Emergency Public)" readonly class="ct-input disabled" />
                            </div>
                            <button type="submit" class="ct-btn-action" style="background:#0284c7; width:100%; margin-top:12px;">
                                🛡️ Register Resident CID Keypair
                            </button>
                        </form>
                    </div>

                    <!-- Tactical Mesh Dispatch Simulator -->
                    <div class="ct-portal-card">
                        <h3>📡 Offline Tactical Mesh Communicator</h3>
                        <p>Simulate broadcasting peer-to-peer neighborhood mesh notifications when cellular towers or internet infrastructure are offline.</p>

                        <div class="ct-mesh-feed" id="ct-resident-mesh-feed">
                            <div class="feed-item">[MUNICIPAL NOTICE] Santa Barbara Harbor storm surge sensors calibrated. Water level normal.</div>
                            <div class="feed-item">[B-LAN RELAY] City Hall Root Node reporting 100% mesh coverage across Downtown.</div>
                            <div class="feed-item">[WEATHER] Rain gauge: 22 mm/hr in Mission Canyon. Runoff channels clear.</div>
                        </div>

                        <div class="ct-broadcast-input-row" style="margin-top: 14px;">
                            <input type="text" id="ct-mesh-input-msg" placeholder="Type tactical message to broadcast..." class="ct-input" />
                            <button type="button" class="ct-btn-action" id="ct-btn-send-mesh-msg" style="width: auto; padding: 10px 18px;">
                                📨 Broadcast
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
        <?php
        return (string)ob_get_clean();
    }

    /**
     * [civic_twin_sb_info]
     * Displays a municipal info card connecting to https://santabarbaraca.gov/
     */
    public static function render_sb_info(array|string $atts = array()): string {
        $city_name = (string)get_option('civic_twin_sb_city_name', CIVIC_TWIN_SB_DEFAULT_CITY);
        $city_website = (string)get_option('civic_twin_sb_city_website', CIVIC_TWIN_SB_DEFAULT_WEBSITE);
        $city_hall = (string)get_option('civic_twin_sb_city_hall', CIVIC_TWIN_SB_DEFAULT_ADDRESS);
        $city_lat = (string)get_option('civic_twin_sb_city_lat', (string)CIVIC_TWIN_SB_DEFAULT_LAT);
        $city_lng = (string)get_option('civic_twin_sb_city_lng', (string)CIVIC_TWIN_SB_DEFAULT_LNG);

        ob_start();
        ?>
        <div class="ct-sb-info-card">
            <div class="ct-sb-info-header">
                <div class="ct-sb-icon">🏛️</div>
                <div>
                    <h3><?php echo esc_html($city_name); ?> — Civic Twin Demo Information</h3>
                    <p><?php _e('NIST Urban Resilience & B-LAN Mesh Simulation Calibration', 'civic-twin-sb'); ?></p>
                </div>
            </div>
            <div class="ct-sb-info-body">
                <div class="ct-sb-info-col">
                    <span class="label"><?php _e('Official Municipal Website:', 'civic-twin-sb'); ?></span>
                    <a href="<?php echo esc_url($city_website); ?>" target="_blank" rel="noopener noreferrer" class="link">
                        <?php echo esc_html($city_website); ?> ↗
                    </a>
                </div>
                <div class="ct-sb-info-col">
                    <span class="label"><?php _e('City Hall Headquarters:', 'civic-twin-sb'); ?></span>
                    <span class="val"><?php echo esc_html($city_hall); ?></span>
                </div>
                <div class="ct-sb-info-col">
                    <span class="label"><?php _e('Geospatial Centroid:', 'civic-twin-sb'); ?></span>
                    <span class="val"><?php echo esc_html($city_lat); ?>° N, <?php echo esc_html($city_lng); ?>° W</span>
                </div>
                <div class="ct-sb-info-col">
                    <span class="label"><?php _e('Key GIS Layers:', 'civic-twin-sb'); ?></span>
                    <span class="val">Mission Creek Basin, Harbor Marine Zone, MTD Transit Network</span>
                </div>
            </div>
            <div class="ct-sb-info-footer">
                <span>Angel Sharks Civic Twin Demonstration Edition | Designed for WordPress on PHP 8.2+</span>
            </div>
        </div>
        <?php
        return (string)ob_get_clean();
    }

    /**
     * [civic_twin_solar_canopy]
     * Interactive Click-to-Add Solar Canopy Carport & 100% Self-Sufficiency Simulator
     */
    public static function render_solar_canopy(array|string $atts = array()): string {
        return self::render_civil3d_proposal($atts);
    }

    /**
     * [civic_twin_civil3d_proposal]
     * Complete Autodesk Civil 3D Proposal Studio & LandXML 1.2 Exporter
     */
    public static function render_civil3d_proposal(array|string $atts = array()): string {
        $atts = shortcode_atts(array(
            'height' => '720px',
            'apn' => '045-120-019',
            'stalls' => '260'
        ), (array)$atts, 'civic_twin_civil3d_proposal');

        $city_name = (string)get_option('civic_twin_sb_city_name', CIVIC_TWIN_SB_DEFAULT_CITY);
        $accent_color = sanitize_hex_color((string)get_option('civic_twin_sb_theme_accent', '#0284c7'));
        $instance_id = 'ct-civil3d-' . wp_rand(1000, 9999);

        ob_start();
        ?>
        <div class="ct-public-container ct-civil3d-proposal-container" id="<?php echo esc_attr($instance_id); ?>" style="--ct-accent-color: <?php echo esc_attr($accent_color); ?>; background: #020617; color: #f8fafc; border-radius: 1.5rem; overflow: hidden; border: 1px solid #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px 0;">
            
            <!-- Header Bar -->
            <div style="padding: 16px 24px; background: #0f172a; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 36px; height: 36px; background: #f59e0b; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                        ☀️
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h3 style="margin: 0; color: #fff; font-size: 16px; font-weight: 900; letter-spacing: -0.02em;">
                                Autodesk Civil 3D Solar Canopy Proposal Studio
                            </h3>
                            <span style="background: rgba(14, 165, 233, 0.2); color: #38bdf8; border: 1px solid #0284c7; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 900; text-transform: uppercase;">
                                Edition V.07
                            </span>
                        </div>
                        <p style="margin: 2px 0 0 0; color: #94a3b8; font-size: 11px;">
                            <?php echo esc_html($city_name); ?> • Click &amp; Drag Solar Carports • 100% Net-Zero Simulation • LandXML 1.2 Export
                        </p>
                    </div>
                </div>

                <div style="display: flex; gap: 8px;">
                    <button type="button" class="ct-c3d-tab-btn active" data-tab="designer" style="background: #0284c7; color: #fff; border: none; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer;">
                        🎯 Canopy Planner
                    </button>
                    <button type="button" class="ct-c3d-tab-btn" data-tab="property-twin" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer;">
                        🏛️ Property Digital Twin
                    </button>
                    <button type="button" class="ct-c3d-tab-btn" data-tab="landxml" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer;">
                        📐 Civil 3D LandXML
                    </button>
                </div>
            </div>

            <!-- Tab 1: Interactive Designer -->
            <div class="ct-c3d-tab-content active" id="<?php echo esc_attr($instance_id); ?>-designer" style="display: flex; flex-direction: row; flex-wrap: wrap; min-height: 600px;">
                
                <!-- Left Simulation Sidebar -->
                <div style="flex: 1; min-width: 320px; max-width: 440px; background: rgba(15, 23, 42, 0.8); border-right: 1px solid #1e293b; padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: 720px;">
                    
                    <!-- Parcel Selector -->
                    <div>
                        <label style="display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 6px;">
                            📍 Select Parking Lot Parcel (Santa Barbara, CA)
                        </label>
                        <select class="ct-c3d-lot-select" style="width: 100%; background: #020617; border: 1px solid #334155; color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: bold;">
                            <option value="sbcc-west" selected>SBCC West Campus Lot (Cliff Dr) — APN: 045-120-019 (420 Stalls)</option>
                            <option value="sb-airport">Santa Barbara Airport Main Lot — APN: 073-090-008 (850 Stalls)</option>
                            <option value="cabrillo-waterfront">Cabrillo Pavilion Waterfront Lot — APN: 017-310-002 (190 Stalls)</option>
                            <option value="paseo-nuevo">Paseo Nuevo Structure Lot #10 — APN: 037-142-011 (310 Stalls)</option>
                            <option value="sb-courthouse">Santa Barbara County Admin Lot — APN: 027-210-004 (215 Stalls)</option>
                            <option value="granada-lot">Granada Garage / Anacapa Municipal Lot — APN: 039-160-003 (160 Stalls)</option>
                        </select>
                    </div>

                    <!-- 100% Self-Sufficiency Gauge -->
                    <div style="background: linear-gradient(135deg, #0f172a 0%, #082f49 100%); border: 1px solid #0284c7; border-radius: 14px; padding: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #38bdf8;">Energy Self-Sufficiency</span>
                            <span class="ct-c3d-badge-status" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #059669; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 900;">
                                100% Net-Zero
                            </span>
                        </div>

                        <!-- Progress Bar -->
                        <div style="background: #1e293b; height: 10px; border-radius: 9999px; overflow: hidden; margin-bottom: 12px; border: 1px solid #334155;">
                            <div class="ct-c3d-progress" style="width: 100%; height: 100%; background: linear-gradient(90deg, #10b981, #06b6d4); transition: width 0.3s ease;"></div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: center;">
                            <div style="background: rgba(2, 6, 23, 0.7); padding: 8px; border-radius: 8px; border: 1px solid #1e293b;">
                                <div style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">Solar Output</div>
                                <div class="ct-c3d-solar-output" style="font-size: 16px; font-weight: 900; color: #34d399;">1,850 MWh/yr</div>
                                <div class="ct-c3d-kwp" style="font-size: 9px; color: #64748b; font-family: monospace;">1,040 kWp DC</div>
                            </div>
                            <div style="background: rgba(2, 6, 23, 0.7); padding: 8px; border-radius: 8px; border: 1px solid #1e293b;">
                                <div style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">Building Demand</div>
                                <div class="ct-c3d-building-demand" style="font-size: 16px; font-weight: 900; color: #38bdf8;">1,850 MWh/yr</div>
                                <div class="ct-c3d-peak" style="font-size: 9px; color: #64748b; font-family: monospace;">Peak: 420 kW</div>
                            </div>
                        </div>

                        <button type="button" class="ct-c3d-autoscale-btn" style="width: 100%; margin-top: 10px; background: #0284c7; hover:background: #0369a1; color: #fff; border: 1px solid #38bdf8; padding: 8px; border-radius: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; cursor: pointer;">
                            ⚡ Auto-Scale to 100% Self-Sufficiency
                        </button>
                    </div>

                    <!-- Canopy Controls -->
                    <div style="background: #020617; border: 1px solid #1e293b; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #38bdf8;">Solar Canopy Sizing</span>
                            <span style="font-size: 9px; color: #64748b; font-family: monospace;">Click / drag on map</span>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 4px;">
                                <span style="color: #cbd5e1;">Parking Stalls Covered:</span>
                                <span class="ct-c3d-stalls-val" style="color: #38bdf8; font-family: monospace;">260 Stalls</span>
                            </div>
                            <input type="range" class="ct-c3d-slider-stalls" min="20" max="420" value="260" style="width: 100%; accent-color: #0284c7;" />
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; margin-bottom: 2px;">
                                    <span style="color: #94a3b8;">Length:</span>
                                    <span class="ct-c3d-len-val" style="color: #fff; font-family: monospace;">220 ft</span>
                                </div>
                                <input type="range" class="ct-c3d-slider-len" min="60" max="650" value="220" style="width: 100%; accent-color: #0284c7;" />
                            </div>
                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; margin-bottom: 2px;">
                                    <span style="color: #94a3b8;">Width:</span>
                                    <span class="ct-c3d-width-val" style="color: #fff; font-family: monospace;">100 ft</span>
                                </div>
                                <input type="range" class="ct-c3d-slider-width" min="40" max="180" value="100" style="width: 100%; accent-color: #0284c7;" />
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 4px;">
                                <span style="color: #cbd5e1;">Tesla Megapack BESS:</span>
                                <span class="ct-c3d-bess-val" style="color: #34d399; font-family: monospace;">800 kWh</span>
                            </div>
                            <input type="range" class="ct-c3d-slider-bess" min="100" max="3000" step="50" value="800" style="width: 100%; accent-color: #10b981;" />
                        </div>
                    </div>

                    <!-- Commit Button -->
                    <button type="button" class="ct-c3d-commit-btn" style="width: 100%; background: #059669; color: #fff; border: none; padding: 12px; border-radius: 10px; font-size: 12px; font-weight: 900; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span>💾</span> Commit to Property Detail Layer
                    </button>

                </div>

                <!-- Right Interactive Leaflet Map -->
                <div style="flex: 2; min-width: 320px; position: relative; min-height: 500px;">
                    <div class="ct-c3d-map" style="width: 100%; height: 100%; min-height: 550px; background: #0f172a;"></div>
                    
                    <div style="position: absolute; top: 12px; right: 12px; z-index: 1000; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px); border: 1px solid #334155; padding: 10px 14px; border-radius: 12px; font-size: 11px; max-width: 260px;">
                        <div style="color: #38bdf8; font-weight: 900; margin-bottom: 2px;">☀️ CLICK &amp; DRAG PLACEMENT</div>
                        <div style="color: #cbd5e1; font-size: 10px; line-height: 1.4;">
                            Drag the yellow center pin to position the solar carport canopy over parking stalls.
                        </div>
                    </div>

                    <div style="position: absolute; bottom: 12px; left: 12px; right: 12px; z-index: 1000; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); border: 1px solid #334155; padding: 10px 16px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <div style="font-size: 11px;">
                            <span style="color: #94a3b8;">Active Parcel:</span>
                            <strong class="ct-c3d-active-lot-name" style="color: #fff; margin-left: 4px;">SBCC West Campus Lot</strong>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="ct-c3d-export-xml-btn" style="background: #9333ea; color: #fff; border: none; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer;">
                                📐 LandXML 1.2 (.xml)
                            </button>
                            <button type="button" class="ct-c3d-export-txt-btn" style="background: #334155; color: #fff; border: none; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer;">
                                📄 Report (.txt)
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Tab 2: Property Detail Digital Twin -->
            <div class="ct-c3d-tab-content" id="<?php echo esc_attr($instance_id); ?>-property-twin" style="display: none; padding: 24px;">
                <h4 style="margin: 0 0 8px 0; color: #fff; font-size: 18px; font-weight: 900;">
                    🏛️ Santa Barbara Property Detail Layer — Digital Twins
                </h4>
                <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 12px;">
                    Committed properties with 100% self-sufficient solar canopy carports and Autodesk Civil 3D geometry.
                </p>
                
                <div class="ct-c3d-property-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
                    <!-- Auto-populated via script -->
                    <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <span style="background: #082f49; color: #38bdf8; border: 1px solid #0284c7; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-family: monospace;">APN: 045-120-019</span>
                                <h5 style="margin: 6px 0 2px 0; color: #fff; font-size: 14px; font-weight: 900;">SBCC West Campus Parking Lot</h5>
                                <div style="font-size: 11px; color: #94a3b8;">Higher Education Campus</div>
                            </div>
                            <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #059669; padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 900;">100% Net-Zero</span>
                        </div>
                        <div style="background: #020617; padding: 10px; border-radius: 10px; border: 1px solid #1e293b; font-size: 11px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                            <div><span style="color: #64748b;">Solar Yield:</span> <strong style="color: #34d399;">1,850 MWh/yr</strong></div>
                            <div><span style="color: #64748b;">Demand:</span> <strong style="color: #38bdf8;">1,850 MWh/yr</strong></div>
                            <div><span style="color: #64748b;">Megapack BESS:</span> <strong style="color: #fbbf24;">800 kWh</strong></div>
                            <div><span style="color: #64748b;">CO₂ Offset:</span> <strong style="color: #2dd4bf;">407 MT/yr</strong></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab 3: LandXML & Embed Code -->
            <div class="ct-c3d-tab-content" id="<?php echo esc_attr($instance_id); ?>-landxml" style="display: none; padding: 24px;">
                <h4 style="margin: 0 0 8px 0; color: #fff; font-size: 18px; font-weight: 900;">
                    📐 Autodesk Civil 3D LandXML 1.2 Pipeline &amp; WordPress Embeds
                </h4>
                <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 12px;">
                    Direct LandXML 1.2 surface and footing export in California State Plane Zone V (EPSG: 2229).
                </p>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 20px;">
                        <h5 style="margin: 0 0 8px 0; color: #a855f7; font-size: 14px; font-weight: 900;">LandXML 1.2 Package</h5>
                        <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; margin-bottom: 14px;">
                            Ready to import directly into Autodesk Civil 3D (Surfaces > Import LandXML). Generates CgPoints for each carport stanchion footing, TIN roof surface, and parking bay alignments.
                        </p>
                        <button type="button" class="ct-c3d-export-xml-btn" style="background: #9333ea; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer;">
                            📥 Download LandXML File (.xml)
                        </button>
                    </div>

                    <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 20px;">
                        <h5 style="margin: 0 0 8px 0; color: #38bdf8; font-size: 14px; font-weight: 900;">WordPress Shortcode Usage</h5>
                        <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; margin-bottom: 10px;">
                            Embed this proposal generator on any client proposal page:
                        </p>
                        <code style="display: block; background: #020617; padding: 8px 12px; border-radius: 8px; color: #34d399; font-size: 11px; border: 1px solid #334155; margin-bottom: 8px;">
                            [civic_twin_solar_canopy apn="045-120-019"]
                        </code>
                        <code style="display: block; background: #020617; padding: 8px 12px; border-radius: 8px; color: #c084fc; font-size: 11px; border: 1px solid #334155;">
                            [civic_twin_civil3d_proposal]
                        </code>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="padding: 12px 24px; background: #090d16; border-top: 1px solid #1e293b; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
                <span>Angel Sharks Civic Twin • Autodesk Civil 3D Proposal Studio • Edition V.07 (PHP 8.2+)</span>
                <span style="color: #0284c7;">santabarbaraca.gov GIS Centroid (34.4208° N, -119.6982° W)</span>
            </div>

        </div>
        <?php
        return (string)ob_get_clean();
    }
}

Civic_Twin_SB_Shortcodes::init();
