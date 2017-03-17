(function () {
  'use strict';

  angular
    .module('userManagement')
    .controller('UserListController', UserListController);

  UserListController.$inject = ['$scope', '$http', '$state', '$filter', 'AdminService', 'toastr', '$stateParams', '$mdDialog', '$uibModal', '$window', 'ErrorHandler', 'Upload', 'Authentication'];

  function UserListController($scope, $http, $state, $filter, AdminService, toastr, $stateParams, $mdDialog, $uibModal, $window, ErrorHandler, Upload, Authentication) {

    var vm = this;

    vm.fileOptions = {
      maxFileSize: 2097152 // 2MB in bytes
    };

    vm.newUser = newUser;
    vm.activeForm = 'userDetails';
    vm.activeButton = 'createUser';
    vm.credentials = {};

    vm.email = '';
    vm.validateUserDetailsForm = validateUserDetailsForm;
    vm.createuser = createuser;
    vm.selectRole = selectRole;
    vm.imagePreview = imagePreview;
    userList();
    vm.deleteUserPopup = deleteUserPopup;
    vm.userTypes = $window.userTypes;
    vm.editUser = editUser;
    vm.updateUser = updateUser;
    vm.goBack = goBack;
    vm.openPopUp = openPopUp;
    vm.imagearray = [];
    vm.currentUser = Authentication.user;
    vm.image = false;

    vm.projectCanBeAssigned = function(u) {
      return (_.includes(['warrior', 'client'], u.roles));
    };

    if ($state.current.name === 'users.edit') {
      vm.imagearray.length = vm.imagearray.length + 1;
      edituserdata($stateParams);

    }

    function imagePreview($file, $invalidFile, modelKey) {
      /**
       * Check if File size if correct and file type is correct
       */
      if ($invalidFile && $invalidFile.$error === 'maxSize') {
        vm[modelKey] = undefined;
        toastr.error('File size error: Maximum file allowed to upload is 2MB');
        return;
      }

      if ($invalidFile && $invalidFile.$error === 'pattern') {
        vm[modelKey] = undefined;
        toastr.error('File type error: Only image file is allowed to upload');
        return;
      }

      Upload.dataUrl($file, false)
        .then(function (url) {
          vm[modelKey] = url;
        });
      }

    function newUser() {
      $state.go('users.create');
    }


    function openPopUp(user) {
      $uibModal.open({
        animation: true,
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        windowClass: 'app-modal-publish',
        templateUrl: 'modules/users/client/views/admin/project-popup.client.view.html',
        controller: 'ProjectAssignController',
        controllerAs: 'vm',
        size: 'lg',
        resolve: {
          user: function() {
            return user;
          }
        }
      });
    }

    function validateUserDetailsForm(formValid) {
      if (!formValid) {
        $scope.$broadcast('show-form-errors');
        return false;
      }
      $scope.$broadcast('reset-form-errors');
      vm.activeForm = 'userType';
    }

    function createuser(formValid) {
      if (!formValid) {
        $scope.$broadcast('show-form-errors');
        return false;
      }
      var params = {};
      angular.copy(vm.credentials, params);
      params.profileImage = vm.profileImage;
      Upload.upload({
        url: '/api/admin/users',
        method: 'POST',
        data: params
      }).then(function (resp) {
        createuserSuccessCb(resp);
      }, function (err) {
        ErrorHandler.error(err);
      });
      }

    function createuserSuccessCb() {
      toastr.success('User Account created successfully');
      $state.go('users.list');
    }

    function userList() {
      if ($state.current.name === 'users.list') {
        $http.get('/api/admin/users').success(function (users) {
          vm.user = users;
        });
      }
    }

    function selectRole(role) {
      vm.credentials.roles = role;
    }


    function deleteUserPopup(user) {
      console.log('user us' + user._id);
      if (user) {
        $uibModal.open({
          animation: true,
          ariaLabelledBy: 'modal-title',
          ariaDescribedBy: 'modal-body',
          windowClass: 'app-modal-window-delete',
          templateUrl: 'modules/users/client/views/admin/delete-confirm.view.html',
          controller: 'DeleteUserController',
          controllerAs: 'vm',
          size: 'lg',
          resolve: {
            user: function() {
              return user;
            }
          }
        });


      }

    }


    function editUser(user) {
       console.log(user);
      $state.go('users.edit', { id: user._id }, { reload: true });
    }

    function edituserdata($stateParams) {
      if ($state.current.name === 'users.edit') {
        $http.get('/api/admin/users/' + $stateParams.id).success(function (users) {
          vm.credentials = users;
          vm.activeButton = 'updateUser';
          vm.email = vm.credentials.email;
        });
      }
    }

    function updateUser(user) {

      var params = {};
      angular.copy(user, params);
      params.profileImage = vm.profileImage;
      Upload.upload({
        url: '/api/admin/users/' + params._id,
        method: 'PUT',
        data: params
      }).then(function (resp) {
        toastr.success('User details updated successfully');
        $state.go('users.list');
      }, function (err) {
        ErrorHandler.error(err);
      });
    }

    /** Go-Back
     *
     * @param $scope
     */
    function goBack() {
        if (vm.activeForm !== 'userDetails') {
            vm.activeForm = 'userDetails';
        }
    }

  }
}());
