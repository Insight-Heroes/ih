(function () {
  'use strict';

  angular
    .module('userAuth')
    .controller('ConfirmationEmailController', ConfirmationEmailController);

  ConfirmationEmailController.$inject = ['$scope', '$stateParams', '$http', '$location', 'Authentication', 'PasswordValidator', 'toastr', 'cfpLoadingBar', '$state'];

  function ConfirmationEmailController($scope, $stateParams, $http, $location, Authentication, PasswordValidator, toastr, cfpLoadingBar, $state) {
    var vm = this;

    vm.resendConfirmationEmail = resendConfirmationEmail;
    vm.authentication = Authentication;

    // If user is signed in then redirect back home
    if (vm.authentication.user) {
      $location.path('/');
    }

    if ($state.$current.name === 'confirmationEmail.reply') {
      vm.confirmationStatus = $stateParams.status;
      console.log('here');
    }

    // Submit resend confirmation email form
    function resendConfirmationEmail(isValid) {
      vm.success = vm.error = null;

      if (!isValid) {
        $scope.$broadcast('show-form-errors');

        return false;
      }

      $http.post('/api/auth/resend_confirmation_mail', vm.credentials).success(function (response) {
        // Show user success message and clear form
        vm.credentials = null;
        // toastr.success('Account confirmation email sent successfully');
        $location.path('/confirmation-email/confirmed');

      }).error(function (response) {
        // Show user error message
        vm.error = response.message;
      });
    }

  }
}());
