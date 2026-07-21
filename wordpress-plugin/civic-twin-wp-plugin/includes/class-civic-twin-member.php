<?php
/**
 * Civic_Twin Member Controller
 * 
 * Handles creation of specialized member pages, registration interfaces, and public portals.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Civic_Twin_Member {
    
    /**
     * Automatic page creator upon plugin activation or manual trigger.
     */
    public static function create_default_pages() {
        $pages = array(
            'civic-twin-dashboard' => array(
                'title' => 'Civic Twin Spatial Portal',
                'content' => '[civic_twin_dashboard]',
                'meta' => 'ct_portal_dashboard'
            ),
            'cid-member-registration' => array(
                'title' => 'CID Community Member registration',
                'content' => '[civic_twin_member_portal]',
                'meta' => 'ct_portal_registration'
            ),
            'civic-twin-active-map' => array(
                'title' => 'Civic Twin Leaflet Map',
                'content' => '[civic_twin_map]',
                'meta' => 'ct_portal_map'
            )
        );

        foreach ($pages as $slug => $page_data) {
            // Check if page already exists by meta key or slug
            $existing_page = get_pages(array(
                'meta_key' => $page_data['meta'],
                'number' => 1
            ));

            if (empty($existing_page)) {
                // Double check by slug to prevent duplicates
                $post_id = get_page_by_path($slug);
                
                if (!$post_id) {
                    $new_post = array(
                        'post_type' => 'page',
                        'post_title' => $page_data['title'],
                        'post_content' => $page_data['content'],
                        'post_status' => 'publish',
                        'post_name' => $slug
                    );

                    $inserted_id = wp_insert_post($new_post);
                    if ($inserted_id && !is_wp_error($inserted_id)) {
                        update_post_meta($inserted_id, $page_data['meta'], 'true');
                    }
                }
            }
        }
    }

    /**
     * Initialize the member controller.
     */
    public static function init() {
        // Safe placeholder for class-level hooks if any are needed in the future
    }

    /**
     * Render the admin sub-menu page to manually trigger page creations.
     */
    public static function render_creator_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        if (isset($_POST['ct_trigger_page_creation'])) {
            check_admin_referer('ct_create_pages_nonce');
            self::create_default_pages();
            echo '<div class="notice notice-success is-dismissible"><p>' . __('Standalone Civic_Twin member pages successfully verified & created!', 'civic-twin-wp') . '</p></div>';
        }

        // Get count of existing pages
        $dashboard_pages = get_pages(array('meta_key' => 'ct_portal_dashboard'));
        $reg_pages = get_pages(array('meta_key' => 'ct_portal_registration'));
        $map_pages = get_pages(array('meta_key' => 'ct_portal_map'));
        ?>
        <div class="wrap civic-twin-admin-wrap">
            <header class="ct-admin-header">
                <div class="ct-branding">
                    <span class="ct-icon-shield">👥</span>
                    <div>
                        <h1><?php _e('Civic_Twin Member Page Creation', 'civic-twin-wp'); ?></h1>
                        <p class="ct-subtitle"><?php _e('Deploy fully synchronized user and resident portal pages automatically', 'civic-twin-wp'); ?></p>
                    </div>
                </div>
            </header>

            <div class="ct-card">
                <h2>📊 <?php _e('Automated Content Creation Suite', 'civic-twin-wp'); ?></h2>
                <p><?php _e('Civic_Twin V.4.0.1 can instantly register customized WordPress pages matching your physical community configuration. These pages automatically pull their responsive layout directly from the primary digital twin instance.', 'civic-twin-wp'); ?></p>

                <div class="ct-pages-status-table">
                    <div class="ct-table-header">
                        <div class="col-title"><?php _e('Required Member Page', 'civic-twin-wp'); ?></div>
                        <div class="col-shortcode"><?php _e('Active Shortcode', 'civic-twin-wp'); ?></div>
                        <div class="col-status"><?php _e('Status', 'civic-twin-wp'); ?></div>
                    </div>
                    
                    <div class="ct-table-row">
                        <div class="col-title">
                            <strong><?php _e('Civic Twin Spatial Portal', 'civic-twin-wp'); ?></strong>
                            <p class="desc"><?php _e('Interactive digital twin workspace showcasing all 6 NIST layers (Energy, Water, Safety, etc.)', 'civic-twin-wp'); ?></p>
                        </div>
                        <div class="col-shortcode"><code>[civic_twin_dashboard]</code></div>
                        <div class="col-status">
                            <?php if (!empty($dashboard_pages)): ?>
                                <span class="status-badge active">✓ <?php _e('Active Page Created', 'civic-twin-wp'); ?></span>
                                <a href="<?php echo esc_url(get_permalink($dashboard_pages[0]->ID)); ?>" target="_blank" class="view-link"><?php _e('View Page', 'civic-twin-wp'); ?> ↗</a>
                            <?php else: ?>
                                <span class="status-badge inactive"><?php _e('Missing', 'civic-twin-wp'); ?></span>
                            <?php endif; ?>
                        </div>
                    </div>

                    <div class="ct-table-row">
                        <div class="col-title">
                            <strong><?php _e('CID Community Member registration', 'civic-twin-wp'); ?></strong>
                            <p class="desc"><?php _e('Member enrollment page with local B-LAN tactical diagnostics, encryption credentials, and nodes syncing status.', 'civic-twin-wp'); ?></p>
                        </div>
                        <div class="col-shortcode"><code>[civic_twin_member_portal]</code></div>
                        <div class="col-status">
                            <?php if (!empty($reg_pages)): ?>
                                <span class="status-badge active">✓ <?php _e('Active Page Created', 'civic-twin-wp'); ?></span>
                                <a href="<?php echo esc_url(get_permalink($reg_pages[0]->ID)); ?>" target="_blank" class="view-link"><?php _e('View Page', 'civic-twin-wp'); ?> ↗</a>
                            <?php else: ?>
                                <span class="status-badge inactive"><?php _e('Missing', 'civic-twin-wp'); ?></span>
                            <?php endif; ?>
                        </div>
                    </div>

                    <div class="ct-table-row">
                        <div class="col-title">
                            <strong><?php _e('Civic Twin Leaflet Map', 'civic-twin-wp'); ?></strong>
                            <p class="desc"><?php _e('Dedicated full-width Leaflet map utilizing ArcGIS layer overlays to track physical systems.', 'civic-twin-wp'); ?></p>
                        </div>
                        <div class="col-shortcode"><code>[civic_twin_map]</code></div>
                        <div class="col-status">
                            <?php if (!empty($map_pages)): ?>
                                <span class="status-badge active">✓ <?php _e('Active Page Created', 'civic-twin-wp'); ?></span>
                                <a href="<?php echo esc_url(get_permalink($map_pages[0]->ID)); ?>" target="_blank" class="view-link"><?php _e('View Page', 'civic-twin-wp'); ?> ↗</a>
                            <?php else: ?>
                                <span class="status-badge inactive"><?php _e('Missing', 'civic-twin-wp'); ?></span>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

                <form method="post" action="" class="ct-manual-creator-form">
                    <?php wp_nonce_field('ct_create_pages_nonce'); ?>
                    <input type="hidden" name="ct_trigger_page_creation" value="1" />
                    <button type="submit" class="button button-primary ct-btn-large">
                        🧱 <?php _e('Rapid Create / Repair Missing Pages', 'civic-twin-wp'); ?>
                    </button>
                </form>
            </div>
        </div>
        <?php
    }
}
Civic_Twin_Member::init();
