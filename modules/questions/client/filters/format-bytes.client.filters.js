(function () {
    'use strict';

    angular
        .module('questions')
        .filter('formatBytes', formatBytes);

    function formatBytes() {
        // Define the bytes to be used in the filter
        var units = [
            'bytes',
            'KB',
            'MB',
            'GB',
            'TB',
            'PB'
        ];

        return function(bytes, precision) {
            if (!precision)
                precision = 2;
            if (isNaN(parseFloat(bytes)) || ! isFinite(bytes)) {
                return '?';
            }
            var unit = 0;
            while (bytes >= 1024) {
                bytes /= 1024;
                unit ++;
            }
            return bytes.toFixed(+ precision) + ' ' + units[unit];

        };
    }
}());
