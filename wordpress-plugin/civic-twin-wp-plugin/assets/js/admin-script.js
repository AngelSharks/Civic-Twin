/**
 * Civic_Twin WordPress Plugin Admin Script
 * Handles real-time connection diagnostics and ajax handshakes
 */

jQuery(document).ready(function($) {
    // Add custom admin styling rules
    var originalLabelText = $('#btn-test-connection').html();

    $('#btn-test-connection').on('click', function(e) {
        e.preventDefault();

        var $btn = $(this);
        var $indicator = $('#ct-connection-light');
        var $indicatorText = $('#ct-connection-text');
        var $logs = $('#ct-diagnostics-logs');

        // Set state to Connecting
        $btn.prop('disabled', true).text('⚡ Testing...');
        $indicator.attr('class', 'ct-indicator connecting');
        $indicatorText.text('Testing Connection...');

        // Append log
        addLog($logs, 'info', '[DIAG] Launching outbound API handshakes to digital twin instance...');

        var instanceUrl = $('#civic_twin_instance_url').val();
        if (!instanceUrl) {
            addLog($logs, 'error', '[DIAG ERROR] Instance URL is empty. Please enter a valid URL.');
            resetButton($btn, originalLabelText);
            $indicator.attr('class', 'ct-indicator offline');
            $indicatorText.text('Config Error');
            return;
        }

        addLog($logs, 'info', '[DIAG] Target: ' + instanceUrl);

        // We will create a security nonce in wordpress localized script, or create on fly
        // WP default admin ajax security
        var data = {
            action: 'test_civic_twin_connection',
            security: typeof ctAdminParams !== 'undefined' ? ctAdminParams.nonce : '',
        };

        // Note: WP requires a localized parameter for nonce or we can pull from inline scripts
        // But we can also make a direct fetch to the API from browser side for verification!
        // This is a great fallback and provides double confirmation!
        var directUrl = instanceUrl.replace(/\/$/, '') + '/api/admin/security/status';

        addLog($logs, 'info', '[DIAG] Attempting direct browser handshake at: ' + directUrl);

        $.ajax({
            url: directUrl,
            method: 'GET',
            timeout: 5000,
            success: function(response) {
                addLog($logs, 'success', '[DIAG SUCCESS] Browser handshake completed! HTTP 200 OK.');
                if (response && response.results) {
                    addLog($logs, 'success', '[DIAG] Remote Shard Integrity: ' + response.results.length + ' active layers verified.');
                    
                    // Look for Glasswing safety details
                    var glasswing = response.results.find(function(r) { return r.id === 'sec-004'; });
                    if (glasswing) {
                        addLog($logs, 'success', '[NIST] ' + glasswing.message);
                    }
                }
                
                $indicator.attr('class', 'ct-indicator online');
                $indicatorText.text('Connected & Synchronized');
                addLog($logs, 'success', '[SYSTEM] Installation verified. Civic_Twin is ready for Gutenberg embedding.');
                resetButton($btn, originalLabelText);
            },
            error: function(xhr, status, error) {
                addLog($logs, 'error', '[DIAG ERROR] Direct browser handshake timed out or failed (CORS or offline).');
                addLog($logs, 'info', '[DIAG] Attempting secure server-side PHP proxy handshake instead...');

                // Server side fallback (AJAX admin-ajax.php)
                // Let's perform a simple post to the standard WP admin-ajax action
                $.ajax({
                    url: ajaxurl,
                    method: 'POST',
                    data: {
                        action: 'test_civic_twin_connection',
                        security: $('#_wpnonce').val() // Use the standard page nonce as fallback
                    },
                    success: function(wpRes) {
                        if (wpRes.success) {
                            addLog($logs, 'success', '[PROXY SUCCESS] Server-side handshake OK!');
                            $indicator.attr('class', 'ct-indicator online');
                            $indicatorText.text('Connected (Server-Proxy)');
                        } else {
                            addLog($logs, 'error', '[PROXY ERROR] ' + (wpRes.data ? wpRes.data.message : 'Unknown error'));
                            $indicator.attr('class', 'ct-indicator offline');
                            $indicatorText.text('Verification Failed');
                        }
                        resetButton($btn, originalLabelText);
                    },
                    error: function() {
                        addLog($logs, 'error', '[PROXY ERROR] Server connection timeout.');
                        $indicator.attr('class', 'ct-indicator offline');
                        $indicatorText.text('Offline');
                        resetButton($btn, originalLabelText);
                    }
                });
            }
        });
    });

    function addLog($logsEl, type, text) {
        var time = new Date().toLocaleTimeString();
        var styleClass = 'system';
        if (type === 'success') styleClass = 'success';
        if (type === 'error') styleClass = 'error';

        var logLine = $('<div class="log-entry ' + styleClass + '">[' + time + '] ' + text + '</div>');
        $logsEl.append(logLine);
        $logsEl.scrollTop($logsEl[0].scrollHeight);
    }

    function resetButton($btnEl, label) {
        $btnEl.prop('disabled', false).html(label);
    }
});
