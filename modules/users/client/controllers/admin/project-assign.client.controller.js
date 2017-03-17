(function () {
  'use strict';

  angular
    .module('userManagement')
    .controller('ProjectAssignController', ProjectAssignController);

  ProjectAssignController.$inject = ['$scope', '$http', '$window', '$state', '$uibModalInstance', 'user', 'toastr', 'ErrorHandler', 'Project'];

  function ProjectAssignController($scope, $http, $window, $state, $uibModalInstance, user, toastr, ErrorHandler, Project) {

    // console.log('User', user);
    var vm = this;
    // vm.changedTable = changedTable;
    // vm.changedTableOut = changedTableOut;
    vm.assignProject = assignProject;
    if (user.permissions && user.permissions.allowedProjects) {
      vm.selectedProject = _.first(user.permissions.allowedProjects);
    } else {
      vm.selectedProject = null;
    }
    vm.closeModal = closeModal;

    /**
      Custom height set for table in project Assign Pop Up
      */

    function projectAssginHeight() {
      console.log('Here i am');
      var outerdiv = $('.create-survey').height();
      var tablediv = outerdiv - 300;
      $('.set-max').css('max-height', tablediv);
    }
    setTimeout(function() {
       projectAssginHeight();
    }, 500);

    $http.get('/api/lists/publish_survey').success(function (res) {
        vm.published = res;
    }).error(function(res) {
        toastr.error(res);
    });

    /**
     * Fetch current Users Projects from Server
     */
    Project.query(function(projects) {
        vm.projects = projects;
        vm.projects.forEach(function(project, key) {
            for (var i = 0; i < vm.published.length; i++) {
              if (vm.published[i].project === project._id) {
                vm.projects[key].publishedCnt = vm.published[i].publishedCnt;
                break;
              }
            }
        });
    });

    /**
     * Close model
     */
    function closeModal() {
      $uibModalInstance.dismiss('cancel');
    }
    /* Custom height set for table in project Assign Pop Up */
    // function projectAssginHeight() {
    //   var outerdiv = $('.create-survey').height();
    //   var tablediv = outerdiv - 200;
    //   $('.set-max').css('max-height', tablediv);
    //   $('.user-table-height').css('height', tablediv);
    // }
    // setTimeout(function() {
    //    projectAssginHeight();
    // }, 500);
    //  $(window).on('resize', function() {
    //         projectAssginHeight();
    //     });
     // function changedTable() {
     //   $('.user-table-height').css('height', 'auto');
     // }
     // function changedTableOut() {
     //  var outerdiv = $('.create-survey').height();
     //  var tablediv = outerdiv - 200;
     //  $('.set-max').css('max-height', tablediv);
     //  $('.user-table-height').css('height', tablediv);
     // }
    function assignProject(pr) {
      if (!vm.selectedProject) {
        toastr.error('Please select a project');
        return;
      }
      $http({
        method: 'PUT',
        data: { projectId: vm.selectedProject },
        url: '/api/admin/users/' + user._id + '/assign-project'
      }).then(function successCallback(response) {
        toastr.success('Project assigned successfully');
        closeModal();
        $state.go('users.list', {}, { reload: true });
      }, function errorCallback(err) {
        ErrorHandler.error(err);
      });
    }

  }

}());
