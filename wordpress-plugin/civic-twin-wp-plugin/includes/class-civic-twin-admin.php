<?php
/**
 * Civic_Twin Admin Controller
 * 
 * Handles settings, dashboard integration, and rapid installation diagnostics.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Civic_Twin_Admin {
    public static function init() {
        add_action('admin_menu', array(__CLASS__, 'register_admin_menu'));
        add_action('admin_init', array(__CLASS__, 'register_settings'));
        add_action('wp_ajax_test_civic_twin_connection', array(__CLASS__, 'ajax_test_connection'));
        add_action('admin_enqueue_scripts', array(__CLASS__, 'enqueue_admin_assets'));
    }

    public static function enqueue_admin_assets($hook) {
        if (strpos($hook, 'civic_twin') === false) {
            return;
        }
        wp_enqueue_style('civic-twin-admin-css', CIVIC_TWIN_URL . 'assets/css/admin-style.css', array(), CIVIC_TWIN_VERSION);
        wp_enqueue_script('civic-twin-admin-js', CIVIC_TWIN_URL . 'assets/js/admin-script.js', array('jquery'), CIVIC_TWIN_VERSION, true);
    }

    public static function register_admin_menu() {
        add_menu_page(
            __('Civic Twin Hub', 'civic-twin-wp'),
            __('Civic Twin Hub', 'civic-twin-wp'),
            'manage_options',
            'civic_twin_hub',
            array(__CLASS__, 'render_admin_dashboard'),
            'dashicons-admin-site',
            30
        );

        add_submenu_page(
            'civic_twin_hub',
            __('Settings & Diagnostics', 'civic-twin-wp'),
            __('Settings', 'civic-twin-wp'),
            'manage_options',
            'civic_twin_hub'
        );

        add_submenu_page(
            'civic_twin_hub',
            __('Member Pages Creator', 'civic-twin-wp'),
            __('Member Pages', 'civic-twin-wp'),
            'manage_options',
            'civic_twin_member_creator',
            array('Civic_Twin_Member', 'render_creator_page')
        );
    }

    public static function register_settings() {
        register_setting('civic_twin_settings_group', 'civic_twin_instance_url');
        register_setting('civic_twin_settings_group', 'civic_twin_api_key');
        register_setting('civic_twin_settings_group', 'civic_twin_default_view');
        register_setting('civic_twin_settings_group', 'civic_twin_cache_timeout');
        register_setting('civic_twin_settings_group', 'civic_twin_theme_accent');
    }

    public static function render_admin_dashboard() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $instance_url = get_option('civic_twin_instance_url');
        $api_key = get_option('civic_twin_api_key');
        $default_view = get_option('civic_twin_default_view');
        $cache_timeout = get_option('civic_twin_cache_timeout');
        $theme_accent = get_option('civic_twin_theme_accent', '#059669');
        ?>
        <div class="wrap civic-twin-admin-wrap">
            <header class="ct-admin-header">
                <div class="ct-branding">
                    <span class="ct-icon-shield">🏙️</span>
                    <div>
                        <h1><?php _e('Civic_Twin Plugin V.4.0.1', 'civic-twin-wp'); ?></h1>
                        <p class="ct-subtitle"><?php _e('Rapid Installation, Shard Syncing, and NIST Smart City Dashboard integrations', 'civic-twin-wp'); ?></p>
                    </div>
                </div>
                <div class="ct-version-tag">V4.0.1 Stable</div>
            </header>

            <div class="ct-grid">
                <!-- Main Form Column -->
                <div class="ct-card ct-settings-card">
                    <h2>⚙️ <?php _e('Rapid Connection Configuration', 'civic-twin-wp'); ?></h2>
                    <p class="card-desc"><?php _e('Link your WordPress site securely to your hosting environment or civic dashboard instance.', 'civic-twin-wp'); ?></p>
                    
                    <form method="post" action="options.php" class="ct-form">
                        <?php settings_fields('civic_twin_settings_group'); ?>
                        <?php do_settings_sections('civic_twin_settings_group'); ?>

                        <div class="ct-form-row">
                            <label for="civic_twin_instance_url"><?php _e('Instance Dashboard URL', 'civic-twin-wp'); ?></label>
                            <input type="url" name="civic_twin_instance_url" id="civic_twin_instance_url" value="<?php echo esc_url($instance_url); ?>" placeholder="https://ais-pre-ksgaec2aylr4nxfua3aqki-145896567353.us-east1.run.app" class="regular-text" required />
                            <p class="description"><?php _e('The root URL where your digital twin application is deployed.', 'civic-twin-wp'); ?></p>
                        </div>

                        <div class="ct-form-row">
                            <label for="civic_twin_api_key"><?php _e('Gemini / System Access Key', 'civic-twin-wp'); ?></label>
                            <input type="password" name="civic_twin_api_key" id="civic_twin_api_key" value="<?php echo esc_attr($api_key); ?>" class="regular-text" placeholder="••••••••••••••••" />
                            <p class="description"><?php _e('Optional secure token for credential proxying and shard validation.', 'civic-twin-wp'); ?></p>
                        </div>

                        <div class="ct-form-row-grid">
                            <div class="ct-form-row">
                                <label for="civic_twin_default_view"><?php _e('Default Shortcode View', 'civic-twin-wp'); ?></label>
                                <select name="civic_twin_default_view" id="civic_twin_default_view">
                                    <option value="dashboard" <?php selected($default_view, 'dashboard'); ?>>Full Digital Twin Matrix</option>
                                    <option value="map" <?php selected($default_view, 'map'); ?>>ArcGIS / Leaflet Spatial Map</option>
                                    <option value="member_portal" <?php selected($default_view, 'member_portal'); ?>>CID Member Access Portal</option>
                                </select>
                            </div>
                            
                            <div class="ct-form-row">
                                <label for="civic_twin_cache_timeout"><?php _e('Local Fog Cache (seconds)', 'civic-twin-wp'); ?></label>
                                <input type="number" name="civic_twin_cache_timeout" id="civic_twin_cache_timeout" value="<?php echo esc_attr($cache_timeout); ?>" min="0" max="86400" />
                            </div>
                        </div>

                        <div class="ct-form-row">
                            <label for="civic_twin_theme_accent"><?php _e('Dashboard Accent Color', 'civic-twin-wp'); ?></label>
                            <input type="color" name="civic_twin_theme_accent" id="civic_twin_theme_accent" value="<?php echo esc_attr($theme_accent); ?>" />
                            <span class="color-text"><?php echo esc_attr($theme_accent); ?></span>
                        </div>

                        <div class="ct-actions">
                            <?php submit_button(__('Save Integration Settings', 'civic-twin-wp'), 'primary', 'submit', false); ?>
                            <button type="button" id="btn-test-connection" class="button button-secondary ct-btn-test">
                                🔌 <?php _e('Test Connection & Diagnostics', 'civic-twin-wp'); ?>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Diagnostics & Fast Actions Sidebar -->
                <div class="ct-sidebar-grid">
                    <div class="ct-card ct-status-card">
                        <h3>🔌 <?php _e('Integration Diagnostics', 'civic-twin-wp'); ?></h3>
                        <div class="status-indicator-box">
                            <div id="ct-connection-light" class="ct-indicator offline"></div>
                            <span id="ct-connection-text"><?php _e('Awaiting Diagnostic Scan...', 'civic-twin-wp'); ?></span>
                        </div>
                        <div class="diagnostics-logs" id="ct-diagnostics-logs">
                            <div class="log-entry system">[SYSTEM] Ready for installation verification.</div>
                        </div>
                    </div>

                    <div class="ct-card ct-quick-links">
                        <h3>🚀 <?php _e('Shortcodes Reference', 'civic-twin-wp'); ?></h3>
                        <p><?php _e('Embed your civic twin widgets on any WordPress page or post using these codes:', 'civic-twin-wp'); ?></p>
                        <ul class="shortcode-list">
                            <li>
                                <code>[civic_twin_dashboard]</code>
                                <span class="tip"><?php _e('Full interactive dashboard with NIST metric matrix.', 'civic-twin-wp'); ?></span>
                            </li>
                            <li>
                                <code>[civic_twin_map]</code>
                                <span class="tip"><?php _e('Embed spatial twin GIS maps with active CIDs.', 'civic-twin-wp'); ?></span>
                            </li>
                            <li>
                                <code>[civic_twin_member_portal]</code>
                                <span class="tip"><?php _e('Provides CID authentication and mesh node metrics.', 'civic-twin-wp'); ?></span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    public static function ajax_test_connection() {
        check_ajax_referer('civic_twin_admin_nonce', 'security');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Unauthorized permission check', 'civic-twin-wp')));
        }

        $url = get_option('civic_twin_instance_url');
        if (empty($url)) {
            wp_send_json_error(array('message' => __('No instance URL configured.', 'civic-twin-wp')));
        }

        // Hit the health check API of Civic Twin applet
        $health_url = esc_url_raw(trailingslashit($url) . 'api/admin/security/status');
        $response = wp_remote_get($health_url, array('timeout' => 8));

        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => __('Connection failed.', 'civic-twin-wp'),
                'details' => $response->get_error_message()
            ));
        }

        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) {
            wp_send_json_error(array(
                'message' => sprintf(__('Instance returned error code %d.', 'civic-twin-wp'), $code),
                'details' => __('Please check your URL configuration and verify the server is running.', 'civic-twin-wp')
            ));
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        wp_send_json_success(array(
            'message' => __('Connection Successful!', 'civic-twin-wp'),
            'status' => 'online',
            'api_details' => $data,
            'timestamp' => current_time('mysql')
        ));
    }
}
Civic_Twin_Admin::init();

