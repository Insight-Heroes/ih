(function () {
    'use strict';

    angular
        .module('logicjumps')
        .config(routeConfig);

    routeConfig.$inject = ['$stateProvider'];

    function routeConfig($stateProvider) {
        $stateProvider
            .state('logicjumps', {
                abstract: true,
                url: '/logicjumps',
                template: '<ui-view/>'
            })
            .state('logicjumps.edit', {
                url: '/:logicjump/edit',
                controllerAs: 'vm',
                controller: 'LogicJumpController',
                templateUrl: 'modules/questions/client/views/form.client.view.html',
                data: {
                    requireUser: true,
                    authorizedRoles: ['user', 'mainUser', 'hero', 'warrior']
                }
            });
    }

}());
