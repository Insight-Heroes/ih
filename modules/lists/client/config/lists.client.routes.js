(function () {
    'use strict';

    angular
        .module('lists')
        .config(routeConfig);

    routeConfig.$inject = ['$stateProvider'];

    function routeConfig($stateProvider) {
        $stateProvider
            .state('lists', {
                abstract: true,
                url: '/survey-:surveyId/lists',
                template: '<ui-view/>'
            })
            .state('lists.list', {
                url: '',
                templateUrl: 'modules/lists/client/views/list-lists.client.view.html',
                controller: 'ListsListController',
                controllerAs: 'vm',
                data: {
                    requireUser: true,
                    pageTitle: 'Lists List',
                    authorizedRoles: ['user', 'mainUser', 'hero', 'warrior']
                }
            })
            .state('lists.create', {
                url: '/create',
                templateUrl: 'modules/lists/client/views/form-list.client.view.html',
                controller: 'ListsController',
                controllerAs: 'vm',
                resolve: {
                    listResolve: newList
                },
                data: {
                    requireUser: true,
                    pageTitle: 'Lists Create',
                    authorizedRoles: ['user', 'mainUser', 'hero', 'warrior']
                }
            })
            .state('lists.edit', {
                url: '/:listId/edit',
                templateUrl: 'modules/lists/client/views/form-list.client.view.html',
                controller: 'ListsController',
                controllerAs: 'vm',
                resolve: {
                    listResolve: getList
                },
                data: {
                    requireUser: true,
                    pageTitle: 'Edit List {{ listResolve.name }}',
                    authorizedRoles: ['user', 'mainUser', 'hero', 'warrior']
                }
            })
            .state('lists.addContacts', {
                url: '/:listId/add_contacts',
                templateUrl: 'modules/lists/client/views/add-contacts.client.view.html',
                controller: 'ListContactsController',
                controllerAs: 'vm',
                resolve: {
                    listResolve: getList
                },
                data: {
                    requireUser: true,
                    pageTitle: 'List {{ listResolve.name }}',
                    authorizedRoles: ['user', 'mainUser', 'hero', 'warrior']
                }
            });
    }

    getList.$inject = ['$stateParams', 'ListsService'];

    function getList($stateParams, ListsService) {
        return ListsService.get({
            listId: $stateParams.listId
        }).$promise;
    }

    newList.$inject = ['ListsService'];

    function newList(ListsService) {
        return new ListsService();
    }

}());
