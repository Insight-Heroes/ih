(function () {
  'use strict';

    angular
        .module('lists')
        .controller('ListsListController', ListsListController);

    ListsListController.$inject = ['ListsService', 'Survey', '$stateParams', 'ErrorHandler', '$state', '$mdDialog', 'SharedService'];

    function ListsListController(ListsService, Survey, $stateParams, ErrorHandler, $state, $mdDialog, SharedService) {
        var vm = this;

        // view variables
        vm.hidePreview = true;
        // view function bindings
        vm.delete = deleteList;

        // Find the lists
        vm.lists = ListsService.query();
        vm.publishText = 'Publish';
        // Fetch Survey
        Survey.get({ id: $stateParams.surveyId }, function success(survey) {
            vm.survey = survey;
            hidePublish(vm.survey.questions.length);
        }, function error(err) {
            $state.go('dashboard');
            ErrorHandler.error(err);
        });


        function hidePublish(questions) {
          if (questions < 1 || vm.lists.length === 0) {
            vm.hidePublishButton = true;
          }
        }
      // Publish Survey
        vm.openPublishModal = function() {
          SharedService.publishSurvey(vm.survey);
        };
        /**
         * @param  {Object} list - list, which needs to be deleted
         */
        function deleteList(list, ev) {
            var confirm = $mdDialog.confirm()
                .title('Delete list?')
                .textContent('Are you sure, you want to delete this List? All the contacts from the list will be deleted!')
                .targetEvent(ev)
                .ok('Yes')
                .cancel('No');

            $mdDialog.show(confirm).then(function() {
                list.$delete(function() {
                    $state.go('lists.list', { surveyId: vm.survey._id }, {
                        reload: true,
                        inherit: false,
                        notify: true
                    });}, function(err) {
                        ErrorHandler.error(err);
                    });
                });
        }
    }
}());
