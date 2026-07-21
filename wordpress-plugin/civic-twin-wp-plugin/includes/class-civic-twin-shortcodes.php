<?php
/**
 * Civic_Twin Shortcodes
 * 
 * Registers and renders [civic_twin_dashboard], [civic_twin_map], and [civic_twin_member_portal]
 */

if (!defined('ABSPATH')) {
    exit;
}

class Civic_Twin_Shortcodes {
    public static function init() {
        add_shortcode('civic_twin_dashboard', array(__CLASS__, 'render_dashboard'));
        add_shortcode('civic_twin_map', array(__CLASS__, 'render_map'));
        add_shortcode('civic_twin_member_portal', array(__CLASS__, 'render_member_portal'));
    }

    /**
     * [civic_twin_dashboard]
     * Embeds the full Digital Twin Dashboard using a responsive secure frame wrapper
     */
    public static function render_dashboard($atts) {
        $atts = shortcode_atts(array(
            'height' => '750px',
            'border_radius' => '1.5rem',
            'theme' => 'light'
        ), $atts, 'civic_twin_dashboard');

        $instance_url = get_option('civic_twin_instance_url');
        if (empty($instance_url)) {
            return '<div class="ct-error-notice">' . __('Error: Civic Twin Instance URL not configured. Please visit WordPress Admin -> Civic Twin Hub to configure.', 'civic-twin-wp') . '</div>';
        }

        $iframe_url = esc_url(trailingslashit($instance_url) . '?view=public');
        $accent_color = sanitize_hex_color(get_option('civic_twin_theme_accent', '#059669'));

        ob_start();
        ?>
        <div class="ct-public-container" style="--ct-accent-color: <?php echo esc_attr($accent_color); ?>">
            <div class="ct-frame-header">
                <div class="ct-frame-brand">
                    <span class="ct-indicator active"></span>
                    <span><?php _e('CIVIC_TWIN SECURE DIGITAL INSTANCE', 'civic-twin-wp'); ?></span>
                </div>
                <div class="ct-frame-actions">
                    <a href="<?php echo esc_url($instance_url); ?>" target="_blank" class="ct-btn-header-link"><?php _e('Open External Portal', 'civic-twin-wp'); ?> ↗</a>
                </div>
            </div>
            <div class="ct-iframe-wrapper" style="height: <?php echo esc_attr($atts['height']); ?>; border-radius: <?php echo esc_attr($atts['border_radius']); ?>;">
                <div class="ct-loader-overlay">
                    <div class="ct-spinner"></div>
                    <p><?php _e('Initializing Digital Twin Matrix...', 'civic-twin-wp'); ?></p>
                </div>
                <iframe 
                    src="<?php echo esc_url($iframe_url); ?>" 
                    class="ct-iframe" 
                    id="civic-twin-main-iframe"
                    allow="geolocation; camera; microphone"
                    onload="document.querySelector('.ct-loader-overlay').style.display='none';">
                </iframe>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * [civic_twin_map]
     * Embeds only the spatial map component with ArcGIS/Leaflet layers.
     */
    public static function render_map($atts) {
        $atts = shortcode_atts(array(
            'height' => '600px',
            'border_radius' => '1.5rem',
        ), $atts, 'civic_twin_map');

        $instance_url = get_option('civic_twin_instance_url');
        if (empty($instance_url)) {
            return '<div class="ct-error-notice">' . __('Error: Civic Twin Instance URL not configured.', 'civic-twin-wp') . '</div>';
        }

        $iframe_url = esc_url(trailingslashit($instance_url) . '?view=public&focus=map');
        $accent_color = sanitize_hex_color(get_option('civic_twin_theme_accent', '#059669'));

        ob_start();
        ?>
        <div class="ct-public-container" style="--ct-accent-color: <?php echo esc_attr($accent_color); ?>">
            <div class="ct-iframe-wrapper" style="height: <?php echo esc_attr($atts['height']); ?>; border-radius: <?php echo esc_attr($atts['border_radius']); ?>;">
                <iframe 
                    src="<?php echo esc_url($iframe_url); ?>" 
                    class="ct-iframe" 
                    allow="geolocation">
                </iframe>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * [civic_twin_member_portal]
     * Renders member enrollment / login and local B-LAN tactical diagnostics for CIDs
     */
    public static function render_member_portal($atts) {
        $instance_url = get_option('civic_twin_instance_url');
        if (empty($instance_url)) {
            return '<div class="ct-error-notice">' . __('Error: Civic Twin Instance URL not configured.', 'civic-twin-wp') . '</div>';
        }

        $iframe_url = esc_url(trailingslashit($instance_url) . '?view=public&focus=mesh');
        $accent_color = sanitize_hex_color(get_option('civic_twin_theme_accent', '#059669'));

        ob_start();
        ?>
        <div class="ct-public-container" style="--ct-accent-color: <?php echo esc_attr($accent_color); ?>">
            <div class="ct-iframe-wrapper" style="height: 650px; border-radius: 1.5rem;">
                <iframe 
                    src="<?php echo esc_url($iframe_url); ?>" 
                    class="ct-iframe" 
                    allow="geolocation; camera; microphone">
                </iframe>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
Civic_Twin_Shortcodes::init();
