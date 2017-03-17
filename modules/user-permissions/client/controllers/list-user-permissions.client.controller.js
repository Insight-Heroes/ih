(function () {
    'use strict';

    angular
        .module('user-permissions')
        .controller('UserPermissionsListController', UserPermissionsListController);

    UserPermissionsListController.$inject = ['UserPermissionsService'];

    function UserPermissionsListController(UserPermissionsService) {
        var vm = this;

        vm.userPermissions = UserPermissionsService.query();
    }
}());
