(function () {
  'use strict';

  angular
    .module('userManagement')
    .controller('DeleteUserController', DeleteUserController);

  DeleteUserController.$inject = ['$scope', '$http', '$state', '$window', 'Authentication', '$uibModalInstance', 'user', 'toastr', 'ErrorHandler'];

  function DeleteUserController($scope, $http, $state, $window, Authentication, $uibModalInstance, user, toastr, ErrorHandler) {
    var vm = this;
    vm.deleteUser = deleteUser;

    vm.closeModal = closeModal;

    /**
     * Close model
     */
    function closeModal() {
      $uibModalInstance.dismiss('cancel');
    }

    function deleteUser() {
      $http.delete('/api/admin/users/' + user._id).success(function (response) {
        toastr.success('User deleted successfully');
        closeModal();
        $state.go('users.list', {}, { reload: true });
      }, function error(err) {
        ErrorHandler.error(err);
      });
    }

  }

}());
