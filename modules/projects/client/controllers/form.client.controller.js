(function () {
    'use strict';
    var DATE_FORMAT = 'yyyy-mm-dd';

    angular
        .module('projects')
        .controller('ProjectFormController', ProjectFormController);

    ProjectFormController.$inject = ['Project', '$scope', 'toastr', '$state', '$stateParams', 'ErrorHandler', 'Upload'];
    function ProjectFormController(Project, $scope, toastr, $state, $stateParams, ErrorHandler, Upload) {
        var vm = this;
        // View function bindings
        vm.saveProject = saveProject;
        vm.imagePreview = imagePreview;
        vm.dateFormat = DATE_FORMAT;
        vm.RespondentType = ['Customer', 'Employee', 'Supply Chain', 'Sales Channel', 'Vendor', 'Competitor', 'Other'];
        vm.frequency = ['One Time', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Six Monthly', 'Yearly'];
        vm.datCollection = ['Email', 'Web/Embed Links', 'CATI', 'FOS'];
       // vm.closeModal = closeModal;
        vm.params = {
            projectID: $stateParams.id
        };

        // Set Project object
        if (!vm.params.projectID) {
            vm.page = 'create';
            vm.project = new Project();
            setDatepicker();
            // vm.project = {
            //   name: 'Sample Title',
            //   client: 'Sample client',
            //   division: 'Sample division',
            //   round: 23,
            //   frequency: vm.frequency[1],
            //   description: 'Sample description',
            //   respondantType: vm.RespondentType[1],
            //   country: 'India',
            //   state: 'Maharashtra',
            //   sampleToBeCovered: 50,
            //   methodOfDataCollection: vm.datCollection[1],
            //   clientCoordinator: 'Sample client coordinator',
            //   email: 'kalpesh@promobitech.com',
            //   mobileNo: '9890098900',
            //   skypeID: 'sample.skype'
            // };
        } else {
             vm.page = 'edit';
             Project.get({ id: vm.params.projectID }, function success(project) {
                console.log('Project: ', project);
                setDatepicker(project);
             }, function error(err) {
                 console.error('Project.get():', err);
                 $state.go('dashboard');
                 ErrorHandler.error(err);
             });
        }

        function setDatepicker(project) {
            var minStartDate = project ? moment(project.startDate) : moment();
            $('.datepicker.start').datepicker({
                format: DATE_FORMAT,
                startDate: minStartDate.format(_.toUpper(DATE_FORMAT)),
                autoclose: true
            });
            $('.datepicker').datepicker({
                format: DATE_FORMAT,
                startDate: minStartDate.format(_.toUpper(DATE_FORMAT)),
                autoclose: true,
                clearBtn: true
            });
            if (project) {
                vm.project = project;
                $('.datepicker.start').datepicker('setDate', moment(project.startDate).format(_.toUpper(DATE_FORMAT)));
                if (project.estimatedEndDate) {
                    $('.datepicker.end').datepicker('setDate', moment(project.estimatedEndDate).format(_.toUpper(DATE_FORMAT)));
                }
            }
            $('.datepicker.start').datepicker().on('changeDate', startDateChangeCallback);
        }

        function startDateChangeCallback(obj) {
            $('.datepicker.end').datepicker('setStartDate', obj.date);
            if (obj.date > moment(vm.project.estimatedEndDate, DATE_FORMAT)) {
                toastr.error('Estimated end date is cleared, as it was smaller than start date');
                vm.project.estimatedEndDate = null;
            }
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

        /**
         * Close Project create/edit popup
         */
       // function closeModal() {
        //    $uibModalInstance.dismiss('cancel');
       // }

        /**
         * Create Project if project form satisfies client side validation
         * @param  {Boolean} formValid Boolean variable which holds true/flase value
         * True if form is valid else false
         */
        function saveProject(formValid) {
            console.log('inside save project client');
            if (!formValid) {
                $scope.$broadcast('show-form-errors');
                return false;
            }
            vm.project._id ? update() : create();
        }

        /**
         * Call Project create API
         * and handle api response
         */
        function create() {
          var params = {};
          angular.copy(vm.project, params);
          params.logo = vm.logo;
          Upload.upload({
            url: '/api/projects',
            method: 'POST',
            data: params
          }).then(function (resp) {
            projectSavedCallback();
            toastr.success('Project created successfully');
          }, function (err) {
            ErrorHandler.error(err);
          });

        }

        /**
         * Call Project update API
         * and handle api response
         */
        function update() {
          var params = {};
          delete vm.project.$promise;
          delete vm.project.$resolved;
          delete vm.project.surveys;
          delete vm.project.user;
          angular.copy(vm.project, params);
          params.logo = vm.logo;
          console.log('Project Update: ', params);
          Upload.upload({
            url: '/api/projects/' + params._id,
            method: 'PUT',
            data: params
          }).then(function (resp) {
            projectSavedCallback();
            toastr.success('Project details updated successfully');
          }, function (err) {
             ErrorHandler.error(err);
          });

        }

        function projectSavedCallback() {
            $state.go('dashboard', {}, { reload: true });
            // $uibModalInstance.dismiss('cancel');
        }

    }
}());
