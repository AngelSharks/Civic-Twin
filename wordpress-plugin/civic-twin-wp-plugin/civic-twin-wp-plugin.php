<?php
/**
 * Plugin Name: Civic_Twin Plugin V.4.0.1
 * Plugin URI: https://github.com/AngelSharks/Civic-Twin
 * Description: Standalone Civic_Twin integration for WordPress. Includes rapid installation admin tools, automated member portal page creation, and immersive digital twin dashboards using B-LAN and NIST layers.
 * Version: 4.0.1
 * Author: Angel Sharks
 * Author URI: https://angelsharks.net
 * License: GPL2
 * Text Domain: civic-twin-wp
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

define('CIVIC_TWIN_VERSION', '4.0.1');
define('CIVIC_TWIN_PATH', plugin_dir_path(__FILE__));
define('CIVIC_TWIN_URL', plugin_dir_url(__FILE__));

// Load individual components
require_once CIVIC_TWIN_PATH . 'includes/class-civic-twin-admin.php';
require_once CIVIC_TWIN_PATH . 'includes/class-civic-twin-member.php';
require_once CIVIC_TWIN_PATH . 'includes/class-civic-twin-shortcodes.php';

/**
 * Activation Hook: Setup default pages and options
 */
function civic_twin_activate() {
    // Save default configuration
    add_option('civic_twin_instance_url', 'https://ais-pre-ksgaec2aylr4nxfua3aqki-145896567353.us-east1.run.app');
    add_option('civic_twin_api_key', '');
    add_option('civic_twin_default_view', 'dashboard');
    add_option('civic_twin_cache_timeout', 3600);
    add_option('civic_twin_theme_accent', '#059669'); // emerald-600

    // Auto-create Civic Twin Member Pages
    Civic_Twin_Member::create_default_pages();
}
register_activation_hook(__FILE__, 'civic_twin_activate');

/**
 * Deactivation Hook: Cleanup temporary caches
 */
function civic_twin_deactivate() {
    delete_transient('civic_twin_cached_insights');
    delete_transient('civic_twin_connection_status');
}
register_deactivation_hook(__FILE__, 'civic_twin_deactivate');

/**
 * Enqueue scripts and styles for shortcodes
 */
function civic_twin_enqueue_scripts() {
    wp_enqueue_style('civic-twin-public-style', CIVIC_TWIN_URL . 'assets/css/public-style.css', array(), CIVIC_TWIN_VERSION);
    wp_enqueue_script('civic-twin-public-script', CIVIC_TWIN_URL . 'assets/js/public-script.js', array('jquery'), CIVIC_TWIN_VERSION, true);

    // Pass options to javascript
    wp_localize_script('civic-twin-public-script', 'civicTwinOptions', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'instance_url' => esc_url(get_option('civic_twin_instance_url')),
        'theme_accent' => sanitize_hex_color(get_option('civic_twin_theme_accent', '#059669'))
    ));
}
add_action('wp_enqueue_scripts', 'civic_twin_enqueue_scripts');
