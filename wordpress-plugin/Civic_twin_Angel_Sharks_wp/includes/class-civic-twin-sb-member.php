<?php
/**
 * Civic_Twin Santa Barbara Demo Member & Page Controller (PHP 8.2+)
 * 
 * Automatically scaffolds Santa Barbara demo pages and shortcode containers.
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

class Civic_Twin_SB_Member {

    public static function create_default_pages(): void {
        $pages = array(
            'santa-barbara-digital-twin' => array(
                'title' => 'City of Santa Barbara — Digital Twin Portal',
                'content' => "<!-- wp:paragraph --><p>Welcome to the official Santa Barbara Digital Twin demonstration platform. Explore real-time municipal hydrology, transit flows, and environmental indicators below.</p><!-- /wp:paragraph -->\n\n[civic_twin_dashboard height=\"800px\"]\n\n[civic_twin_sb_info]",
                'meta' => 'ct_sb_portal_dashboard'
            ),
            'santa-barbara-gis-map' => array(
                'title' => 'Santa Barbara GIS & Coastal Watershed Map',
                'content' => "<!-- wp:paragraph --><p>High-resolution spatial GIS layers for the City of Santa Barbara, featuring the Mission Creek watershed, US-101 transit lines, and coastal marine zones.</p><!-- /wp:paragraph -->\n\n[civic_twin_map height=\"650px\"]",
                'meta' => 'ct_sb_portal_map'
            ),
            'santa-barbara-community-portal' => array(
                'title' => 'Santa Barbara Resident & B-LAN Mesh Portal',
                'content' => "<!-- wp:paragraph --><p>Decentralized community access point for neighborhood mesh telemetry, tactical emergency notifications, and Community Identity (CID) authentication.</p><!-- /wp:paragraph -->\n\n[civic_twin_member_portal height=\"700px\"]",
                'meta' => 'ct_sb_portal_community'
            ),
            'santa-barbara-solar-proposals' => array(
                'title' => 'Santa Barbara Solar Canopy & Civil 3D Proposals',
                'content' => "<!-- wp:paragraph --><p>Autodesk Civil 3D Solar Canopy Carport Proposal Studio for Santa Barbara, CA. Click and drag solar carports over parking lots, simulate 100% net-zero self-sufficiency, and export LandXML 1.2 surface and alignment models.</p><!-- /wp:paragraph -->\n\n[civic_twin_civil3d_proposal]",
                'meta' => 'ct_sb_portal_civil3d'
            )
        );

        foreach ($pages as $slug => $page_data) {
            $existing_pages = get_pages(array(
                'meta_key' => $page_data['meta'],
                'number' => 1
            ));

            if (empty($existing_pages)) {
                $existing_by_path = get_page_by_path($slug);
                if (!$existing_by_path) {
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

    public static function render_creator_page(): void {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Unauthorized access.', 'civic-twin-sb'));
        }

        if (isset($_POST['ct_sb_trigger_pages']) && check_admin_referer('ct_sb_pages_nonce')) {
            self::create_default_pages();
            echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Santa Barbara Demo Pages verified & created successfully!', 'civic-twin-sb') . '</p></div>';
        }

        $dashboard_pages = get_pages(array('meta_key' => 'ct_sb_portal_dashboard'));
        $map_pages = get_pages(array('meta_key' => 'ct_sb_portal_map'));
        $community_pages = get_pages(array('meta_key' => 'ct_sb_portal_community'));
        $civil3d_pages = get_pages(array('meta_key' => 'ct_sb_portal_civil3d'));
        ?>
        <div class="wrap civic-twin-admin-wrap">
            <header class="ct-admin-header">
                <div class="ct-branding">
                    <span class="ct-icon-shield">📄</span>
                    <div>
                        <h1><?php _e('Santa Barbara Demo Page Scaffolding', 'civic-twin-sb'); ?></h1>
                        <p class="ct-subtitle"><?php _e('Deploy public Santa Barbara demo portals directly into your WordPress navigation', 'civic-twin-sb'); ?></p>
                    </div>
                </div>
            </header>

            <div class="ct-card" style="max-width: 800px; margin-top: 20px;">
                <h2>🏙️ <?php _e('Generated Demonstration Pages', 'civic-twin-sb'); ?></h2>
                <p class="card-desc"><?php _e('The following pages provide immediate public access to the Santa Barbara Civic Twin demo:', 'civic-twin-sb'); ?></p>

                <table class="widefat fixed striped" style="margin: 20px 0;">
                    <thead>
                        <tr>
                            <th><?php _e('Portal Name', 'civic-twin-sb'); ?></th>
                            <th><?php _e('Shortcode', 'civic-twin-sb'); ?></th>
                            <th><?php _e('Status', 'civic-twin-sb'); ?></th>
                            <th><?php _e('Action', 'civic-twin-sb'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong><?php _e('Santa Barbara Digital Twin Portal', 'civic-twin-sb'); ?></strong></td>
                            <td><code>[civic_twin_dashboard]</code></td>
                            <td><?php echo !empty($dashboard_pages) ? '<span style="color:#059669;font-weight:bold;">Active</span>' : '<span style="color:#dc2626;">Not Created</span>'; ?></td>
                            <td>
                                <?php if (!empty($dashboard_pages)): ?>
                                    <a href="<?php echo esc_url(get_permalink($dashboard_pages[0]->ID)); ?>" target="_blank" class="button button-small"><?php _e('View Page', 'civic-twin-sb'); ?> ↗</a>
                                <?php else: ?>
                                    <em>—</em>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <tr>
                            <td><strong><?php _e('Santa Barbara GIS & Watershed Map', 'civic-twin-sb'); ?></strong></td>
                            <td><code>[civic_twin_map]</code></td>
                            <td><?php echo !empty($map_pages) ? '<span style="color:#059669;font-weight:bold;">Active</span>' : '<span style="color:#dc2626;">Not Created</span>'; ?></td>
                            <td>
                                <?php if (!empty($map_pages)): ?>
                                    <a href="<?php echo esc_url(get_permalink($map_pages[0]->ID)); ?>" target="_blank" class="button button-small"><?php _e('View Page', 'civic-twin-sb'); ?> ↗</a>
                                <?php else: ?>
                                    <em>—</em>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <tr>
                            <td><strong><?php _e('Santa Barbara Resident B-LAN Portal', 'civic-twin-sb'); ?></strong></td>
                            <td><code>[civic_twin_member_portal]</code></td>
                            <td><?php echo !empty($community_pages) ? '<span style="color:#059669;font-weight:bold;">Active</span>' : '<span style="color:#dc2626;">Not Created</span>'; ?></td>
                            <td>
                                <?php if (!empty($community_pages)): ?>
                                    <a href="<?php echo esc_url(get_permalink($community_pages[0]->ID)); ?>" target="_blank" class="button button-small"><?php _e('View Page', 'civic-twin-sb'); ?> ↗</a>
                                <?php else: ?>
                                    <em>—</em>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <tr>
                            <td><strong><?php _e('Santa Barbara Solar Canopy & Civil 3D Proposals', 'civic-twin-sb'); ?></strong></td>
                            <td><code>[civic_twin_civil3d_proposal]</code></td>
                            <td><?php echo !empty($civil3d_pages) ? '<span style="color:#059669;font-weight:bold;">Active</span>' : '<span style="color:#dc2626;">Not Created</span>'; ?></td>
                            <td>
                                <?php if (!empty($civil3d_pages)): ?>
                                    <a href="<?php echo esc_url(get_permalink($civil3d_pages[0]->ID)); ?>" target="_blank" class="button button-small"><?php _e('View Page', 'civic-twin-sb'); ?> ↗</a>
                                <?php else: ?>
                                    <em>—</em>
                                <?php endif; ?>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <form method="post">
                    <?php wp_nonce_field('ct_sb_pages_nonce'); ?>
                    <button type="submit" name="ct_sb_trigger_pages" class="button button-primary" style="background:#0284c7; border-color:#0284c7; padding: 6px 20px; font-weight: bold;">
                        🚀 <?php _e('Re-generate / Verify Santa Barbara Pages', 'civic-twin-sb'); ?>
                    </button>
                </form>
            </div>

            <!-- Live In-Admin Preview -->
            <div class="ct-card" style="max-width: 1000px; margin-top: 24px;">
                <h2>👁️ <?php _e('Live Santa Barbara Digital Twin Preview (Native)', 'civic-twin-sb'); ?></h2>
                <p class="card-desc"><?php _e('Real-time simulation running directly within WordPress without external iframe authentication errors.', 'civic-twin-sb'); ?></p>
                <div style="margin-top: 16px;">
                    <?php echo Civic_Twin_SB_Shortcodes::render_dashboard(array('height' => '550px')); ?>
                </div>
            </div>
        </div>
        <?php
    }
}
