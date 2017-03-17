// Payments service used to communicate Payments REST endpoints
(function () {
  'use strict';

  angular
    .module('payments')
    .factory('PaymentsService', PaymentsService);

  PaymentsService.$inject = ['$resource'];

  function PaymentsService($resource) {
    return $resource('api/payments/:paymentId', {
      paymentId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
