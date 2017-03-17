(function () {
  'use strict';

  // Payments controller
  angular
    .module('payments')
    .controller('PaymentStatusController', Controller);

  Controller.$inject = ['$scope', '$state', '$http', '$window', 'Authentication', 'toastr', 'ErrorHandler', '$stateParams'];

  function Controller ($scope, $state, $http, $window, Authentication, toastr, ErrorHandler, $stateParams) {
    var vm = this;

    vm.authentication = Authentication;
    vm.successMessage = (window.location.search).slice(11);
    vm.errorMessage = (window.location.search).slice(8);
    vm.plans = $window.defaultPlanTypes;

    if ($stateParams.order_id) {
      getSubscriptionDetails();
    } else if ($stateParams.reason) {
      vm.failureReason = $stateParams.reason;
    }

    /* Get subscription details */
    function getSubscriptionDetails() {
        $http.get('api/payments/' + $stateParams.order_id + '/details')
          .success(function (response) {
            vm.orderHistory = response.orderHistory;
        }).error(function(err) {
            ErrorHandler.error(err);
        });
    }
  }
}());
