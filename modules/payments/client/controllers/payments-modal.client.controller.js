(function () {
  'use strict';

  angular
    .module('payments')
    .controller('PaymentsModalController', PaymentsModalController);

  PaymentsModalController.$inject = ['$scope', '$http', '$state', 'PaymentsService', '$uibModalInstance', '$log', '$q', 'toastr', 'Authentication', 'plan', '$window', 'ErrorHandler', '$ocLazyLoad', '$timeout'];

  function PaymentsModalController($scope, $http, $state, PaymentsService, $uibModalInstance, $log, $q, toastr, Authentication, plan, $window, ErrorHandler, $ocLazyLoad, $timeout) {
    var vm = this;
    var brainTree;
    vm.authentication = Authentication;
    vm.userid = vm.authentication.user._id;
    vm.closeModal = closeModal;
    vm.checkExp = checkExp;
    vm.plans = $window.defaultPlanTypes;
    vm.ajaxOn = true;
    vm.amount = plan.amount;
    vm.planType = plan.planType;
    vm.noOfRespondants = plan.respondants;

    loadBraintreeJS();

    // if (token.data) {
    //     brainTree.setup(token.data, 'dropin', {
    //       container: 'payment-form'
    //     });
    // }

    function closeModal() {
        $uibModalInstance.dismiss('cancel');
    }

    function loadBraintreeJS() {
      $ocLazyLoad.load(
        'https://js.braintreegateway.com/v2/braintree.js'
      ).then(function() {
        brainTree = $window.braintree;
        generateToken();
      });
    }

    function generateToken() {
      $http.get('/api/payments').success(function (response) {
        setupDropInUI(response);
      });
    }

    function setupDropInUI(token) {
      brainTree.setup(token, 'dropin', {
        container: 'payment-form',
        onReady: function(obj) {
            $timeout(function() {
              vm.ajaxOn = false;
            }, 1500);
        }
      });
    }

    function normalizeYear(year) {
      // Century fix
      var YEARS_AHEAD = 20;
      if (year < 100) {
        var nowYear = new Date().getFullYear();
        year += Math.floor(nowYear / 100) * 100;
        if (year > nowYear + YEARS_AHEAD) {
          year -= 100;
        } else if (year <= nowYear - 100 + YEARS_AHEAD) {
          year += 100;
        }
      }
      return year;
    }

    function checkExp() {
      var match = $('#expirationDate').val().match(/^\s*(0?[1-9]|1[0-2])\/(\d\d|\d{4})\s*$/);
      if (!match) {
        // toastr.error("years is not valid");
        return;
      }
      var exp = new Date(normalizeYear(1 * match[2]), 1 * match[1] - 1, 1).valueOf();
      var now = new Date();
      var currMonth = new Date(now.getFullYear(), now.getMonth(), 1).valueOf();
      if (exp <= currMonth) {
        toastr.error('Year is not valid');
      }
    }

  }
}());
