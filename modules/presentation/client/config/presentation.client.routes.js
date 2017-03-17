(function () {
  'use strict';

  angular
    .module('presentation')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('presentation', {
        abstract: true,
        url: '/presentation',
        template: '<ui-view/>'
      })
      .state('surveys.presentation', {
        url: '/:id/presentation',
        templateUrl: 'modules/presentation/client/views/list-presentation.client.view.html',
        controller: 'PresentationListController',
        controllerAs: 'vm',
        data: {
          requireUser: true,
          pageTitle: 'Presents List'
        }
      })
      .state('presentation.list', {
        url: '/list',
        templateUrl: 'modules/presentation/client/views/list-presentation.client.view.html',
        controller: 'PresentationListController',
        controllerAs: 'vm',
        data: {
          requireUser: true,
          pageTitle: 'Presents List'
        }
      })
      .state('presentation.create', {
        url: '/create',
        templateUrl: 'modules/presentation/client/views/form-presentation.client.view.html',
        controller: 'PresentsController',
        controllerAs: 'vm',
        resolve: {
          presentResolve: newPresent
        },
        data: {
          requireUser: true,
          roles: ['user', 'admin'],
          pageTitle: 'Presents Create'
        }
      })
      .state('presentation.edit', {
        url: '/:presentId/edit',
        templateUrl: 'modules/presentation/client/views/form-presentation.client.view.html',
        controller: 'PresentsController',
        controllerAs: 'vm',
        resolve: {
          presentResolve: getPresent
        },
        data: {
          requireUser: true,
          roles: ['user', 'admin'],
          pageTitle: 'Edit Present {{ presentResolve.name }}'
        }
      })
      .state('surveys.view', {
        url: '/:id/view',
        templateUrl: 'modules/presentation/client/views/view-presentation.client.view.html',
        controller: 'PresentationListController',
        controllerAs: 'vm',
        data: {
          requireUser: true,
          pageTitle: 'Present {{ presentResolve.name }}'
        }
      })
      .state('presentation.view', {
        url: '/:id/view',
        templateUrl: 'modules/presentation/client/views/view-presentation.client.view.html',
        controller: 'PresentationListController',
        controllerAs: 'vm',
        data: {
          requireUser: true,
          pageTitle: 'Present {{ presentResolve.name }}'
        }
      })
      .state('presentation.comment', {
        url: '/:id/:graphId/comment',
        templateUrl: 'modules/presentation/client/views/comments-presentation.client.view.html',
        controller: 'PresentationListController',
        controllerAs: 'vm',
        data: {
          requireUser: true,
          pageTitle: 'Presents List'
        }
      });
  }

  getPresent.$inject = ['$stateParams', 'PresentsService'];

  function getPresent($stateParams, PresentsService) {
    return PresentsService.get({
      presentId: $stateParams.presentId
    }).$promise;
  }

  newPresent.$inject = ['PresentsService'];

  function newPresent(PresentsService) {
    return new PresentsService();
  }
}());
