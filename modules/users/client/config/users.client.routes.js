(function () {
  'use strict';

  // Setting up route
  angular
    .module('userManagement')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('users', {
        abstract: true,
        url: '/users',
        template: '<ui-view/>'
      })
      .state('users.list', {
        url: '/list',
        templateUrl: 'modules/users/client/views/admin/list-users.client.view.html',
        controller: 'UserListController',
        controllerAs: 'vm',
        data: {
          requireUser: true,
          authorizedRoles: ['user', 'mainUser', 'hero']
        }

      })
      .state('users.create', {
        url: '/create',
        templateUrl: 'modules/users/client/views/admin/create-user.client.view.html',
        controller: 'UserListController',
        controllerAs: 'vm',
        data: {
          requireUser: true,
          authorizedRoles: ['user', 'mainUser', 'hero']
        }
    })
      .state('users.edit', {
        url: '/:id/edit',
        templateUrl: 'modules/users/client/views/admin/create-user.client.view.html',
        controller: 'UserListController',
        controllerAs: 'vm',
        data: {
          requireUser: true,
          authorizedRoles: ['user', 'mainUser', 'hero']
        }
    });

  }
}());
