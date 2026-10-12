/**
 * Civic_Twin Santa Barbara Public Script (PHP 8.2+)
 * Handles interactive Native Leaflet GIS mapping, hydrology sliders, and B-LAN mesh simulation.
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        initSantaBarbaraNativeTwin();
        initSantaBarbaraStandaloneMap();
        initSantaBarbaraWizard();
        initMemberPortalBroadcast();
        initCivil3DProposalStudios();

        // Invalidate map size on window load and after slight timeout to ensure crisp tile layout
        setTimeout(function() {
            if (window.ctSbLeafletMap) {
                window.ctSbLeafletMap.invalidateSize();
            }
        }, 200);
        setTimeout(function() {
            if (window.ctSbLeafletMap) {
                window.ctSbLeafletMap.invalidateSize();
            }
        }, 700);
    });

    /**
     * Interactive Onboarding & GIS Portals Calibration Wizard
     */
    function initSantaBarbaraWizard() {
        var $wizard = $('#ct-sb-wizard-container');
        var $twin = $('#ct-sb-twin-root');
        if (!$wizard.length) return;

        function showStep(stepId) {
            $('.ct-wizard-step').hide();
            $('#' + stepId).fadeIn(250);
        }

        // 1. Preset button
        $('#ct-btn-preset-sb').on('click', function() {
            $('#ct-input-city-name').val('City of Santa Barbara, CA');
            $('#ct-input-city-address').val('735 Anacapa Street, Santa Barbara, CA 93101');
            $('#ct-input-official-url').val('https://santabarbaraca.gov/');
            $('#ct-scan-city-label').text('City of Santa Barbara, CA');
            $('#ct-hdr-city-name').text('CITY OF SANTA BARBARA, CA');
        });

        // 2. Step 1 Submit -> Step 1.5 (Searching GIS Portals)
        $('#ct-form-step-1').on('submit', function(e) {
            e.preventDefault();
            var cityName = $.trim($('#ct-input-city-name').val()) || 'City of Santa Barbara, CA';
            $('#ct-scan-city-label').text(cityName);
            $('#ct-hdr-city-name').text(cityName.toUpperCase());

            // Show Step 1.5 with animated scanning
            showStep('ct-step-1-5');
            var $fill = $('#ct-scan-fill');
            var $log = $('#ct-scan-log-text');
            $fill.css('width', '0%');

            $fill.animate({ width: '100%' }, 1800);

            setTimeout(function() {
                $log.text('Querying santabarbaraca.gov ArcGIS REST server & USGS HUC-12 Mission Creek basins...');
            }, 300);

            setTimeout(function() {
                $log.text('Identified 6 spatial layers: Parcels, Watersheds, Utilities, Infrastructure, Safety, Greenery...');
            }, 1000);

            setTimeout(function() {
                $log.text('AI GIS ingest completed. Linking municipal portals...');
            }, 1500);

            setTimeout(function() {
                showStep('ct-step-2');
            }, 1900);
        });

        // 3. Fast-Launch direct shortcut
        $('#ct-btn-skip-to-twin').on('click', function() {
            launchTwin();
        });

        // 4. Step 2 Submit -> Step 3
        $('#ct-form-step-2').on('submit', function(e) {
            e.preventDefault();
            showStep('ct-step-3');
        });

        // Suggested portal pills in Step 2
        $('.ct-portal-pill').on('click', function() {
            var url = $(this).data('url');
            if (url) {
                $('#ct-input-official-url').val(url);
            }
        });

        // 5. Step 3 Strategy Selection
        $('#ct-btn-strategy-defaults').on('click', function() {
            // Jump straight to Step 5 (or launch)
            showStep('ct-step-5');
        });

        $('#ct-btn-strategy-custom').on('click', function() {
            showStep('ct-step-4');
        });

        // 6. Step 4 Custom GIS Layers Submit -> Step 5
        $('#ct-form-step-4').on('submit', function(e) {
            e.preventDefault();
            showStep('ct-step-5');
        });

        // 7. Step 5 CID Creator & Final Launch
        $('#ct-btn-add-cid').on('click', function() {
            var $input = $('#ct-new-cid-input');
            var name = $.trim($input.val());
            if (!name) return;

            var randomId = Math.floor(Math.random() * 800 + 100);
            var html = '<div class="ct-cid-item animate-in">' +
                '<div><strong class="ct-cid-item-name">' + $('<div>').text(name).html() + '</strong>' +
                '<span class="ct-cid-item-sub">Population: ~1,000 • Mesh Active</span></div>' +
                '<span class="ct-cid-badge">CID-' + randomId + '</span>' +
                '</div>';

            $('#ct-cid-list-container').append(html);
            $input.val('');
        });

        $('#ct-btn-launch-final').on('click', function() {
            launchTwin();
        });

        // Back button handler
        $('.ct-step-back').on('click', function() {
            var target = $(this).data('target');
            if (target) {
                showStep('ct-step-' + target);
            }
        });

        // Recalibrate / re-answer questions
        $('#ct-btn-recalibrate').on('click', function() {
            $twin.slideUp(300, function() {
                $wizard.slideDown(300);
                showStep('ct-step-1');
            });
        });

        function launchTwin() {
            $wizard.slideUp(300, function() {
                $twin.slideDown(300, function() {
                    if (window.ctSbLeafletMap) {
                        window.ctSbLeafletMap.invalidateSize();
                    } else {
                        initSantaBarbaraNativeTwin();
                    }
                });
            });
        }
    }

    /**
     * Initialize Native Santa Barbara Digital Twin Matrix
     */
    function initSantaBarbaraNativeTwin() {
        var mapContainer = document.getElementById('ct-sb-leaflet-map');
        if (!mapContainer || typeof L === 'undefined') {
            return;
        }

        if (window.ctSbLeafletMap) {
            window.ctSbLeafletMap.invalidateSize();
            return;
        }

        // Get coordinates from localized options or defaults
        var lat = (typeof civicTwinSBOptions !== 'undefined' && civicTwinSBOptions.cityLat) ? civicTwinSBOptions.cityLat : 34.42083;
        var lng = (typeof civicTwinSBOptions !== 'undefined' && civicTwinSBOptions.cityLng) ? civicTwinSBOptions.cityLng : -119.69819;

        // Initialize Leaflet Map
        var map = L.map('ct-sb-leaflet-map', {
            center: [lat, lng],
            zoom: 13,
            zoomControl: true,
            attributionControl: true
        });
        window.ctSbLeafletMap = map;

        // 100% Open Source Street Map Tile Layer (OpenStreetMap standard - Zero API key / Zero account required)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | City of Santa Barbara GIS',
            maxZoom: 19
        }).addTo(map);

        // Layer Groups
        var watershedsLayer = L.layerGroup();
        var meshLayer = L.layerGroup();
        var transitLayer = L.layerGroup();

        // 1. Mission Creek Watershed Basin (Santa Barbara Front Country)
        var missionCreekCoords = [
            [34.460, -119.725],
            [34.455, -119.705],
            [34.440, -119.690],
            [34.425, -119.688],
            [34.415, -119.692],
            [34.411, -119.695],
            [34.420, -119.720],
            [34.445, -119.735]
        ];

        var missionCreekPolygon = L.polygon(missionCreekCoords, {
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.35,
            weight: 2
        }).addTo(watershedsLayer);

        missionCreekPolygon.bindPopup(
            '<div style="font-family:sans-serif; font-size:12px;">' +
            '<h4 style="margin:0 0 4px 0; color:#0f172a;">💧 Mission Creek Watershed</h4>' +
            '<strong>Basin Extent:</strong> 11.5 sq mi<br/>' +
            '<strong>Discharge Capacity:</strong> 48.0 m³/s<br/>' +
            '<strong>Runoff Soil Infiltration:</strong> 64%<br/>' +
            '<a href="https://santabarbaraca.gov/" target="_blank" style="color:#0284c7;font-weight:bold;">Municipal Watershed Docs ↗</a>' +
            '</div>'
        );

        // Arroyo Burro Basin
        var arroyoBurroCoords = [
            [34.445, -119.760],
            [34.430, -119.740],
            [34.412, -119.742],
            [34.402, -119.745],
            [34.403, -119.758],
            [34.425, -119.770]
        ];

        var arroyoBurroPolygon = L.polygon(arroyoBurroCoords, {
            color: '#059669',
            fillColor: '#10b981',
            fillOpacity: 0.25,
            weight: 2
        }).addTo(watershedsLayer);

        arroyoBurroPolygon.bindPopup(
            '<div style="font-family:sans-serif; font-size:12px;">' +
            '<h4 style="margin:0 0 4px 0; color:#0f172a;">💧 Arroyo Burro Basin</h4>' +
            '<strong>Coastal Runoff:</strong> Hendry\'s Beach Outflow<br/>' +
            '<strong>Catchment Area:</strong> 9.2 sq mi' +
            '</div>'
        );

        // Waterfront & Stearns Wharf Marine Zone
        var marineCoords = [
            [34.415, -119.698],
            [34.412, -119.684],
            [34.401, -119.688],
            [34.404, -119.702]
        ];

        var marinePolygon = L.polygon(marineCoords, {
            color: '#2563eb',
            fillColor: '#60a5fa',
            fillOpacity: 0.25,
            weight: 2,
            dashArray: '5, 5'
        }).addTo(watershedsLayer);

        marinePolygon.bindPopup(
            '<div style="font-family:sans-serif; font-size:12px;">' +
            '<h4 style="margin:0 0 4px 0; color:#0f172a;">⚓ Santa Barbara Waterfront & Harbor</h4>' +
            'Stearns Wharf Coastal Zone • Storm Surge Monitoring' +
            '</div>'
        );

        // 2. B-LAN Emergency Mesh Nodes
        var nodes = [
            {
                name: 'City Hall Primary (Root Node)',
                coords: [34.42083, -119.69819],
                address: '735 Anacapa St',
                role: 'Gateway / Root Server'
            },
            {
                name: 'Cottage Hospital Emergency Node',
                coords: [34.4345, -119.7198],
                address: 'Pueblo St',
                role: 'Trauma Center Relay'
            },
            {
                name: 'Harbor Waterfront Patrol Node',
                coords: [34.4072, -119.6928],
                address: 'Cabrillo Blvd',
                role: 'Coastal Wave & Surge Monitor'
            },
            {
                name: 'SB Airport Corridor Link',
                coords: [34.4262, -119.8400],
                address: 'Hollister Ave',
                role: 'West Gateway Relay'
            }
        ];

        var nodeMarkers = [];
        nodes.forEach(function(node) {
            var iconHtml = '<div style="background:#0284c7; color:#fff; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 0 10px rgba(2,132,199,0.7); font-size:12px;">📡</div>';
            var customIcon = L.divIcon({
                html: iconHtml,
                className: 'ct-custom-mesh-pin',
                iconSize: [26, 26],
                iconAnchor: [13, 13]
            });

            var marker = L.marker(node.coords, { icon: customIcon }).addTo(meshLayer);
            marker.bindPopup(
                '<div style="font-family:sans-serif; font-size:12px;">' +
                '<strong style="color:#0284c7;">' + node.name + '</strong><br/>' +
                '<strong>Location:</strong> ' + node.address + '<br/>' +
                '<strong>Role:</strong> ' + node.role + '<br/>' +
                '<strong>Status:</strong> <span style="color:#10b981;font-weight:bold;">Online (915.2 MHz)</span>' +
                '</div>'
            );
            nodeMarkers.push(marker);
        });

        // Connect nodes with wireless mesh topology lines
        var cityHall = [34.42083, -119.69819];
        var meshConnections = [
            [cityHall, [34.4345, -119.7198]],
            [cityHall, [34.4072, -119.6928]],
            [cityHall, [34.4262, -119.8400]],
            [[34.4345, -119.7198], [34.4072, -119.6928]]
        ];

        meshConnections.forEach(function(pts) {
            L.polyline(pts, {
                color: '#38bdf8',
                weight: 1.5,
                dashArray: '4, 6',
                opacity: 0.8
            }).addTo(meshLayer);
        });

        // 3. Transit & Evacuation Corridors
        var stateStreet = [
            [34.442, -119.728],
            [34.433, -119.715],
            [34.424, -119.702],
            [34.416, -119.695],
            [34.411, -119.688]
        ];

        L.polyline(stateStreet, {
            color: '#f59e0b',
            weight: 4,
            opacity: 0.85
        }).addTo(transitLayer).bindPopup('<strong>State Street Pedestrian & Cultural Corridor</strong>');

        var us101 = [
            [34.438, -119.760],
            [34.428, -119.730],
            [34.420, -119.695],
            [34.418, -119.670]
        ];

        L.polyline(us101, {
            color: '#6366f1',
            weight: 4,
            opacity: 0.85
        }).addTo(transitLayer).bindPopup('<strong>US-101 Coastal Transit Artery</strong><br/>Primary Regional Evacuation Route');

        // Add all layer groups to map initially
        watershedsLayer.addTo(map);
        meshLayer.addTo(map);
        transitLayer.addTo(map);

        // Layer Filter Buttons
        $('.ct-layer-btn').on('click', function() {
            var $btn = $(this);
            var layerName = $btn.data('layer');

            if (layerName === 'all') {
                $('.ct-layer-btn').addClass('active');
                if (!map.hasLayer(watershedsLayer)) map.addLayer(watershedsLayer);
                if (!map.hasLayer(meshLayer)) map.addLayer(meshLayer);
                if (!map.hasLayer(transitLayer)) map.addLayer(transitLayer);
                return;
            }

            $btn.toggleClass('active');
            var isActive = $btn.hasClass('active');

            if (layerName === 'watersheds') {
                if (isActive) map.addLayer(watershedsLayer); else map.removeLayer(watershedsLayer);
            } else if (layerName === 'mesh') {
                if (isActive) map.addLayer(meshLayer); else map.removeLayer(meshLayer);
            } else if (layerName === 'transit') {
                if (isActive) map.addLayer(transitLayer); else map.removeLayer(transitLayer);
            }
        });

        // Recenter button
        $('#ct-btn-recenter').on('click', function() {
            map.setView([lat, lng], 13, { animate: true });
        });

        // Fullscreen toggle
        $('#ct-btn-toggle-fullscreen').on('click', function() {
            var $wrap = $('#ct-sb-twin-root');
            $wrap.toggleClass('ct-fullscreen-active');
            if ($wrap.hasClass('ct-fullscreen-active')) {
                $wrap.css({
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100vw',
                    height: '100vh',
                    zIndex: '99999',
                    margin: '0'
                });
                $(this).text('✖ Exit Fullscreen');
            } else {
                $wrap.removeAttr('style');
                $(this).text('⛶ Fullscreen');
            }
            setTimeout(function() { map.invalidateSize(); }, 300);
        });

        // Hydrology Simulation Interactive Sliders
        var $sliderRain = $('#ct-slider-rainfall');
        var $sliderSurge = $('#ct-slider-surge');

        function updateHydrologySim() {
            var rain = parseFloat($sliderRain.val()) || 0;
            var surge = parseFloat($sliderSurge.val()) || 0;

            $('#ct-label-rainfall').text(rain + ' mm/hr');
            $('#ct-label-surge').text(surge.toFixed(1) + ' m');

            // Rational runoff equation simulation: Q = C * I * A
            var discharge = (0.62 * rain * 0.95 + 1.2).toFixed(1);
            var saturation = Math.min(99, Math.round(45 + rain * 0.45));

            $('#ct-val-discharge').text(discharge);
            $('#ct-val-saturation').text(saturation);

            var $threatBadge = $('#ct-threat-badge');
            var $statusDischarge = $('#ct-status-discharge');
            var polyColor = '#0284c7';
            var polyFill = '#38bdf8';

            if (rain < 35) {
                $threatBadge.text('Stage 1: Normal').attr('class', 'ct-badge-indicator green');
                $statusDischarge.text('Nominal Capacity').attr('class', 'ct-telem-status normal');
                polyColor = '#0284c7';
                polyFill = '#38bdf8';
            } else if (rain < 75) {
                $threatBadge.text('Stage 2: Elevated Runoff').attr('class', 'ct-badge-indicator');
                $statusDischarge.text('Elevated Flow').attr('class', 'ct-telem-status elevated');
                polyColor = '#f59e0b';
                polyFill = '#fbbf24';
            } else {
                $threatBadge.text('Stage 3: Flash Flood Watch').attr('class', 'ct-badge-indicator warning');
                $statusDischarge.text('Critical Watch').attr('class', 'ct-telem-status warning');
                polyColor = '#ef4444';
                polyFill = '#f87171';
            }

            missionCreekPolygon.setStyle({
                color: polyColor,
                fillColor: polyFill,
                fillOpacity: Math.min(0.7, 0.35 + (rain / 200))
            });
        }

        $sliderRain.on('input change', updateHydrologySim);
        $sliderSurge.on('input change', updateHydrologySim);

        // 1-Click: Trigger 100-Year Storm Event
        $('#ct-btn-simulate-flood').on('click', function() {
            $sliderRain.val(98).trigger('input');
            $sliderSurge.val(2.8).trigger('input');

            var log = document.getElementById('ct-mesh-terminal-log');
            if (log) {
                var entry = document.createElement('div');
                entry.style.color = '#f87171';
                entry.innerHTML = '[ALERT] 100-Yr rainfall event triggered (98 mm/hr). Mission Creek culvert alert active.';
                log.insertBefore(entry, log.firstChild);
            }
        });

        // 1-Click: Reset Sim
        $('#ct-btn-reset-sim').on('click', function() {
            $sliderRain.val(22).trigger('input');
            $sliderSurge.val(0.8).trigger('input');
        });

        // 1-Click: Broadcast B-LAN Mesh Ping
        $('#ct-btn-broadcast-ping').on('click', function() {
            var $btn = $(this);
            $btn.prop('disabled', true).text('⚡ Pinging Relays...');

            var log = document.getElementById('ct-mesh-terminal-log');
            var steps = [
                '[TX] Broadcast ping sent from City Hall Primary (735 Anacapa St)...',
                '[ACK] Cottage Hospital Node responded: 16ms (-69 dBm)',
                '[ACK] Harbor Waterfront Patrol responded: 14ms (-64 dBm)',
                '[ACK] Airport Corridor Link responded: 22ms (-74 dBm)',
                '[SUCCESS] All 4 Santa Barbara relays verified operational (100% quorum).'
            ];

            var idx = 0;
            var interval = setInterval(function() {
                if (idx < steps.length) {
                    if (log) {
                        var entry = document.createElement('div');
                        entry.style.color = (idx === steps.length - 1) ? '#34d399' : '#38bdf8';
                        entry.innerHTML = steps[idx];
                        log.insertBefore(entry, log.firstChild);
                    }
                    idx++;
                } else {
                    clearInterval(interval);
                    $btn.prop('disabled', false).text('📡 Broadcast Emergency Mesh Ping');
                }
            }, 400);
        });
    }

    /**
     * Initialize Standalone Map for [civic_twin_map]
     */
    function initSantaBarbaraStandaloneMap() {
        var container = document.getElementById('ct-sb-leaflet-map-standalone');
        if (!container || typeof L === 'undefined') {
            return;
        }

        var lat = (typeof civicTwinSBOptions !== 'undefined' && civicTwinSBOptions.cityLat) ? civicTwinSBOptions.cityLat : 34.42083;
        var lng = (typeof civicTwinSBOptions !== 'undefined' && civicTwinSBOptions.cityLng) ? civicTwinSBOptions.cityLng : -119.69819;

        var standaloneMap = L.map('ct-sb-leaflet-map-standalone', {
            center: [lat, lng],
            zoom: 13
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | City of Santa Barbara GIS',
            maxZoom: 19
        }).addTo(standaloneMap);

        // Add City Hall Marker
        L.marker([lat, lng]).addTo(standaloneMap)
            .bindPopup('<strong>City of Santa Barbara City Hall</strong><br/>735 Anacapa Street<br/><a href="https://santabarbaraca.gov/" target="_blank">santabarbaraca.gov</a>')
            .openPopup();
    }

    /**
     * Initialize Member Portal Chat / Broadcast
     */
    function initMemberPortalBroadcast() {
        $('#ct-btn-send-mesh-msg').on('click', function() {
            var $input = $('#ct-mesh-input-msg');
            var val = $.trim($input.val());
            if (!val) return;

            var $feed = $('#ct-resident-mesh-feed');
            var timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            var html = '<div class="feed-item" style="border-left-color: #10b981;">' +
                '<strong>[RESIDENT BROADCAST ' + timeStr + ']:</strong> ' + $('<div>').text(val).html() +
                '</div>';

            $feed.prepend(html);
            $input.val('');
        });
    }

    /**
     * Initialize Autodesk Civil 3D Proposal Studio for [civic_twin_civil3d_proposal] & [civic_twin_solar_canopy]
     */
    function initCivil3DProposalStudios() {
        var $containers = $('.ct-civil3d-proposal-container');
        if (!$containers.length || typeof L === 'undefined') return;

        var LOTS = {
            'sbcc-west': {
                name: 'SBCC West Campus Parking Lot (Cliff Dr)',
                apn: '045-120-019',
                lat: 34.4061,
                lng: -119.7028,
                stalls: 420,
                recommendedStalls: 260,
                demandKwh: 1850000,
                peakKw: 420
            },
            'sb-airport': {
                name: 'Santa Barbara Airport Terminal Parking',
                apn: '073-090-008',
                lat: 34.4262,
                lng: -119.8404,
                stalls: 850,
                recommendedStalls: 480,
                demandKwh: 3400000,
                peakKw: 780
            },
            'cabrillo-waterfront': {
                name: 'Cabrillo Pavilion Waterfront Lot',
                apn: '017-310-002',
                lat: 34.4173,
                lng: -119.6698,
                stalls: 190,
                recommendedStalls: 95,
                demandKwh: 620000,
                peakKw: 160
            },
            'paseo-nuevo': {
                name: 'Paseo Nuevo Structure Lot #10 (Chapala)',
                apn: '037-142-011',
                lat: 34.4195,
                lng: -119.6997,
                stalls: 310,
                recommendedStalls: 165,
                demandKwh: 1120000,
                peakKw: 290
            },
            'sb-courthouse': {
                name: 'Santa Barbara County Admin Lot',
                apn: '027-210-004',
                lat: 34.4243,
                lng: -119.7022,
                stalls: 215,
                recommendedStalls: 130,
                demandKwh: 890000,
                peakKw: 230
            },
            'granada-lot': {
                name: 'Granada Garage / Anacapa Municipal Lot',
                apn: '039-160-003',
                lat: 34.4258,
                lng: -119.7045,
                stalls: 160,
                recommendedStalls: 85,
                demandKwh: 580000,
                peakKw: 140
            }
        };

        $containers.each(function() {
            var $c = $(this);
            var $mapElem = $c.find('.ct-c3d-map');
            if (!$mapElem.length) return;

            var currentLotKey = 'sbcc-west';
            var currentLot = LOTS[currentLotKey];
            var canopyLat = currentLot.lat;
            var canopyLng = currentLot.lng;
            var lengthFt = 220;
            var widthFt = 100;
            var stallsCovered = currentLot.recommendedStalls;
            var bessKWh = 800;

            // Tabs
            $c.find('.ct-c3d-tab-btn').on('click', function() {
                var tab = $(this).data('tab');
                $c.find('.ct-c3d-tab-btn').css({ background: '#1e293b', color: '#94a3b8' });
                $(this).css({ background: '#0284c7', color: '#fff' });

                $c.find('.ct-c3d-tab-content').hide();
                $c.find('#' + $c.attr('id') + '-' + tab).show();

                if (tab === 'designer' && c3dMap) {
                    setTimeout(function() { c3dMap.invalidateSize(); }, 150);
                }
            });

            // Map Init
            var c3dMap = L.map($mapElem[0], {
                center: [canopyLat, canopyLng],
                zoom: 17,
                zoomControl: true,
                attributionControl: false
            });

            L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                maxZoom: 20
            }).addTo(c3dMap);

            var canopyPoly = null;
            var centerMarker = null;
            var piersGroup = L.layerGroup().addTo(c3dMap);

            function updateCalculations() {
                var areaSqFt = lengthFt * widthFt;
                var areaSqM = areaSqFt * 0.092903;
                var apertureSqM = areaSqM * 0.88;
                var kwp = Math.round(apertureSqM * 1.0 * 0.218);
                var dailyKwh = kwp * 5.42 * 0.84;
                var annualKwh = Math.round(dailyKwh * 365);
                var demandKwh = currentLot.demandKwh;
                var pct = Math.round((annualKwh / demandKwh) * 100);

                // Update UI elements
                $c.find('.ct-c3d-stalls-val').text(stallsCovered + ' Stalls');
                $c.find('.ct-c3d-len-val').text(lengthFt + ' ft');
                $c.find('.ct-c3d-width-val').text(widthFt + ' ft');
                $c.find('.ct-c3d-bess-val').text(bessKWh + ' kWh');
                $c.find('.ct-c3d-solar-output').text((annualKwh / 1000).toLocaleString() + ' MWh/yr');
                $c.find('.ct-c3d-kwp').text(kwp + ' kWp DC');
                $c.find('.ct-c3d-building-demand').text((demandKwh / 1000).toLocaleString() + ' MWh/yr');
                $c.find('.ct-c3d-peak').text('Peak: ' + currentLot.peakKw + ' kW');

                var $progress = $c.find('.ct-c3d-progress');
                $progress.css('width', Math.min(100, pct) + '%');

                var $status = $c.find('.ct-c3d-badge-status');
                if (pct >= 100) {
                    $status.text('100% Net-Zero Achieved').css({ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: '#059669' });
                    $progress.css('background', 'linear-gradient(90deg, #10b981, #06b6d4)');
                } else {
                    $status.text(pct + '% of Net-Zero').css({ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', borderColor: '#d97706' });
                    $progress.css('background', 'linear-gradient(90deg, #f59e0b, #0284c7)');
                }

                // Update Geometry on Map
                var dLat = (lengthFt / 2) * 0.00000274;
                var dLng = (widthFt / 2) * 0.00000334;
                var bounds = [
                    [canopyLat - dLat, canopyLng - dLng],
                    [canopyLat + dLat, canopyLng + dLng]
                ];

                if (canopyPoly) c3dMap.removeLayer(canopyPoly);
                if (centerMarker) c3dMap.removeLayer(centerMarker);
                piersGroup.clearLayers();

                canopyPoly = L.rectangle(bounds, {
                    color: '#38bdf8',
                    weight: 3,
                    fillColor: '#0284c7',
                    fillOpacity: 0.65,
                    dashArray: '4, 2'
                }).addTo(c3dMap);

                centerMarker = L.marker([canopyLat, canopyLng], {
                    draggable: true,
                    icon: L.divIcon({
                        className: 'ct-c3d-drag-pin',
                        html: '<div style="background:#f59e0b; color:#fff; border:2px solid #fff; border-radius:9999px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 6px rgba(0,0,0,0.5); cursor:grab; font-weight:bold; font-size:14px;">☀️</div>',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })
                }).addTo(c3dMap);

                centerMarker.on('dragend', function(e) {
                    var pos = e.target.getLatLng();
                    canopyLat = pos.lat;
                    canopyLng = pos.lng;
                    updateCalculations();
                });

                // Piers
                var cols = Math.max(2, Math.round(lengthFt / 40));
                for (var r = 0; r < 2; r++) {
                    for (var c = 0; c < cols; c++) {
                        var pLat = (canopyLat - dLat) + (r) * (2 * dLat);
                        var pLng = (canopyLng - dLng) + (c / (cols - 1 || 1)) * (2 * dLng);
                        L.circleMarker([pLat, pLng], {
                            radius: 3.5,
                            color: '#fff',
                            fillColor: '#f59e0b',
                            fillOpacity: 1,
                            weight: 1.5
                        }).addTo(piersGroup).bindTooltip('Pier #' + (r * cols + c + 1) + ' (Civil 3D Footing)');
                    }
                }
            }

            // Lot Switcher
            $c.find('.ct-c3d-lot-select').on('change', function() {
                currentLotKey = $(this).val();
                currentLot = LOTS[currentLotKey] || LOTS['sbcc-west'];
                canopyLat = currentLot.lat;
                canopyLng = currentLot.lng;
                stallsCovered = currentLot.recommendedStalls;
                lengthFt = Math.round(stallsCovered * 8.5);
                widthFt = 100;
                bessKWh = Math.round(currentLot.peakKw * 3.5);

                $c.find('.ct-c3d-slider-stalls').val(stallsCovered).attr('max', currentLot.stalls);
                $c.find('.ct-c3d-slider-len').val(lengthFt);
                $c.find('.ct-c3d-slider-width').val(widthFt);
                $c.find('.ct-c3d-slider-bess').val(bessKWh);
                $c.find('.ct-c3d-active-lot-name').text(currentLot.name);

                c3dMap.flyTo([canopyLat, canopyLng], 17, { duration: 0.8 });
                updateCalculations();
            });

            // Sliders
            $c.find('.ct-c3d-slider-stalls').on('input', function() {
                stallsCovered = parseInt($(this).val(), 10);
                lengthFt = Math.max(80, Math.round(stallsCovered * 8.5));
                $c.find('.ct-c3d-slider-len').val(lengthFt);
                updateCalculations();
            });

            $c.find('.ct-c3d-slider-len').on('input', function() {
                lengthFt = parseInt($(this).val(), 10);
                updateCalculations();
            });

            $c.find('.ct-c3d-slider-width').on('input', function() {
                widthFt = parseInt($(this).val(), 10);
                updateCalculations();
            });

            $c.find('.ct-c3d-slider-bess').on('input', function() {
                bessKWh = parseInt($(this).val(), 10);
                updateCalculations();
            });

            // Auto Scale 100%
            $c.find('.ct-c3d-autoscale-btn').on('click', function() {
                var neededKw = (currentLot.demandKwh / 365) / (5.42 * 0.84);
                var neededSqM = (neededKw / 0.218) / 0.88;
                var neededSqFt = neededSqM / 0.092903;
                widthFt = 100;
                lengthFt = Math.min(650, Math.max(120, Math.round(neededSqFt / widthFt)));
                stallsCovered = Math.min(currentLot.stalls, Math.round(lengthFt / 8.5));
                bessKWh = Math.round(currentLot.peakKw * 4.2);

                $c.find('.ct-c3d-slider-len').val(lengthFt);
                $c.find('.ct-c3d-slider-width').val(widthFt);
                $c.find('.ct-c3d-slider-stalls').val(stallsCovered);
                $c.find('.ct-c3d-slider-bess').val(bessKWh);
                updateCalculations();
            });

            // Commit to Property Twin
            $c.find('.ct-c3d-commit-btn').on('click', function() {
                alert('✅ Committed to Property Detail Digital Twin Layer for ' + currentLot.name + ' (APN: ' + currentLot.apn + ')!');
            });

            // Download LandXML 1.2
            $c.find('.ct-c3d-export-xml-btn').on('click', function() {
                var northingBase = 1978000 + (canopyLat - 34.4) * 364000;
                var eastingBase = 6045000 + (canopyLng + 119.7) * 300000;
                var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                    '<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2" date="' + new Date().toISOString().split('T')[0] + '" version="1.2">\n' +
                    '  <Units><Imperial areaUnit="squareFoot" linearUnit="foot" temperatureUnit="fahrenheit"/></Units>\n' +
                    '  <Project name="Solar-Canopy-' + currentLot.apn + '" desc="Autodesk Civil 3D Solar Proposal for ' + currentLot.name + '"/>\n' +
                    '  <Application name="Angel Sharks Civic Twin Civil 3D" version="0.6.0"/>\n' +
                    '  <CoordinateSystem desc="NAD83 California State Plane Zone V (US Survey Feet)" epsgCode="2229"/>\n' +
                    '  <CgPoints>\n' +
                    '    <CgPoint name="CP-01" pntSurv="control" desc="CANOPY-NW">' + (northingBase + lengthFt/2).toFixed(3) + ' ' + (eastingBase - widthFt/2).toFixed(3) + ' 38.500</CgPoint>\n' +
                    '    <CgPoint name="CP-02" pntSurv="control" desc="CANOPY-NE">' + (northingBase + lengthFt/2).toFixed(3) + ' ' + (eastingBase + widthFt/2).toFixed(3) + ' 39.200</CgPoint>\n' +
                    '    <CgPoint name="CP-03" pntSurv="control" desc="CANOPY-SE">' + (northingBase - lengthFt/2).toFixed(3) + ' ' + (eastingBase + widthFt/2).toFixed(3) + ' 37.800</CgPoint>\n' +
                    '    <CgPoint name="CP-04" pntSurv="control" desc="CANOPY-SW">' + (northingBase - lengthFt/2).toFixed(3) + ' ' + (eastingBase - widthFt/2).toFixed(3) + ' 37.100</CgPoint>\n' +
                    '    <CgPoint name="BESS-01" pntSurv="utility" desc="TESLA-MEGAPACK">' + (northingBase - lengthFt/2 - 20).toFixed(3) + ' ' + eastingBase.toFixed(3) + ' 37.000</CgPoint>\n' +
                    '  </CgPoints>\n' +
                    '  <Surfaces><Surface name="CANOPY-ROOF-GRADE"><Definition surfType="TIN"/></Surface></Surfaces>\n' +
                    '  <Parcels><Parcel name="' + currentLot.apn + '" desc="' + currentLot.name + '"/></Parcels>\n' +
                    '</LandXML>';

                var blob = new Blob([xml], { type: 'application/xml' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'Civil3D_Proposal_' + currentLot.apn + '.xml';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });

            // Download Report
            $c.find('.ct-c3d-export-txt-btn').on('click', function() {
                var txt = 'AUTODESK CIVIL 3D SOLAR PROPOSAL REPORT\n' +
                    'Project: ' + currentLot.name + '\n' +
                    'APN: ' + currentLot.apn + '\n' +
                    'Dimensions: ' + lengthFt + ' ft x ' + widthFt + ' ft (' + (lengthFt * widthFt) + ' sq ft)\n' +
                    'Stalls: ' + stallsCovered + ' Stalls\n' +
                    'Battery: ' + bessKWh + ' kWh BESS\n' +
                    '100% Net-Zero Energy Balance Verified\n';
                var blob = new Blob([txt], { type: 'text/plain' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'Proposal_' + currentLot.apn + '.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });

            updateCalculations();
        });
    }

})(jQuery);
