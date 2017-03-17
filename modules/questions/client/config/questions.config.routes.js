(function () {
    'use strict';

    angular
        .module('questions')
        .config(routeConfig);

    routeConfig.$inject = ['$stateProvider'];

    function routeConfig($stateProvider) {
        $stateProvider
            .state('questions', {
                abstract: true,
                url: '/questions',
                template: '<ui-view/>'
            })
            .state('questions.edit', {
                url: '/:question/edit',
                controllerAs: 'vm',
                controller: 'QuestionsController',
                templateUrl: 'modules/questions/client/views/form.client.view.html',
                data: {
                    requireUser: true,
                    authorizedRoles: ['user', 'mainUser', 'hero', 'warrior']
                }
            });
    }

}());
