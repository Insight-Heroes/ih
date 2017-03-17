(function () {
  'use strict';

  // Presents controller
  angular
    .module('presentation')
    .controller('PresentsController', PresentsController)
    .directive('multipleEmails', multipleEmails);

  PresentsController.$inject = ['$state', '$http', '$scope', 'PresentsService', '$rootScope', '$stateParams', '$window', '$uibModalInstance', 'toastr', 'ErrorHandler'];

  function PresentsController ($state, $http, $scope, PresentsService, $rootScope, $stateParams, $window, $uibModalInstance, toastr, ErrorHandler) {
    var vm = this;
    vm.closeModal = closeModal;
    vm.sendPdfToUser = sendPdfToUser;


    // Remove existing Present
    function remove() {
      if ($window.confirm('Are you sure you want to delete?')) {
        vm.present.$remove($state.go('presents.list'));
      }
    }

    // Save Present
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.presentForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.present._id) {
        vm.present.$update(successCallback, errorCallback);
      } else {
        vm.present.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('presents.view', {
          presentId: res._id
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }

    }

    function closeModal() {
      $uibModalInstance.dismiss('cancel');
    }

    function sendPdfToUser (formValid) {
      var pdfSendToSelf = ($('.send-yourself').is(':checked'));
      if (!pdfSendToSelf && vm.email === undefined) {
        return toastr.error('please select any one of them first');
      }
      var email = {
        emailId: vm.email,
        pdfSendToSelf: pdfSendToSelf
      };
      $http.post('/api/presentation/pdf/' + $stateParams.id, email).success(function (response) {
        toastr.success('Email has been sent successfully');
        closeModal();
      }, function error(err) {
        ErrorHandler.error(err);
      });

    }

  }
}());

function multipleEmails() {
    var EMAIL_REGEXP = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*$/i;

    function validateAll(ctrl, validatorName, value) {
        var validity = ctrl.$isEmpty(value) || value.split(',').every(
            function (email) {
                return EMAIL_REGEXP.test(email.trim());
            }
        );

        ctrl.$setValidity(validatorName, validity);
        return validity ? value : undefined;
    }

    return {
        restrict: 'A',
        require: 'ngModel',
        link: function postLink(scope, elem, attrs, modelCtrl) {
            function multipleEmailsValidator(value) {
                return validateAll(modelCtrl, 'multipleEmails', value);
            }

            modelCtrl.$formatters.push(multipleEmailsValidator);
            modelCtrl.$parsers.push(multipleEmailsValidator);
        }
    };
}
