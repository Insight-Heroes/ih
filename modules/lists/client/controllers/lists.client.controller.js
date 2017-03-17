(function () {
    'use strict';

    // Lists controller
    angular
        .module('lists')
        .controller('ListsController', ListsController);

    ListsController.$inject = ['$scope', '$state', '$window', 'Authentication', 'listResolve', 'Survey', '$stateParams', 'ErrorHandler', 'toastr'];

    function ListsController ($scope, $state, $window, Authentication, list, Survey, $stateParams, ErrorHandler, toastr) {
        var vm = this;
        vm.listPage = true;
        // View variable bindings
        vm.authentication = Authentication;
        vm.list = list;
        vm.error = null;
        vm.form = {};
        vm.save = save;
        vm.hidePublish = true;
        // Fetch Survey
        Survey.get({ id: $stateParams.surveyId }, function success(survey) {
            vm.survey = survey;
        }, function error(err) {
            $state.go('dashboard');
            ErrorHandler.error(err);
        });

        // Save List
        function save(formValid) {
            if (!formValid) {
                $scope.$broadcast('show-form-errors');
                return false;
            }

            // TODO: move create/update logic to service
            if (vm.list._id) {
                vm.list.$update(successCallback, errorCallback);
            } else {
                vm.list.$save(successCallback, errorCallback);
            }
   }
            function successCallback(res) {
                if ($state.$current.name === 'lists.create') {
                    console.log('vm.list', vm.list);
                    $state.go('lists.addContacts', {
                        surveyId: vm.survey._id,
                        listId: vm.list._id
                    });
                } else {
                    toastr.success('List updated successfully');
                    $state.go('lists.list', {
                        surveyId: vm.survey._id
                    });
                }
            }
            function errorCallback(res) {
                ErrorHandler.error(res);
            }

    }
}());
