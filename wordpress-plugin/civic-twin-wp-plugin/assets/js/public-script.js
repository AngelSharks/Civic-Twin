/**
 * Civic_Twin WordPress Plugin Public Script
 * Handles load state management and interaction hooks for embedded iframes.
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        // Find all civic-twin wrappers
        $('.ct-iframe-wrapper').each(function() {
            var $wrapper = $(this);
            var $iframe = $wrapper.find('iframe');
            var $loader = $wrapper.find('.ct-loader-overlay');

            // Fallback timeout to hide spinner if onload event doesn't trigger
            setTimeout(function() {
                if ($loader.is(':visible')) {
                    $loader.fadeOut(300);
                }
            }, 8000);

            $iframe.on('load', function() {
                $loader.fadeOut(300);
            });
        });
    });

})(jQuery);
