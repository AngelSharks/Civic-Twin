/**
 * Civic_Twin Santa Barbara Admin Script
 */

jQuery(document).ready(function($) {
    var $btn = $('#btn-test-connection');
    if (!$btn.length) return;

    var originalText = $btn.html();

    $btn.on('click', function(e) {
        e.preventDefault();

        var $indicator = $('#ct-connection-light');
        var $indicatorText = $('#ct-connection-text');
        var $logs = $('#ct-diagnostics-logs');

        $btn.prop('disabled', true).text('⚡ Connecting...');
        $indicator.attr('class', 'ct-indicator connecting');
        $indicatorText.text('Testing Host Connectivity...');

        var instanceUrl = $('#civic_twin_sb_instance_url').val();
        if (!instanceUrl) {
            $logs.prepend('<div>[ERROR] Host URL is missing.</div>');
            $indicator.attr('class', 'ct-indicator offline');
            $indicatorText.text('Config Error');
            $btn.prop('disabled', false).html(originalText);
            return;
        }

        // Direct browser ping as initial check
        var pingUrl = instanceUrl.replace(/\/$/, '') + '/api/admin/security/status';
        $logs.prepend('<div>[PING] Handshake sent to: ' + pingUrl + '</div>');

        $.ajax({
            url: pingUrl,
            method: 'GET',
            timeout: 6000,
            success: function(resp) {
                $indicator.attr('class', 'ct-indicator online');
                $indicatorText.text('Host Online (HTTP 200)');
                $logs.prepend('<div style="color:#10b981;">[SUCCESS] Santa Barbara Civic Twin host responding with 200 OK.</div>');
                $btn.prop('disabled', false).html(originalText);
            },
            error: function(err) {
                // Fallback to WP admin-ajax proxy
                if (typeof ctAdminParams !== 'undefined') {
                    $.post(ctAdminParams.ajax_url, {
                        action: 'test_civic_twin_sb_connection',
                        security: ctAdminParams.nonce
                    }, function(ajaxResp) {
                        if (ajaxResp.success) {
                            $indicator.attr('class', 'ct-indicator online');
                            $indicatorText.text('Host Synchronized via Proxy');
                            $logs.prepend('<div style="color:#10b981;">[SUCCESS] ' + ajaxResp.data.message + '</div>');
                        } else {
                            $indicator.attr('class', 'ct-indicator offline');
                            $indicatorText.text('Connection Warning');
                            $logs.prepend('<div style="color:#ef4444;">[FAIL] ' + (ajaxResp.data ? ajaxResp.data.message : 'Unknown error') + '</div>');
                        }
                        $btn.prop('disabled', false).html(originalText);
                    });
                } else {
                    $indicator.attr('class', 'ct-indicator offline');
                    $indicatorText.text('Offline / Blocked');
                    $logs.prepend('<div style="color:#ef4444;">[FAIL] Network or CORS error reaching host.</div>');
                    $btn.prop('disabled', false).html(originalText);
                }
            }
        });
    });
});
