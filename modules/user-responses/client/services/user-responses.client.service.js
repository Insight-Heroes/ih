// User responses service used to communicate User responses REST endpoints
(function () {
  'use strict';

  angular
    .module('user-responses')
    .factory('UserResponses', UserResponsesService);

  UserResponsesService.$inject = ['$resource'];

  function UserResponsesService($resource) {
    return $resource('api/user-responses/:userResponseId', {
      userResponseId: '@_id'
    }, {
      update: {
        method: 'PUT'
      },
      deleteAnswer: {
        method: 'POST',
        params: { answer: '@_id', userResponse: '@_id' },
        url: '/api/user-responses/delete/'
      }
    });
  }
}());
