(function () {
    'use strict';

    angular
        .module('shared')
        .factory('SharedService', Service);

    Service.$inject = ['$injector', '$uibModal'];

    function Service($injector, $uibModal) {
        return {
            publishSurvey: openPublishSurveyModal
        };

        // Open modal to publish a survey
        function openPublishSurveyModal(survey) {
            $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                windowClass: 'app-modal-publish',
                templateUrl: 'modules/surveys/client/views/publish.client.view.html',
                controller: 'SurveyPublishController',
                controllerAs: 'vm',
                size: 'lg',
                resolve: {
                    surveyId: function() {
                        return survey._id;
                    },
                    surveyToken: function() {
                        return survey.randomCode;
                    }
                }
            });
        }

    }
}());
