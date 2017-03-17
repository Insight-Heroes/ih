(function () {
    'use strict';

    angular
        .module('user-permissions')
        .config(routeConfig);

    routeConfig.$inject = ['$stateProvider'];

    function routeConfig($stateProvider) {
        $stateProvider
            .state('user-permissions', {
                abstract: true,
                url: '/user-permissions',
                template: '<ui-view/>'
            })
            .state('user-permissions.list', {
                url: '',
                templateUrl: 'modules/user-permissions/client/views/list-user-permissions.client.view.html',
                controller: 'UserPermissionsListController',
                controllerAs: 'vm',
                data: {
                    pageTitle: 'User permissions List'
                }
            })
            .state('user-permissions.create', {
                url: '/create',
                templateUrl: 'modules/user-permissions/client/views/form-user-permission.client.view.html',
                controller: 'UserPermissionsController',
                controllerAs: 'vm',
                data: {
                    roles: ['user', 'admin'],
                    pageTitle: 'User permissions Create'
                }
            })
            .state('user-permissions.edit', {
                url: '/:userPermissionId/edit',
                templateUrl: 'modules/user-permissions/client/views/form-user-permission.client.view.html',
                controller: 'UserPermissionsController',
                controllerAs: 'vm',
                resolve: {
                    permissionResolve: getUserPermission
                },
                data: {
                    roles: ['user', 'admin'],
                    pageTitle: 'Edit User permission {{ user-permissionResolve.name }}'
                }
            })
            .state('user-permissions.view', {
                url: '/:userPermissionId',
                templateUrl: 'modules/user-permissions/client/views/view-user-permission.client.view.html',
                controller: 'UserPermissionsController',
                controllerAs: 'vm',
                resolve: {
                    permissionResolve: getUserPermission
                },
                data: {
                    pageTitle: 'User permission {{ user-permissionResolve.name }}'
                }
            });
    }

    getUserPermission.$inject = ['$stateParams', 'UserPermissionsService'];

    function getUserPermission($stateParams, UserPermissionsService) {
        return UserPermissionsService.get({
            userPermissionId: $stateParams.userPermissionId
        }).$promise;
    }

    newUserPermission.$inject = ['UserPermissionsService'];

    function newUserPermission(UserPermissionsService) {
        return new UserPermissionsService();
    }
}());
