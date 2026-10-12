<?php
/**
 * Civic_Twin Santa Barbara Demo Admin Controller (PHP 8.2+)
 * 
 * Manages admin configurations, Santa Barbara GIS presets, and system connectivity.
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

class Civic_Twin_SB_Admin {

    public static function init(): void {
        add_action('admin_menu', array(__CLASS__, 'register_admin_menu'));
        add_action('admin_init', array(__CLASS__, 'register_settings'));
        add_action('wp_ajax_test_civic_twin_sb_connection', array(__CLASS__, 'ajax_test_connection'));
        add_action('admin_enqueue_scripts', array(__CLASS__, 'enqueue_admin_assets'));
    }

    public static function enqueue_admin_assets(string $hook): void {
        if (strpos($hook, 'civic_twin_sb') === false) {
            return;
        }
        wp_enqueue_style('civic-twin-sb-admin-css', CIVIC_TWIN_SB_URL . 'assets/css/admin-style.css', array(), CIVIC_TWIN_SB_VERSION);
        wp_enqueue_script('civic-twin-sb-admin-js', CIVIC_TWIN_SB_URL . 'assets/js/admin-script.js', array('jquery'), CIVIC_TWIN_SB_VERSION, true);

        wp_localize_script('civic-twin-sb-admin-js', 'ctAdminParams', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('civic_twin_sb_admin_nonce')
        ));
    }

    public static function register_admin_menu(): void {
        add_menu_page(
            __('Santa Barbara Civic Twin', 'civic-twin-sb'),
            __('SB Civic Twin', 'civic-twin-sb'),
            'manage_options',
            'civic_twin_sb_hub',
            array(__CLASS__, 'render_admin_dashboard'),
            'dashicons-location-alt',
            30
        );

        add_submenu_page(
            'civic_twin_sb_hub',
            __('Santa Barbara Settings & Diagnostics', 'civic-twin-sb'),
            __('Settings & GIS', 'civic-twin-sb'),
            'manage_options',
            'civic_twin_sb_hub'
        );

        add_submenu_page(
            'civic_twin_sb_hub',
            __('Santa Barbara Demo Pages', 'civic-twin-sb'),
            __('Demo Pages', 'civic-twin-sb'),
            'manage_options',
            'civic_twin_sb_pages',
            array('Civic_Twin_SB_Member', 'render_creator_page')
        );

        add_submenu_page(
            'civic_twin_sb_hub',
            __('Autodesk Civil 3D & Solar Proposals', 'civic-twin-sb'),
            __('Civil 3D Proposals', 'civic-twin-sb'),
            'manage_options',
            'civic_twin_sb_civil3d',
            array(__CLASS__, 'render_civil3d_admin_page')
        );
    }

    public static function register_settings(): void {
        register_setting('civic_twin_sb_settings_group', 'civic_twin_sb_city_name');
        register_setting('civic_twin_sb_settings_group', 'civic_twin_sb_city_website');
        register_setting('civic_twin_sb_settings_group', 'civic_twin_sb_city_lat');
        register_setting('civic_twin_sb_settings_group', 'civic_twin_sb_city_lng');
        register_setting('civic_twin_sb_settings_group', 'civic_twin_sb_city_hall');
        register_setting('civic_twin_sb_settings_group', 'civic_twin_sb_embed_mode');
        register_setting('civic_twin_sb_settings_group', 'civic_twin_sb_instance_url');
        register_setting('civic_twin_sb_settings_group', 'civic_twin_sb_api_key');
        register_setting('civic_twin_sb_settings_group', 'civic_twin_sb_default_view');
        register_setting('civic_twin_sb_settings_group', 'civic_twin_sb_theme_accent');
        register_setting('civic_twin_sb_settings_group', 'civic_twin_sb_cache_timeout');
    }

    public static function render_admin_dashboard(): void {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Unauthorized access.', 'civic-twin-sb'));
        }

        $city_name = (string)get_option('civic_twin_sb_city_name', CIVIC_TWIN_SB_DEFAULT_CITY);
        $city_website = (string)get_option('civic_twin_sb_city_website', CIVIC_TWIN_SB_DEFAULT_WEBSITE);
        $city_lat = (string)get_option('civic_twin_sb_city_lat', (string)CIVIC_TWIN_SB_DEFAULT_LAT);
        $city_lng = (string)get_option('civic_twin_sb_city_lng', (string)CIVIC_TWIN_SB_DEFAULT_LNG);
        $city_hall = (string)get_option('civic_twin_sb_city_hall', CIVIC_TWIN_SB_DEFAULT_ADDRESS);
        $embed_mode = (string)get_option('civic_twin_sb_embed_mode', 'native');
        $instance_url = (string)get_option('civic_twin_sb_instance_url', 'https://ais-dev-ksgaec2aylr4nxfua3aqki-145896567353.us-east1.run.app');
        $api_key = (string)get_option('civic_twin_sb_api_key', '');
        $default_view = (string)get_option('civic_twin_sb_default_view', 'dashboard');
        $theme_accent = (string)get_option('civic_twin_sb_theme_accent', '#0284c7');
        $cache_timeout = (int)get_option('civic_twin_sb_cache_timeout', 3600);
        ?>
        <div class="wrap civic-twin-admin-wrap">
            <header class="ct-admin-header">
                <div class="ct-branding">
                    <span class="ct-icon-shield">🌊</span>
                    <div>
                        <h1><?php echo esc_html($city_name); ?> — Civic Twin Demo</h1>
                        <p class="ct-subtitle">
                            Angel Sharks V.<?php echo esc_html(defined('CIVIC_TWIN_SB_VERSION') ? CIVIC_TWIN_SB_VERSION : '0.5.0'); ?> | Powered by PHP <?php echo esc_html(PHP_VERSION); ?> | Synced with 
                            <a href="https://github.com/AngelSharks/Civic-Twin/tree/main" target="_blank" rel="noopener noreferrer" style="color:#a855f7; text-decoration:underline; font-weight: bold;">
                                GitHub (AngelSharks/Civic-Twin:main) ↗
                            </a> | Portal: 
                            <a href="<?php echo esc_url($city_website); ?>" target="_blank" rel="noopener noreferrer" style="color:#38bdf8; text-decoration:underline;">
                                <?php echo esc_html($city_website); ?> ↗
                            </a>
                        </p>
                    </div>
                </div>
                <div class="ct-badge-group">
                    <span class="ct-version-tag">PHP 8.2+ Verified</span>
                    <span class="ct-version-tag" style="background:#0284c7;">Edition V.07</span>
                    <span class="ct-version-tag" style="background:#d97706;">Autodesk Civil 3D</span>
                    <a href="https://github.com/AngelSharks/Civic-Twin/tree/main" target="_blank" rel="noopener noreferrer" class="ct-version-tag" style="background:#7e22ce; text-decoration:none; color:#fff;">
                        GitHub Fork: main
                    </a>
                </div>
            </header>

            <!-- Plugin Release & Sync Box -->
            <div class="ct-card" style="margin-bottom: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; border: 1px solid #334155; border-radius: 12px; padding: 20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                    <div>
                        <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#38bdf8; letter-spacing:0.05em; margin-bottom:4px;">
                            Active Release • Auto-Incremented (+0.01)
                        </div>
                        <h3 style="margin:0 0 4px 0; color:#fff; font-size:18px;">Civic_Twin_Angel_Sharks_ap.V.07.zip</h3>
                        <p style="margin:0; font-size:13px; color:#94a3b8;">
                            Pre-configured for City of Santa Barbara, CA. Features the <strong>Autodesk Civil 3D Solar Canopy Proposal Generator</strong>: click-to-add solar carports over parking lots, 100% net-zero self-sufficiency simulations, Tesla Megapack BESS sizing, Real-Time Stakeholder PDF modal preview, 10-Year Annual Cash Flow Ledger, and LandXML 1.2 export.
                        </p>
                    </div>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <a href="<?php echo esc_url(content_url('/Civic_Twin_Angel_Sharks_ap.V.07.zip')); ?>" download class="button button-primary" style="background:#0284c7; border-color:#0284c7; padding:6px 16px; height:auto; font-weight:bold;">
                            📥 Download V.07 (.zip)
                        </a>
                        <a href="https://github.com/AngelSharks/Civic-Twin/archive/refs/heads/main.zip" target="_blank" rel="noopener noreferrer" class="button" style="background:#7e22ce; border-color:#7e22ce; color:#fff; padding:6px 16px; height:auto; font-weight:bold;">
                            🐙 GitHub Main Fork (.zip)
                        </a>
                    </div>
                </div>
            </div>

            <!-- Diagnostic Notice regarding Google 401 -->
            <div class="notice notice-info" style="border-left-color: #0284c7; background: #f0f9ff; padding: 12px 18px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #0369a1;">
                    💡 Architecture Update: Native Standalone Mode Prevents Google 401 Errors
                </p>
                <p style="margin: 0; font-size: 12px; color: #0c4a6e; line-height: 1.5;">
                    Google AI Studio dev workspace URLs (<code>ais-dev-*.run.app</code>) require an active Google login session cookie and return <strong>"Google 401: That's an error"</strong> when embedded into external domains like WordPress. 
                    <br />
                    By keeping <strong>Native Standalone Mode (Active by default)</strong>, your Santa Barbara Digital Twin renders high-performance Leaflet GIS layers and B-LAN mesh simulation directly in WordPress with <strong>zero external iframe dependencies and zero 401 errors</strong>.
                </p>
            </div>

            <!-- Santa Barbara Context Banner -->
            <div class="ct-sb-banner">
                <div class="ct-sb-badge">MUNICIPAL SPATIAL CALIBRATION</div>
                <div class="ct-sb-grid">
                    <div><strong>Coordinates:</strong> <?php echo esc_html($city_lat); ?>° N, <?php echo esc_html($city_lng); ?>° W</div>
                    <div><strong>City Hall:</strong> <?php echo esc_html($city_hall); ?></div>
                    <div><strong>Active Watersheds:</strong> Mission Creek, Arroyo Burro, Santa Ynez Basin</div>
                    <div><strong>Emergency Mesh:</strong> Front Country Coastal Defense & MTD Corridor</div>
                </div>
            </div>

            <div class="ct-grid">
                <!-- Settings Form -->
                <div class="ct-card ct-settings-card">
                    <h2>⚙️ <?php _e('Santa Barbara Twin Configuration', 'civic-twin-sb'); ?></h2>
                    <p class="card-desc"><?php _e('Manage execution mode, city website references, and UI themes.', 'civic-twin-sb'); ?></p>

                    <form method="post" action="options.php" class="ct-form">
                        <?php settings_fields('civic_twin_sb_settings_group'); ?>
                        <?php do_settings_sections('civic_twin_sb_settings_group'); ?>

                        <div class="ct-form-row">
                            <label for="civic_twin_sb_embed_mode"><?php _e('Digital Twin Execution Engine', 'civic-twin-sb'); ?></label>
                            <select name="civic_twin_sb_embed_mode" id="civic_twin_sb_embed_mode" style="width:100%; padding: 8px 12px; border-radius: 8px; border:1px solid #cbd5e1; font-weight: bold;">
                                <option value="native" <?php selected($embed_mode, 'native'); ?>>⚡ <?php _e('Native Standalone Mode (Recommended — 0% Chance of 401 Error)', 'civic-twin-sb'); ?></option>
                                <option value="iframe" <?php selected($embed_mode, 'iframe'); ?>>🌐 <?php _e('External Host / Cloud Run iFrame (Requires Public Unauthenticated URL)', 'civic-twin-sb'); ?></option>
                            </select>
                            <p class="description" style="margin-top: 6px;">
                                <strong>Native Mode:</strong> Renders Santa Barbara Leaflet GIS, Mission Creek flood sliders, and B-LAN telemetry directly in WordPress without external iframe auth issues.
                            </p>
                        </div>

                        <div class="ct-form-row">
                            <label for="civic_twin_sb_city_name"><?php _e('Jurisdiction / Entity Name', 'civic-twin-sb'); ?></label>
                            <input type="text" name="civic_twin_sb_city_name" id="civic_twin_sb_city_name" value="<?php echo esc_attr($city_name); ?>" class="regular-text" required />
                        </div>

                        <div class="ct-form-row">
                            <label for="civic_twin_sb_city_website"><?php _e('Official City Website', 'civic-twin-sb'); ?></label>
                            <input type="url" name="civic_twin_sb_city_website" id="civic_twin_sb_city_website" value="<?php echo esc_url($city_website); ?>" class="regular-text" required />
                            <p class="description"><?php _e('Official Santa Barbara municipal site (https://santabarbaraca.gov/).', 'civic-twin-sb'); ?></p>
                        </div>

                        <div class="ct-form-row-grid">
                            <div class="ct-form-row">
                                <label for="civic_twin_sb_city_lat"><?php _e('Latitude', 'civic-twin-sb'); ?></label>
                                <input type="text" name="civic_twin_sb_city_lat" id="civic_twin_sb_city_lat" value="<?php echo esc_attr($city_lat); ?>" />
                            </div>
                            <div class="ct-form-row">
                                <label for="civic_twin_sb_city_lng"><?php _e('Longitude', 'civic-twin-sb'); ?></label>
                                <input type="text" name="civic_twin_sb_city_lng" id="civic_twin_sb_city_lng" value="<?php echo esc_attr($city_lng); ?>" />
                            </div>
                        </div>

                        <div class="ct-form-row">
                            <label for="civic_twin_sb_city_hall"><?php _e('Municipal Headquarters Address', 'civic-twin-sb'); ?></label>
                            <input type="text" name="civic_twin_sb_city_hall" id="civic_twin_sb_city_hall" value="<?php echo esc_attr($city_hall); ?>" class="regular-text" />
                        </div>

                        <div class="ct-form-row">
                            <label for="civic_twin_sb_instance_url"><?php _e('Civic Twin Host Application URL', 'civic-twin-sb'); ?></label>
                            <input type="url" name="civic_twin_sb_instance_url" id="civic_twin_sb_instance_url" value="<?php echo esc_url($instance_url); ?>" class="regular-text" required />
                            <p class="description"><?php _e('The root URL where the Civic Twin interactive simulation is running.', 'civic-twin-sb'); ?></p>
                        </div>

                        <div class="ct-form-row">
                            <label for="civic_twin_sb_theme_accent"><?php _e('Primary Coastal Accent Color', 'civic-twin-sb'); ?></label>
                            <input type="color" name="civic_twin_sb_theme_accent" id="civic_twin_sb_theme_accent" value="<?php echo esc_attr($theme_accent); ?>" />
                            <span class="color-text"><?php echo esc_attr($theme_accent); ?></span>
                        </div>

                        <div class="ct-actions">
                            <?php submit_button(__('Save Santa Barbara Settings', 'civic-twin-sb'), 'primary', 'submit', false); ?>
                            <button type="button" id="btn-test-connection" class="button button-secondary ct-btn-test">
                                🔌 <?php _e('Test Host Connectivity', 'civic-twin-sb'); ?>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Sidebar Diagnostics & Shortcodes -->
                <div class="ct-sidebar-grid">
                    <div class="ct-card ct-status-card">
                        <h3>🔌 <?php _e('Live Host Diagnostics', 'civic-twin-sb'); ?></h3>
                        <div class="status-indicator-box">
                            <div id="ct-connection-light" class="ct-indicator offline"></div>
                            <span id="ct-connection-text"><?php _e('Awaiting Diagnostic Scan...', 'civic-twin-sb'); ?></span>
                        </div>
                        <div class="diagnostics-logs" id="ct-diagnostics-logs">
                            <div class="log-entry system">[SYSTEM] Ready for Santa Barbara host handshake (PHP <?php echo esc_html(PHP_VERSION); ?>).</div>
                        </div>
                    </div>

                    <div class="ct-card ct-quick-links">
                        <h3>📍 <?php _e('Santa Barbara Shortcodes', 'civic-twin-sb'); ?></h3>
                        <p><?php _e('Embed on any WordPress page or post:', 'civic-twin-sb'); ?></p>
                        <ul class="shortcode-list">
                            <li>
                                <code>[civic_twin_solar_canopy]</code>
                                <span class="tip"><?php _e('Interactive Solar Canopy Carport Planner & 100% Self-Sufficiency Simulator.', 'civic-twin-sb'); ?></span>
                            </li>
                            <li>
                                <code>[civic_twin_civil3d_proposal]</code>
                                <span class="tip"><?php _e('Autodesk Civil 3D Proposal Studio with LandXML 1.2 Export.', 'civic-twin-sb'); ?></span>
                            </li>
                            <li>
                                <code>[civic_twin_dashboard]</code>
                                <span class="tip"><?php _e('Full interactive Santa Barbara Digital Twin matrix.', 'civic-twin-sb'); ?></span>
                            </li>
                            <li>
                                <code>[civic_twin_map]</code>
                                <span class="tip"><?php _e('Spatial Leaflet map calibrated to Santa Barbara coordinates.', 'civic-twin-sb'); ?></span>
                            </li>
                            <li>
                                <code>[civic_twin_member_portal]</code>
                                <span class="tip"><?php _e('Community resident registration & emergency B-LAN mesh.', 'civic-twin-sb'); ?></span>
                            </li>
                            <li>
                                <code>[civic_twin_sb_info]</code>
                                <span class="tip"><?php _e('Official Santa Barbara municipality information card.', 'civic-twin-sb'); ?></span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    public static function ajax_test_connection(): void {
        check_ajax_referer('civic_twin_sb_admin_nonce', 'security');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Unauthorized permission check', 'civic-twin-sb')));
            return;
        }

        $url = (string)get_option('civic_twin_sb_instance_url', '');
        if (empty($url)) {
            wp_send_json_error(array('message' => __('No host URL configured.', 'civic-twin-sb')));
            return;
        }

        $health_url = esc_url_raw(trailingslashit($url) . 'api/admin/security/status');
        $response = wp_remote_get($health_url, array('timeout' => 8));

        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => __('Host connection failed.', 'civic-twin-sb'),
                'details' => $response->get_error_message()
            ));
            return;
        }

        $code = (int)wp_remote_retrieve_response_code($response);
        if ($code !== 200) {
            wp_send_json_error(array(
                'message' => sprintf(__('Host returned HTTP %d.', 'civic-twin-sb'), $code),
                'details' => __('Please verify the host instance URL and security rules.', 'civic-twin-sb')
            ));
            return;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        wp_send_json_success(array(
            'message' => __('Santa Barbara Twin Host Online & Synchronized!', 'civic-twin-sb'),
            'status' => 'online',
            'api_details' => is_array($data) ? $data : array(),
            'timestamp' => current_time('mysql'),
            'php_version' => PHP_VERSION
        ));
    }

    /**
     * Render the dedicated Autodesk Civil 3D & Solar Canopy Proposal Admin Screen
     */
    public static function render_civil3d_admin_page(): void {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Unauthorized access.', 'civic-twin-sb'));
        }
        ?>
        <div class="wrap civic-twin-admin-wrap">
            <header class="ct-admin-header">
                <div class="ct-branding">
                    <span class="ct-icon-shield">☀️</span>
                    <div>
                        <h1><?php _e('Autodesk Civil 3D & Solar Canopy Proposal Studio', 'civic-twin-sb'); ?></h1>
                        <p class="ct-subtitle">
                            <?php _e('Propose 100% energy self-sufficient projects with interactive solar canopy carports and LandXML 1.2 export', 'civic-twin-sb'); ?>
                        </p>
                    </div>
                </div>
                <div class="ct-badge-group">
                    <span class="ct-version-tag" style="background:#0284c7;">Edition V.07</span>
                    <span class="ct-version-tag" style="background:#9333ea;">LandXML 1.2 Ready</span>
                </div>
            </header>

            <div style="margin-top: 20px;">
                <?php echo Civic_Twin_SB_Shortcodes::render_civil3d_proposal(); ?>
            </div>
        </div>
        <?php
    }
}
Civic_Twin_SB_Admin::init();
