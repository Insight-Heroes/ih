(function () {
    'use strict';

    angular
        .module('projects')
        .config(routeConfig);

    routeConfig.$inject = ['$stateProvider'];

    function routeConfig($stateProvider) {
        $stateProvider
            .state('projects', {
                abstract: true,
                url: '/projects',
                template: '<ui-view/>'
            })
            .state('projects.new', {
                url: '/new',
                controllerAs: 'vm',
                controller: 'ProjectFormController',
                templateUrl: 'modules/projects/client/views/form.client.view.html',
                data: {
                    requireUser: true,
                    authorizedRoles: ['user', 'mainUser', 'hero', 'warrior', 'client']
                }
            })
            .state('projects.edit', {
                url: '/:id/edit',
                controllerAs: 'vm',
                controller: 'ProjectFormController',
                templateUrl: 'modules/projects/client/views/form.client.view.html',
                data: {
                    requireUser: true,
                    authorizedRoles: ['user', 'mainUser', 'hero', 'warrior', 'client']
                }
            })
            .state('projects.show', {
                url: '/:id',
                controllerAs: 'vm',
                controller: 'ProjectDetailsController',
                templateUrl: 'modules/projects/client/views/show.client.view.html',
                data: {
                    requireUser: true,
                    authorizedRoles: ['user', 'mainUser', 'hero', 'warrior', 'client']
                }
            });
    }

}());
