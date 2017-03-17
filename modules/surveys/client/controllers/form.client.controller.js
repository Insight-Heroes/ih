(function () {
    'use strict';

    angular
        .module('surveys')
        .controller('SurveyFormController', SurveyFormController);

    SurveyFormController.$inject = ['Survey', '$scope', 'toastr', '$state', '$stateParams', 'ErrorHandler', 'surveyID', '$uibModalInstance', 'projectId'];
    function SurveyFormController(Survey, $scope, toastr, $state, $stateParams, ErrorHandler, surveyID, $uibModalInstance, projectId) {
        var vm = this;

        // View function bindings
        vm.saveSurvey = saveSurvey;

        vm.survey = Survey;

        vm.closeModal = closeModal;

        // vm.projectid = $stateParams.projectid;
        vm.projectId = projectId;

        vm.params = {
            surveyID: surveyID
        };
        // Set Project object
        if (!vm.params.surveyID) {
            vm.page = 'create';
            vm.survey = new Survey();
        } else {
            vm.page = 'edit';
             Survey.get({ id: vm.params.surveyID }, function success(survey) {
                 vm.survey = survey;
             }, function error(err) {
                 console.error('Survey.get():', err);
                 $state.go('dashboard');
                 ErrorHandler.error(err);
             });
        }

        /**
         * Create Survey if survey form satisfies client side validation
         * @param  {Boolean} formValid Boolean variable which holds true/flase value
         * True if form is valid else false
         */
        function saveSurvey(formValid) {
            if (!formValid) {
                $scope.$broadcast('show-form-errors');
                return false;
            }
            vm.survey._id ? update() : create();
        }

        function closeModal() {
            $uibModalInstance.dismiss('cancel');
        }

        vm.survey.project = vm.projectId;
        /**
         * Call Survey create API
         * and handle api response
         */
        function create() {
            Survey.save(vm.survey, function(response) {
                toastr.success('Survey created successfully');
                surveySavedCallback();
            }, function(err) {
                ErrorHandler.error(err);
            });
        }

        /**
         * Call Survey update API
         * and handle api response
         */
        function update() {
            vm.survey.$update(function(response) {
                toastr.success('Survey details saved successfully');
                surveySavedCallback();
            }, function(err) {
                ErrorHandler.error(err);
            });
        }

        function surveySavedCallback() {
            // $state.go('projects', {}, { reload: true });
            $state.go('projects.show', { id: vm.projectId }, { reload: true,
                inherit: false,
                notify: true
            });
            $uibModalInstance.dismiss('cancel');
        }
    }
}());
