<?php
/**
 * Plugin Name: Civic Twin Angel Sharks - Autodesk Civil 3D & Solar Proposal Studio V.07
 * Plugin URI: https://santabarbaraca.gov/
 * Description: Dedicated WordPress Digital Twin & Autodesk Civil 3D Proposal Plugin for the City of Santa Barbara, CA (https://santabarbaraca.gov/) by Angel Sharks. Synchronized with GitHub main fork (AngelSharks/Civic-Twin). Features Autodesk AEC Data Model granular BIM simulation, variable 10-year annual cash flow ledger with user adjustments, interactive solar canopy carport designer, 100% net-zero energy self-sufficiency simulations, property digital twin detail layers, and Autodesk Civil 3D LandXML 1.2 surface/alignment exports. 100% Native standalone Leaflet OpenStreetMap rendering (zero Google 401 iframes). Requires PHP 8.2 or higher.
 * Version: 0.7.0
 * Requires at least: 6.0
 * Requires PHP: 8.2
 * Author: Angel Sharks
 * Author URI: https://angelsharks.net
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: civic-twin-sb
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Enforce PHP 7.4 or higher requirement (Compatible with PHP 7.4, 8.0, 8.1, 8.2, 8.3)
if (version_compare(PHP_VERSION, '7.4.0', '<')) {
    add_action('admin_notices', function(): void {
        echo '<div class="notice notice-error"><p><strong>Civic_Twin_Angel_Sharks_ap.V.07:</strong> This plugin requires PHP 7.4 or higher. Your server is running PHP ' . esc_html(PHP_VERSION) . '. Please upgrade your PHP runtime.</p></div>';
    });
    return;
}

define('CIVIC_TWIN_SB_VERSION', '0.7.0');
define('CIVIC_TWIN_SB_ARCHIVE_NAME', 'Civic_Twin_Angel_Sharks_ap.V.07.zip');
define('CIVIC_TWIN_SB_GITHUB_REPO', 'AngelSharks/Civic-Twin');
define('CIVIC_TWIN_SB_GITHUB_BRANCH', 'main');
define('CIVIC_TWIN_SB_PATH', plugin_dir_path(__FILE__));
define('CIVIC_TWIN_SB_URL', plugin_dir_url(__FILE__));

// Santa Barbara, CA Default Constants
define('CIVIC_TWIN_SB_DEFAULT_CITY', 'City of Santa Barbara, CA');
define('CIVIC_TWIN_SB_DEFAULT_WEBSITE', 'https://santabarbaraca.gov/');
define('CIVIC_TWIN_SB_DEFAULT_LAT', 34.42083);
define('CIVIC_TWIN_SB_DEFAULT_LNG', -119.69819);
define('CIVIC_TWIN_SB_DEFAULT_ADDRESS', '735 Anacapa Street, Santa Barbara, CA 93101');

// Enforce native standalone execution on every load (eliminates Google 401 error from old iframe configs)
add_action('plugins_loaded', function(): void {
    if (get_option('civic_twin_sb_embed_mode') === 'iframe') {
        update_option('civic_twin_sb_embed_mode', 'native');
    }
});

// Load PHP 8.2 compatible sub-controllers
require_once CIVIC_TWIN_SB_PATH . 'includes/class-civic-twin-sb-admin.php';
require_once CIVIC_TWIN_SB_PATH . 'includes/class-civic-twin-sb-member.php';
require_once CIVIC_TWIN_SB_PATH . 'includes/class-civic-twin-sb-shortcodes.php';

/**
 * Activation Hook: Setup Santa Barbara default options and member pages
 */
function civic_twin_sb_activate(): void {
    add_option('civic_twin_sb_city_name', CIVIC_TWIN_SB_DEFAULT_CITY);
    add_option('civic_twin_sb_city_website', CIVIC_TWIN_SB_DEFAULT_WEBSITE);
    add_option('civic_twin_sb_city_lat', (string)CIVIC_TWIN_SB_DEFAULT_LAT);
    add_option('civic_twin_sb_city_lng', (string)CIVIC_TWIN_SB_DEFAULT_LNG);
    add_option('civic_twin_sb_city_hall', CIVIC_TWIN_SB_DEFAULT_ADDRESS);
    add_option('civic_twin_sb_instance_url', 'https://ais-dev-ksgaec2aylr4nxfua3aqki-145896567353.us-east1.run.app');
    add_option('civic_twin_sb_embed_mode', 'native'); // 'native' (zero 401 errors, runs 100% inside WP) or 'iframe'
    add_option('civic_twin_sb_api_key', '');
    add_option('civic_twin_sb_default_view', 'dashboard');
    add_option('civic_twin_sb_theme_accent', '#0284c7'); // Ocean blue for Santa Barbara coastline
    add_option('civic_twin_sb_cache_timeout', 3600);

    // Auto-create Santa Barbara Demo Member Pages
    Civic_Twin_SB_Member::create_default_pages();
}
register_activation_hook(__FILE__, 'civic_twin_sb_activate');

/**
 * Deactivation Hook: Cleanup transients
 */
function civic_twin_sb_deactivate(): void {
    delete_transient('civic_twin_sb_cached_insights');
    delete_transient('civic_twin_sb_connection_status');
}
register_deactivation_hook(__FILE__, 'civic_twin_sb_deactivate');

/**
 * Enqueue scripts and styles for shortcodes and admin preview
 */
function civic_twin_sb_enqueue_scripts(): void {
    // Leaflet 1.9.4 for standalone native GIS and Digital Twin
    wp_enqueue_style('leaflet-css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', array(), '1.9.4');
    wp_enqueue_script('leaflet-js', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', array(), '1.9.4', true);

    wp_enqueue_style('civic-twin-sb-public-style', CIVIC_TWIN_SB_URL . 'assets/css/public-style.css', array('leaflet-css'), CIVIC_TWIN_SB_VERSION);
    wp_enqueue_script('civic-twin-sb-public-script', CIVIC_TWIN_SB_URL . 'assets/js/public-script.js', array('jquery', 'leaflet-js'), CIVIC_TWIN_SB_VERSION, true);

    wp_localize_script('civic-twin-sb-public-script', 'civicTwinSBOptions', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'cityName' => esc_html(get_option('civic_twin_sb_city_name', CIVIC_TWIN_SB_DEFAULT_CITY)),
        'cityWebsite' => esc_url(get_option('civic_twin_sb_city_website', CIVIC_TWIN_SB_DEFAULT_WEBSITE)),
        'cityLat' => (float)get_option('civic_twin_sb_city_lat', (string)CIVIC_TWIN_SB_DEFAULT_LAT),
        'cityLng' => (float)get_option('civic_twin_sb_city_lng', (string)CIVIC_TWIN_SB_DEFAULT_LNG),
        'embedMode' => (string)get_option('civic_twin_sb_embed_mode', 'native'),
        'instanceUrl' => esc_url(get_option('civic_twin_sb_instance_url', '')),
        'themeAccent' => sanitize_hex_color((string)get_option('civic_twin_sb_theme_accent', '#0284c7'))
    ));
}
add_action('wp_enqueue_scripts', 'civic_twin_sb_enqueue_scripts');
add_action('admin_enqueue_scripts', function($hook) {
    if (strpos((string)$hook, 'civic_twin_sb') !== false) {
        civic_twin_sb_enqueue_scripts();
    }
});
