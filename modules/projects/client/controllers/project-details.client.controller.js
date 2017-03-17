(function () {
    'use strict';

    angular
        .module('projects')
        .controller('ProjectDetailsController', ProjectDetailsController);

    ProjectDetailsController.$inject = ['Project', 'Survey', '$mdDialog', '$state', '$stateParams', 'ErrorHandler', '$mdSidenav', 'Authentication', '$window', 'Encryption', '$uibModal'];
    function ProjectDetailsController(Project, Survey, $mdDialog, $state, $stateParams, ErrorHandler, $mdSidenav, Authentication, $window, Encryption, $uibModal) {
        var vm = this;
        // View variable binding
        vm.authentication = Authentication;
        vm.deleteSurvey = deleteSurvey;

        vm.goToEditAddSurvey = goToEditAddSurvey;

        vm.projectId = $stateParams.id;

        Survey.query({ projectId: $stateParams.id }, function(surveys) {
            vm.surveys = surveys;
        });

        Project.get({ id: vm.projectId }, function success(project) {
            vm.project = project;
        });

        function deleteSurvey(survey, ev) {
            var confirm = $mdDialog.confirm()
                .title('Delete Survey?')
                .textContent('Are you sure you want to delete the Survey?')
                .targetEvent(ev)
                .ok('Yes')
                .cancel('No');

            $mdDialog.show(confirm).then(function() {
                survey.$delete(function() {
                $state.go('projects.show', { id: vm.projectId }, { reload: true,
                    inherit: false,
                    notify: true
                });}, function(err) {
                    // toastr.error(err.message);
                });
            });
        }

        function goToEditAddSurvey(survey) {
           $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                windowClass: 'app-modal-window',
                templateUrl: 'modules/surveys/client/views/form.client.view.html',
                controller: 'SurveyFormController',
                controllerAs: 'vm',
                size: 'lg',
                resolve: {
                    surveyID: function() {
                        return survey._id;
                    },
                    projectId: function() {
                        return $stateParams.id;
                    }
                }
            });
        }

    }
}());
