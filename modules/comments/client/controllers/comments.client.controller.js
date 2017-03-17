(function () {
  'use strict';

  // Comments controller
  angular
    .module('comments')
    .controller('CommentsController', CommentsController);

  CommentsController.$inject = ['$scope', '$state', '$window', 'Authentication', 'commentResolve'];

  function CommentsController ($scope, $state, $window, Authentication, comment) {
    var vm = this;

    vm.authentication = Authentication;
    vm.comment = comment;
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;

    // Remove existing Comment
    function remove() {
      if ($window.confirm('Are you sure you want to delete?')) {
        vm.comment.$remove($state.go('comments.list'));
      }
    }

    // Save Comment
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.commentForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.comment._id) {
        vm.comment.$update(successCallback, errorCallback);
      } else {
        vm.comment.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('comments.view', {
          commentId: res._id
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
}());
