(function() {
    'use strict';

    angular
        .module('payments')
        .controller('TransactionHistoryController', Controller);

    Controller.$inject = ['PaymentsService', 'ErrorHandler', 'toastr', 'Authentication', '$window', '$http', '$filter'];

    function Controller(PaymentsService, ErrorHandler, toastr, Authentication, $window, $http, $filter) {
        var vm = this;
        fetchTransactionHistory();

        vm.renewalDate = renewalDate;
        vm.plans = $window.defaultPlanTypes;

        /**
         * Fetch transaction histores
         * @return {[type]} [description]
         */
        function fetchTransactionHistory() {
            $http.get('/api/payments/order-histories').
                success(function(response) {
                    vm.orderHistories = response.orderHistories;
                    console.log('vm.orderHistories', vm.orderHistories);
                })
                .error(function(err) {
                    ErrorHandler.error(err);
                });
        }

        /**
         * Calculate Renewal Date for plan
         */
        function renewalDate(oh) {

            if (oh.planType !== 'A' && oh.status === 'success') {
                return $filter('date')(moment(oh.billingPeriodEndDate).add(1, 'day').format(), 'dd-MMM-yyyy');
            } else {
                return 'N/A';
            }

        }

    }
}());
