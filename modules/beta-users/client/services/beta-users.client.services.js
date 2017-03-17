(function () {
    'use strict';

    angular
        .module('betaUsers')
        .factory('BetaUser', BetaUserService);

    BetaUserService.$inject = ['$resource'];

    function BetaUserService($resource) {
        var BetaUser = $resource('/api/beta-users');

        return BetaUser;

    }
}());
