(function () {
    'use strict';

    angular
        .module('core')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['Authentication', 'BetaUser', 'ErrorHandler', 'toastr', '$scope', '$rootScope', '$window'];

    function HomeController(Authentication, BetaUser, ErrorHandler, toastr, $scope, $rootScope, $window) {

        var vm = this;
        vm.user = new BetaUser();

        // View function bindings
        vm.saveUserEmail = saveUserEmail;

        vm.authentication = Authentication;

        $rootScope.navHeader = false;

        vm.env = $window.env;

        /**
         * Call server api to save user email
         * Email is of users who are interested in product
         * before its launch.
         */
        function saveUserEmail(formValid) {
            console.log(formValid, 'formValid');
            if (!formValid) {
                $scope.$broadcast('show-form-errors');
                return;
            }
            BetaUser.save(vm.user, function(response) {
                toastr.success('Email registered successfully');
            }, function(err) {
                ErrorHandler.error(err);
            });
        }

    }
}());
