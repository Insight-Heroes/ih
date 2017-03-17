(function () {
    'use strict';

    angular
        .module('dashboard')
        .controller('DashboardController', DashboardController);

    DashboardController.$inject = ['$mdSidenav', 'Authentication', '$http', '$state', 'toastr', 'Survey', '$mdDialog', 'Project', '$uibModal', 'ErrorHandler', '$rootScope', '$window'];

    function DashboardController($mdSidenav, Authentication, $http, $state, toastr, Survey, $mdDialog, Project, $uibModal, ErrorHandler, $rootScope, $window) {
        var vm = this;
        vm.authentication = Authentication;
        vm.deleteProject = deleteProject;
        vm.goToEditAddProject = goToEditAddProject;
        vm.startSurvey = startSurvey;
        if (vm.authentication.user.roles === 'gatherer') {
          fetchPublishedSurveys();
        } else {
          /**
           * Fetch current Users Projects from Server
           */
          Project.query(function(projects) {
              vm.projects = projects;
          });
        }

        vm.active = false;


        /**
         * Logout User
         * Notify server about logout action and on success response
         * clear authentication object and redirect to home page
         */
        function logout() {
            Authentication.logout();
        }


        function goToEditAddProject(project) {
          if (project._id) {
            $state.go('projects.edit', { id: project._id }, { reload: true });
          } else {
            $state.go('projects.new', {}, { reload: true });
          }
        }

        function deleteProject(project, ev) {
            var confirm = $mdDialog.confirm()
                  .title('Delete Project?')
                  .textContent('Are you sure you want to delete the Project?')
                  .targetEvent(ev)
                  .ok('Yes')
                  .cancel('No');

            delete project.surveys;
            delete project.user;
            $mdDialog.show(confirm).then(function() {
              $http.delete('/api/projects/' + project._id).success(function (response) {
                toastr.success('Project deleted successfully');
                $state.go('dashboard', {}, { reload: true });
              }, function error(err) {
                ErrorHandler.error(err);
              });
            });
        }


        function fetchPublishedSurveys() {
            $http.get('api/admin/' + vm.authentication.user._id + '/users-surveys')
              .success(function (surveys) {
              vm.surveys = surveys;
              console.log(vm.surveys);
            });
        }

        function startSurvey(survey) {
          var url = $window.location.origin + '/r/' + survey.randomCode;
          $window.open(url, '_blank');
        }

    }
}());
