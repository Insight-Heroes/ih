// Presents service used to communicate Presents REST endpoints
(function () {
  'use strict';

  angular
    .module('presentation')
    .factory('PresentsService', PresentsService);

  PresentsService.$inject = ['$resource'];

  function PresentsService($resource) {
    return $resource('api/presentation/:presentId', {
      presentId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
