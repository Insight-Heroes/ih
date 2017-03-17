/**
 * Utility module to truncate text and append "..." character if it
 * goes beyond the specified character limit.
 *
 * Usage: <tt>{{ string | truncate:10 }}</tt>
 *
 */

(function () {
  'use strict';

    angular
        .module('core')
        .filter('truncate', function() {
            return function(text, length) {
                if (text !== undefined) {
                    if (isNaN(length)) {
                        length = 10;
                    }
                    return _.truncate(text, { length: length });
                }
            };
        });
}());
