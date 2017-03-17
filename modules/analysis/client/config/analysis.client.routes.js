(function () {
    'use strict';

    angular
        .module('analysis')
        .config(routeConfig);

    routeConfig.$inject = ['$stateProvider'];

    function routeConfig($stateProvider) {
        $stateProvider
            .state('surveys.analysis', {
                url: '/:id/analysis',
                controllerAs: 'vm',
                controller: 'AnalysisController',
                templateUrl: 'modules/analysis/client/views/analysis.client.view.html',
                data: {
                    requireUser: true,
                    authorizedRoles: ['user', 'mainUser', 'hero', 'warrior', 'client']
                }
            });

    }

    getQuestions.$inject = ['$stateParams', 'Analysis'];

    function getQuestions($stateParams, Analysis) {
        return Analysis.getQuestionList($stateParams.id).$promise;
    }

}());
