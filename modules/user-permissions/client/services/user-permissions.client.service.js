// User permissions service used to communicate User permissions REST endpoints
(function () {
    'use strict';

    angular
        .module('user-permissions')
        .factory('UserPermissionsService', UserPermissionsService);

    UserPermissionsService.$inject = ['$resource'];

    function UserPermissionsService($resource) {
        return $resource('api/user-permissions/:userPermissionId', {
            userPermissionId: '@_id'
        }, {
            update: {
                method: 'PUT'
            }
        });
    }
}());
