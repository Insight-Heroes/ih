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
        .filter('removetags', function() {
            return function(text) {
                if (text !== undefined && text !== null) {
                    var filteredText = text.replace(/<[^>]+>/gm, '');
                    return filteredText.replace(/&nbsp;/g, ' ');
                } else {
                    return '';
                }
            };
        });
}());
