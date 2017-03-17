(function () {
  'use strict';

  angular
    .module('payments')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('payments', {
        url: '/payments',
        templateUrl: 'modules/payments/client/views/form-payment.client.view.html',
        controller: 'PaymentsController',
        controllerAs: 'vm',
        resolve: {
          paymentResolve: newPayment
        },
        data: {
          requireUser: true,
          authorizedRoles: ['user', 'mainUser'],
          pageTitle: 'Pricing'
        }
      })
      .state('payments.list', {
        url: '',
        templateUrl: 'modules/payments/client/views/list-payments.client.view.html',
        controller: 'PaymentsListController',
        controllerAs: 'vm',
        data: {
          requireUser: true,
          authorizedRoles: ['user', 'mainUser'],
          pageTitle: 'Payments List'
        }
      })
      .state('payments.transaction_history', {
        url: '/transaction_history',
        templateUrl: 'modules/payments/client/views/transaction-history.client.view.html',
        controller: 'TransactionHistoryController',
        controllerAs: 'vm',
        data: {
          requireUser: true,
          authorizedRoles: ['user', 'mainUser'],
          pageTitle: 'Transation History'
        }
      })
      .state('payments.success', {
        url: '/transaction/success?order_id',
        templateUrl: 'modules/payments/client/views/success-payment.client.view.html',
        controller: 'PaymentStatusController',
        controllerAs: 'vm',
        data: {
          requireUser: true,
          authorizedRoles: ['user', 'mainUser'],
          pageTitle: 'Success'
        }
      })
      .state('payments.failed', {
        url: '/transaction/failed?reason',
        templateUrl: 'modules/payments/client/views/failed-payment.client.view.html',
        controller: 'PaymentStatusController',
        controllerAs: 'vm',
        data: {
          requireUser: true,
          authorizedRoles: ['user', 'mainUser'],
          pageTitle: 'failed'
        }
      });
  }

  newPayment.$inject = ['PaymentsService'];

  function newPayment(PaymentsService) {
    return new PaymentsService();
  }
}());
