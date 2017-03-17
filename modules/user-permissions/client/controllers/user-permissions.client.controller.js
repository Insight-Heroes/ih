(function () {
    'use strict';

    // User permissions controller
    angular
        .module('user-permissions')
        .controller('UserPermissionsController', UserPermissionsController);

    UserPermissionsController.$inject = ['$scope', '$state', '$window', 'Authentication', 'userPermissionResolve'];

    function UserPermissionsController ($scope, $state, $window, Authentication, userPermission) {
        var vm = this;

        vm.authentication = Authentication;
        vm.userPermission = userPermission;
        vm.error = null;
        vm.form = {};
        vm.remove = remove;
        vm.save = save;

        // Remove existing User permission
        function remove() {
            if ($window.confirm('Are you sure you want to delete?')) {
                vm.userPermission.$remove($state.go('user-permissions.list'));
            }
        }

        // Save User permission
        function save(isValid) {
            if (!isValid) {
                $scope.$broadcast('show-errors-check-validity', 'vm.form.userPermissionForm');
                return false;
            }

            // TODO: move create/update logic to service
            if (vm.userPermission._id) {
                vm.userPermission.$update(successCallback, errorCallback);
            } else {
                vm.userPermission.$save(successCallback, errorCallback);
            }

            function successCallback(res) {
                $state.go('user-permissions.view', {
                    userPermissionId: res._id
                });
            }

            function errorCallback(res) {
                vm.error = res.data.message;
            }
        }
    }
}());
