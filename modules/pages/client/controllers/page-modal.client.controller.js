(function () {
    'use strict';

    angular
        .module('pages')
        .controller('PageModalController', PageModalController);

    PageModalController.$inject = ['Page', '$scope', 'toastr', '$state', 'ErrorHandler', '$uibModalInstance', 'page', 'surveyID', '$window', 'FileHelper', '$q', '$filter', 'Upload', '$http', 'positions'];
    function PageModalController(Page, $scope, toastr, $state, ErrorHandler, $uibModalInstance, page, surveyID, $window, FileHelper, $q, $filter, Upload, $http, positions) {
        var vm = this;
        // View function bindings
        vm.savePage = savePage;
        vm.closeModal = closeModal;
        vm.defaultPages = $window.pageTypes;

        /* Image related declarations */
        vm.mediaFiles = [];

        vm.deletedMediaFiles = [];
        vm.whitelistExtensions = {
            image: ['.png', '.jpg', '.jpeg', '.bmp']
        };
        vm.switches = {
          description: false
        };

        var maxFileSize = $window.maxFileSize;
        vm.removeImage = removeImage;
        vm.mediaFiles = [{ file: '' }];
        vm.validateFile = validateFile;
        vm.ajaxOn = false;

        /* Image related declarations End */

        if (!page._id) {
            vm.page = new Page({ survey: surveyID, slug: page.slug });
            if (positions.customPages.hasOwnProperty('current')) {
                vm.page.position = positions.customPages.current;
            } else {
                vm.page.position = positions.pages.current;
            }
            vm.page.inQuestions = positions.currentPage.inQuestions;
        } else {
            Page.get({ id: page._id }, function success(page) {
                vm.page = page;
                if (vm.page.description) {
                  vm.switches.description = true;
                }
                if (vm.page.mediaFiles[0]) {
                    vm.page.mediaFiles[0].thumbUrl = vm.page.mediaFiles[0].url;
                    vm.mediaFiles = vm.page.mediaFiles;
                }
            }, function error(err) {
                console.error('Page.get():', err);
                ErrorHandler.error(err);
            });
        }

        /**
         * Close Project create/edit popup
         */
        function closeModal() {
            $uibModalInstance.dismiss('cancel');
        }

        /**
         * Create/Save Page if page form satisfies client side validation
         * @param  {Boolean} formValid Boolean variable which holds true/flase value
         * True if form is valid else false
         */
        function savePage(formValid) {
            vm.ajaxOn = true;
            if (!formValid || !vm.ajaxOn) {
                $scope.$broadcast('show-form-errors');
                vm.ajaxOn = false;
                return false;
            }
            if (!vm.switches.description) {
              vm.page.description = null;
            }
            generatePageFilesData()
                .then(function(files) {
                    vm.page.mediaFiles = files;
                    vm.page.deletedMediaFiles = vm.deletedMediaFiles;
                    vm.page._id ? update() : create();
                });
        }

        /**
         * Call Page create API
         * and handle api response
         */
        function create() {
            vm.page.positions = positions;
            Page.save(vm.page, function(response) {
                pageSavedCallback(response);
                // toastr.success('Page created successfully');
            }, function(err) {
                vm.ajaxOn = false;
                ErrorHandler.error(err);
            });
        }

        /**
         * Call Project update API
         * and handle api response
         */
        function update() {
            vm.page.$update(function(response) {
                pageSavedCallback(response);
                // toastr.success('Page details saved successfully');
            }, function(err) {
                vm.ajaxOn = false;
                ErrorHandler.error(err);
            });
        }

        function pageSavedCallback(response) {
            // $uibModalInstance.dismiss('cancel');
            // $state.go('surveys.design', { id: surveyID }, { reload: true });
            if ($window.env === 'development') {
                successFlashMessage();
            } else {
                startS3Upload(response);
            }
        }

        function successFlashMessage() {
            toastr.success('Page details saved successfully');
            $uibModalInstance.dismiss('cancel');
            $state.go('surveys.design', { id: surveyID }, { reload: true });
        }

         /**
         * Start file uploading on Amazon S3
         * @param  {Object} response Server response
         */
        function startS3Upload(response) {
            var s3Data = response.s3Data;
            var promises = [];
            vm.mediaFiles.forEach(function(f, index) {
                if (f.file) {
                    var defer = $q.defer();
                    var fileS3Data = s3Data[f.file.name];
                    promises.push(FileHelper.uploadToS3(fileS3Data, f.file, defer, true));
                }
            });
            $q.all(promises).then(function(results) {
                var successUrls = [],
                    failureUrls = [];
                results.forEach(function(r) {
                    r.status ? successUrls.push(r.url) : failureUrls.push(r.url);
                });
                s3UploadServerCallback(successUrls, response);
            });
        }

        function s3UploadServerCallback(successUrls, response) {
            if (successUrls.length === 0) {
                successFlashMessage();
                return;
            }
            var pageID = response.page._id;
            $http.put('/api/pages/' + pageID + '/file_upload_callback', { successUrls: successUrls }).success(function (res) {
                successFlashMessage();
            }).error(function(response) {
                toastr.error(response);
            });

        }


        function generatePageFilesData() {
            var promises = [],
                files = [];
            vm.mediaFiles.forEach(function(img, index) {
                promises.push(FileHelper.getData(img.file).then(function(f) {
                    if (f || img.url) {
                        files.push({
                            position: index + 1,
                            file: f,
                            url: img.url,
                            name: img.name
                        });
                    }
                }));
            });
            return $q.all(promises).then(function() {
                return files;
            });
        }

        /**
         * Clear selected image
         * @param  {Object} img image file object
         */
        function clearImage(img) {
            if (img._id) {
                vm.deletedMediaFiles.push(_.clone(img));
            }
            img.name = img.file = img.thumbUrl = img.url = null;
        }
        function removeImage(index, img) {
            clearImage(img);
            vm.mediaFiles.splice(index, 1);
            vm.mediaFiles = [{ file: '' }];
        }
        /**
         * Return thumbnail image for file
         * @param  {String} url - URL of file
         * @return {String} url of image which will be used as thumbnail
         */
        function thumbnailImage(url) {
            var ext = '.' + _.last(url.split('.'));
            if (vm.whitelistExtensions.video.indexOf(ext) > -1) {
                return 'modules/core/client/img/thumbnails/video.png';
            } else if (vm.whitelistExtensions.audio.indexOf(ext) > -1) {
                return 'modules/core/client/img/thumbnails/audio.png';
            } else {
                return url;
            }
        }
        /**
         * Check if file uploaded by user is valid or not
         * @param  {FileObject} file        file object in case user chooses valid file
         * @param  {FileObject} invalidFile invalid file if user has chosen invalid file
         * @param  {Number} index       image file index in images array
         */
        function validateFile($file, $invalidFile, index, img) {

            if (!$file && !$invalidFile) {
                return;
            }

            if ($invalidFile && $invalidFile.$error === 'pattern') {
                img.thumbUrl = img.file = img.name = null;
                toastr.error('File type error: Only ' + vm.whitelistExtensions.image.join(', ') + ' files are allowed to upload');
                return;
            }

            /**
             * Check if File size if correct and file type is correct
             */
            var fileType = $file.type.split('/')[0],
                sizeLimit = maxFileSize[fileType];
            console.debug(fileType, maxFileSize[fileType]);
            if ($file.size > sizeLimit) {
                img.thumbUrl = img.file = img.name = null;
                toastr.error('File size error: Maximum file size allowed to upload is ' + $filter('formatBytes')(sizeLimit) + ' for ' + fileType + ' files');
                return;
            }

            if (vm.whitelistExtensions.image.indexOf('.' + _.last($file.name.split('.'))) > -1) {
                Upload.dataUrl($file, false)
                    .then(function (url) {
                        img.thumbUrl = url;
                        img.name = $file.name;
                    });
            } else {
                img.thumbUrl = thumbnailImage($file.name);
                img.name = $file.name;
            }
        }
    }
}());
