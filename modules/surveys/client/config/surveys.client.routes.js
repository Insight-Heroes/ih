(function () {
    'use strict';

    angular
        .module('surveys')
        .config(routeConfig);

    routeConfig.$inject = ['$stateProvider'];

    function routeConfig($stateProvider) {
        $stateProvider
            .state('surveys', {
                abstract: true,
                url: '/surveys',
                template: '<ui-view/>'
            })
            .state('surveys.design', {
                url: '/:id/design',
                controllerAs: 'vm',
                controller: 'SurveyDesignController',
                templateUrl: 'modules/surveys/client/views/design-survey.client.view.html',
                data: {
                    requireUser: true,
                    authorizedRoles: ['user', 'mainUser', 'hero', 'warrior', 'client']
                },
                onEnter: function ($rootScope) {
                    $rootScope.surveyPage = true;
                },
                onExit: function ($rootScope) {
                    $rootScope.surveyPage = false;
                }
            })
            .state('surveys.distribute', {
                url: '/:id/distribute',
                controllerAs: 'vm',
                controller: 'SurveyDistributeController',
                templateUrl: 'modules/surveys/client/views/distribute.client.view.html',
                data: {
                    requireUser: true,
                    authorizedRoles: ['user', 'mainUser', 'hero', 'warrior', 'client']
                }
            })
            .state('surveys.distribute_to_user', {
                url: '/:id/distribute_to_user',
                controllerAs: 'vm',
                controller: 'SurveyDistributeController',
                templateUrl: 'modules/surveys/client/views/distribute_to_user.view.html',
                data: {
                    requireUser: true,
                    authorizedRoles: ['user', 'mainUser', 'hero', 'warrior', 'client']
                }
            });
    }

}());
