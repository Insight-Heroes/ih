(function () {
  'use strict';

  angular
    .module('user-responses')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('user-responses', {
        url: '/r/:id',
        controllerAs: 'vm',
        controller: 'UserResponsesController',
        templateUrl: 'modules/user-responses/client/views/form-user-response.client.view.html',
        data: {
        }
      });
  }

  getUserResponse.$inject = ['$stateParams', 'UserResponsesService'];

  function getUserResponse($stateParams, UserResponsesService) {
    return UserResponsesService.get({
      userResponseId: $stateParams.userResponseId
    }).$promise;
  }

  newUserResponse.$inject = ['UserResponsesService'];

  function newUserResponse(UserResponsesService) {
    return new UserResponsesService();
  }
}());
