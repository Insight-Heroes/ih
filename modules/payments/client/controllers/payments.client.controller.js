(function () {
  'use strict';

  // Payments controller
  angular
    .module('payments')
    .controller('PaymentsController', PaymentsController);

  PaymentsController.$inject = ['$scope', '$filter', '$state', '$http', '$window', 'Authentication', 'paymentResolve', '$uibModal', '$ocLazyLoad', 'toastr', 'ErrorHandler', '$stateParams'];

  function PaymentsController ($scope, $filter, $state, $http, $window, Authentication, payment, $uibModal, $ocLazyLoad, toastr, ErrorHandler, $stateParams) {
    var vm = this;

    vm.plans = $window.defaultPlanTypes;
    vm.authentication = Authentication;
    vm.payment = payment;
    vm.error = null;
    vm.form = {};
    vm.addOnRespondent = null;
    vm.planType = 'Y';  // Y-yearly, M-monthly
    vm.hide = false;
    vm.calculateAmount = 0;
    vm.cancelSubscription = cancelSubscription;
    var clientToken;
    vm.successMessage = (window.location.search).slice(11);
    vm.errorMessage = (window.location.search).slice(8);

     // Get token from server
    vm.generateToken = function() {
      return $http.get('/api/payments').success(function (cToken) {
        clientToken = cToken;
        return clientToken;
      });
    };

    vm.openModal = function (type) {
      var amount;
      var amountYrly;
      var respondants;

      var planData = {
        planType: vm.planType
      };

      if (type === 'addon') {
        planData.respondants = vm.addOnRespondent;
        planData.amount = vm.addOnRespondent * 0.99;
        planData.amount = $filter('number')(planData.amount, 2);
        console.log(planData.amount);
        if (!planData.amount || planData.amount === 0) {
          toastr.error('Please enter the numbers of respondants!');
          return false;
        }
      }

      if (vm.authentication.user.plan.isSubscribed !== true || (vm.authentication.user.plan.isSubscribed === true && type === 'addon')) {
        var modal = $uibModal.open({
          templateUrl: 'modules/payments/client/views/checkout-modal.client.view.html',
          windowClass: 'app-modal-window',
          controller: 'PaymentsModalController as vm',
          size: 'sm',
          resolve: {
            // token: vm.generateToken(),
            plan: planData
          }
        });
      } else {
        if (type === 'year') {
          toastr.error('Sorry, you can not buy yearly plan, unless you complete your current plan');
          return false;
        } else if (type === 'month') {
          toastr.error('Sorry, you can not buy monthly plan, unless you complete your current plan');
          return false;
        }
      }
    };

    /* Stop subscription call */
    function cancelSubscription() {
        $http.get('api/payments/' + vm.authentication.user.plan.orderHistoryId + '/cancel-subscription')
          .success(function (response) {
            $window.location.href = '/payments';
            toastr.success('Stopped Subscription', response);
        }).error(function(err) {
            ErrorHandler.error(err);
        });
    }
  }
}());
