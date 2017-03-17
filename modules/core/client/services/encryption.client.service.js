(function () {
    'use strict';

    // Create the image handling wrapper service
    angular
        .module('core')
        .factory('Encryption', Encryption);

    Encryption.$inject = [];

    function Encryption() {
        var service = {
            encode: encode,
            decode: decode
        };

        function encode(s) {
            var enc = [];
            var str = s.toString();
            for (var i = 0; i < s.length; i++) {
                var ascii = s.charCodeAt(i).toString();
                ascii = (ascii.length < 3) ? ('0' + ascii) : ascii;
                enc.push(ascii);
            }
            return enc.join('');
        }

        function decode(s) {
            var str = s.toString();
            var denc = '';
            str.match(/.{1,3}/g).forEach(function(snc) {
                denc += String.fromCharCode(snc);
            });
            return denc;
        }

        return service;
    }
}());
