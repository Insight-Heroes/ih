(function () {
  'use strict';

  // Setting up route
  angular
    .module('userAuth')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('authentication', {
        abstract: true,
        url: '/authentication',
        templateUrl: 'modules/users/client/views/authentication/authentication.client.view.html',
        controller: 'AuthenticationController',
        controllerAs: 'vm'
      })
      .state('authentication.signup', {
        url: '/signup',
        templateUrl: 'modules/users/client/views/authentication/signup.client.view.html',
        controller: 'AuthenticationController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Signup'
        }
      })
      .state('authentication.signin', {
        url: '/signin?err',
        templateUrl: 'modules/users/client/views/authentication/signin.client.view.html',
        controller: 'AuthenticationController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Signin'
        }
      })
      .state('password', {
        abstract: true,
        url: '/password',
        template: '<ui-view/>'
      })
      .state('password.forgot', {
        url: '/forgot',
        templateUrl: 'modules/users/client/views/password/forgot-password.client.view.html',
        controller: 'PasswordController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Password forgot'
        }
      })
      .state('password.reset', {
        abstract: true,
        url: '/reset',
        template: '<ui-view/>'
      })
      .state('password.reset.invalid', {
        url: '/invalid',
        templateUrl: 'modules/users/client/views/password/reset-password-invalid.client.view.html',
        data: {
          pageTitle: 'Password reset invalid'
        }
      })
      .state('password.reset.success', {
        url: '/success',
        templateUrl: 'modules/users/client/views/password/reset-password-success.client.view.html',
        data: {
          pageTitle: 'Password reset success'
        }
      })
      .state('password.reset.form', {
        url: '/:token',
        templateUrl: 'modules/users/client/views/password/reset-password.client.view.html',
        controller: 'PasswordController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Password reset form'
        }
      })
      .state('confirmationEmail', {
        abstract: true,
        url: '/confirmation-email',
        template: '<ui-view/>'
      })
      .state('confirmationEmail.resend', {
        url: '/resend',
        templateUrl: 'modules/users/client/views/confirmation-email/resend.client.view.html',
        controller: 'ConfirmationEmailController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Resend Confirmation Email'
        }
      })
      .state('confirmationEmail.confirmed', {
        url: '/confirmed',
        templateUrl: 'modules/users/client/views/confirmation-email/confirmation.client.view.html',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Email Confirmed'
        }
      })

      .state('confirmationEmail.reply', {
        templateUrl: 'modules/users/client/views/confirmation-email/status.client.view.html',
        url: '/reply/:status',
        controller: 'ConfirmationEmailController',
        controllerAs: 'vm'
      });
  }
}());
