(function () {
  'use strict';

  angular
    .module('dashboard')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('dashboard', {
        url: '/dashboard',
        controllerAs: 'vm',
        controller: 'DashboardController',
        templateUrl: 'modules/dashboard/client/views/dashboard.client.view.html',
        data: {
          requireUser: true
        }
      });
  }

}());
