(function () {
    'use strict';

    angular
        .module('questions')
        .controller('QuestionsController', QuestionsController);

    QuestionsController.$inject = ['Question', '$scope', 'toastr', '$state', '$stateParams', 'ErrorHandler', '$window', '$mdSidenav', 'Project', 'QuestionValidation', 'Upload', 'FileHelper', '$q', '$http', 'questionID', 'surveyID', 'questionSlug', '$uibModalInstance', '$filter', 'Survey', 'positions', '$sce', '$timeout'];
    function QuestionsController(Question, $scope, toastr, $state, $stateParams, ErrorHandler, $window, $mdSidenav, Project, QuestionValidation, Upload, FileHelper, $q, $http, questionID, surveyID, questionSlug, $uibModalInstance, $filter, Survey, positions, $sce, $timeout) {
        var vm = this;

        // View function bindings
        vm.saveQuestion = saveQuestion;
        vm.addChoice = addChoice;
        vm.removeChoice = removeChoice;
        vm.addRowCols = addRowCols;
        vm.removeRowCols = removeRowCols;
        vm.removeImage = removeImage;
        vm.addImage = addImage;
        vm.clearImage = clearImage;
        vm.validateFile = validateFile;
        vm.sliderIntervalChange = sliderIntervalChange;
        vm.updateSliderConfig = updateSliderConfig;
        vm.formDropdownOptions = formDropdownOptions;
        vm.addPair = addPair;
        vm.removePair = removePair;
        vm.randomOrder = randomOrder;
        vm.cancelEditing = cancelEditing;
        vm.setDatepickerOptions = setDatepickerOptions;
        vm.videos = videos();
        vm.links = links();
        vm.linkactive = true;
        vm.generatePreview = generatePreview;
        vm.previewVideo = '';
        vm.setMediaLink = setMediaLink;
        vm.currentNavItem = vm.currentNavItem;
        vm.currentNavItem = 'media';
        vm.questionTitleChange = questionTitleChange;
        vm.myDate = new Date();

        vm.whitelistExtensions = {
            // video: ['.mp4', '.avi', '.mkv', '.3gp'],
            video: ['.mp4', '.m4a', '.webm', '.ogg'],
            audio: ['.mp3', '.wav', '.3ga', '.m4a', '.aac', '.ogg', '.amr'],
            image: ['.png', '.jpg', '.jpeg', '.bmp']
        };
        vm.choiceCounts = [1, 1];
        vm.mediaFilePattern = _.flatten([
            vm.whitelistExtensions.image,
            vm.whitelistExtensions.video,
            vm.whitelistExtensions.audio
        ]);

        // View variables
        vm.params = {
            slug: questionSlug,
            surveyID: surveyID,
            questionID: questionID
        };
        vm.numberToChars = {
            0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F',
            6: 'G', 7: 'H', 8: 'I', 9: 'J', 10: 'K',
            11: 'L', 12: 'M', 13: 'N', 14: 'O', 15: 'P',
            16: 'Q', 17: 'R', 18: 'S', 19: 'T', 20: 'U',
            21: 'V', 22: 'W', 23: 'X', 24: 'Y', 25: 'Z'
        };

        vm.switches = {
            description: false,
            otherOptions: false,
            choices: true
        };
        vm.deletedMediaFiles = [];
        vm.mediaFiles = [];
        vm.ajaxOn = false;
        var maxFileSize = $window.maxFileSize;

        fetchSurvey();

        vm.canShowImageSection = canShowImageSection;
        /*
        * keyup Event fired more then 100 char not allowed
        * */
        function questionTitleChange() {
          var myDiv = $('.div-block');
          if (myDiv.text().length > 100) {
            myDiv.text(myDiv.text().substring(0, 100));
            toastr.error('can not allow more then 100 character');
          }
        }

        // --------------------------------------------------

        function generateFilesData() {
            var promises = [],
                files = [];
            vm.mediaFiles.forEach(function(img, index) {
                // console.log('Qye', img);
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
         * Create/Update Question
         * @param  {Boolean} formValid Boolean variable which holds true/flase value
         * True if form is valid else false
         */
        function saveQuestion(formValid, errors) {
            vm.ajaxOn = true;
            console.log('Is client side form valid? ', formValid);
            if (!formValid || !vm.ajaxOn) {
                $scope.$broadcast('show-form-errors');
                for (var key in errors) {
                    if (!errors.hasOwnProperty(key)) {
                        continue;
                    }
                    var ers = errors[key];
                }
                vm.ajaxOn = false;
                return false;
            }

            /* Validate Media files or video url for Media question type */
            vm.question.switchType = vm.switches.type;
            if (!QuestionValidation.isValid(vm.question, vm.mediaFiles)) {
                vm.ajaxOn = false;
                return false;
            }

            prepareQuestionForSaving();
            generateFilesData()
                .then(function(files) {
                    vm.question.mediaFiles = files;
                    vm.question.deletedMediaFiles = vm.deletedMediaFiles;
                    vm.question._id ? update() : create();
                });
        }

        /**
         * Call Question create API
         * and handle api response
         */
        function create() {
            vm.question.positions = positions;
            vm.question.position = positions.questions.current;
            var clonedQuestion = _.clone(vm.question);
            Question.save(vm.question, function(response) {
                questionSavedCB(response);
                toastr.success('Question details saved successfully');
                vm.question = clonedQuestion;
                vm.question._id = response.question._id;
            }, function(err) {
                vm.ajaxOn = false;
                ErrorHandler.error(err);
            });
        }

        /**
         * Call Question update API
         * and handle api response
         */
        function update() {
            var clonedQuestion = _.clone(vm.question);
            vm.question.$update(function(response) {
                vm.question = clonedQuestion;
                questionSavedCB(response);
                toastr.success('Question details Update successfully');
            }, function(err) {
                vm.ajaxOn = false;
                ErrorHandler.error(err);
            });
        }

        /**
         * Callback function which gets called when questoin is saved
         * @param  {Object} response server response for question
         */
        function questionSavedCB(response) {
            if ($window.env === 'development') {
                successFlashMessage();
            } else {
                startS3Upload(response);
            }
        }

        /**
         * Show success flash message after question has been saved
         */
        function successFlashMessage() {
            cancelEditing();
            $state.go('surveys.design', { id: vm.params.surveyID }, { reload: true,
                inherit: false,
                notify: true
            });
        }

        /**
         * Start file uploading on Amazon S3
         * @param  {Object} response Server response
         */
        function startS3Upload(response) {
            var s3Data = response.s3Data;
            // S3 data key, value
            // {
            //     file.jpg: {
            //         accessKey :'AKIAJXXRXYA67RIRVSLA'
            //         fileName: 'question-58077aa54b24724a7622a891-rye3IfbSJg.jpg'
            //         policy: 'eyJjb25kaXRpb2.....'
            //         region: 'eu-west-1'
            //         signature: 'zhBlCJiJFLjkL.....'
            //         uploadUrl: 'https://ih-staging.s3.amazonaws.com/'
            //         url: 'https://ih-staging.s3.amazonaws.com/question-58fd77-rye.jpg'
            //     }
            // }
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
            var questionID = response.question._id;
            $http.put('/api/questions/' + questionID + '/file_upload_callback', { successUrls: successUrls }).success(function (res) {
                successFlashMessage();
            }).error(function(response) {
                toastr.error(response);
            });

        }

        /**
         * Make necessary change in question object before sending it to server
         */
        function prepareQuestionForSaving() {
            if (!vm.switches.description) {
                vm.question.description = null;
            }
            switch (vm.question.questionType) {
                case 'multiChoice':
                    setPosition(vm.question.choices);
                break;

                case 'rankOrder':
                    setPosition(vm.question.choices);
                break;

                case 'slider':
                    setPosition(vm.question.choices);
                break;

                case 'matrix':
                    setPosition(vm.question.rows);
                    setPosition(vm.question.columns);
                break;

                case 'pairing':
                    setPosition(vm.question.leftChoices);
                    setPosition(vm.question.rightChoices);
                break;

                case 'media':
                    setMediaLink();
                break;

                default:
            }
        }

        /**
        * to clear images from the amazon s3 server Or clear video url for media question
        */
        function setMediaLink() {
            if (vm.switches.type === 'media') {
                vm.question.videoUrl = '';
            } else if (vm.switches.type === 'link') {
                if (vm.mediaFiles[0]._id) {
                    vm.deletedMediaFiles.push(_.clone(vm.mediaFiles[0]));
                }
                vm.mediaFiles = [{ file: '' }];
            }
        }

        /**
         * Set position attribute for each record in array
         * @param {Array} records Array of multiple choice question choices, matrix rows, matrix columns,
         * rank order options
         */
        function setPosition(records) {
            records.forEach(function(r, index) {
                r.position = index + 1;
            });
        }

        /**
         * Callback function when user changes slider interval value
         */
        function sliderIntervalChange() {
            if (vm.question.optionCount < vm.question.choices.length) {
                vm.question.choices.splice(vm.question.optionCount);
            } else if (vm.question.optionCount > vm.question.choices.length) {
                addEmptyTexts('choices', vm.question.optionCount - vm.question.choices.length);
            }
            updateSliderConfig();
        }

        /**
         * Set values for slider question
         */
        function updateSliderConfig() {
            if (vm.question.questionType !== 'slider') {
                return;
            }
            vm.sliderConfig = {
                options: {
                    showSelectionBar: true,
                    showTicksValues: true,
                    showTicks: false,
                    // selectionBarGradient: {
                    //   from: '#fe9b4f',
                    //   to: '#cb1c23'
                    // },
                    // getSelectionBarColor: function(val) {
                    //     var i = 0,
                    //         choiceCount = vm.question.choices.length;
                    //     vm.question.choices.forEach(function(c, index) {
                    //         if (c.text === val) {
                    //             i = index + 1;
                    //         }
                    //     });
                    //     if (i <= Math.floor(choiceCount * 0.3))
                    //         return 'red';
                    //     if (i <= Math.floor(choiceCount * 0.6))
                    //         return 'orange';
                    //     if (i <= Math.floor(choiceCount * 0.9))
                    //         return 'yellow';
                    //     return '#2AE02A';
                    // },
                    stepsArray: _.map(vm.question.choices, function(c) { return (c.text || ''); }),
                    disabled: !_.every(vm.question.choices, isChoiceEntered)
                }
            };
        }

        /**
         * Checks if choice is entered by user
         * @param  {Object}  c-Choice onject
         * @return {Boolean}   Returns true if choice is valid otherwise false
         */
        function isChoiceEntered(c) {
            return (c.text && c.text !== '');
        }

        /**
         * Generate dropdown options from comma separated values
         */
        function formDropdownOptions() {
            var options = _.filter(vm.question.dropdownOptions.split(','), function(o) {
                if (o && o !== '') {
                    return true;
                } else {
                    return false;
                }
            });
            vm.question.choices = [];
            options.forEach(function(o, index) {
                vm.question.choices.push({
                    text: _.trim(o),
                    position: index
                });
            });
            if (vm.question.choices.length) {
                vm.question.dropdown = vm.question.choices[0];
            }
        }

        /**
         * Check if images section can be shows
         * it is shown to descriptive question as of now
         * @return {Boolean} returns true if question is descriptive/multichoice otherwise false
         */
        function canShowImageSection() {
            if (!vm.question)
                return false;
            return _.includes(['descriptive'], vm.question.questionType);
        }

        /**
         * Assign default properties to existing question which we are showing in edit mode
         */
        function setEditQuestionDefaults() {
            if (vm.question.description) {
                vm.switches.description = true;
            }
            if (vm.question.mediaFiles.length) {
                vm.switches.images = true;
            }

            switch (vm.question.questionType) {
                case 'multiChoice':
                    if (!vm.question.mediaFiles || vm.question.mediaFiles.length === 0) {
                        vm.mediaFiles = [{
                            file: ''
                        }];
                    } else {
                        vm.question.mediaFiles[0].thumbUrl = vm.question.mediaFiles[0].url;
                        vm.mediaFiles = vm.question.mediaFiles;
                    }
                break;

                case 'slider':
                    vm.question.optionCount = vm.question.choices.length;
                    updateSliderConfig();
                break;

                case 'imageChoice':
                    vm.question.mediaFiles.forEach(function(i) {
                        i.thumbUrl = i.url;
                    });
                    vm.question.mediaFiles.push({ file: '' });
                    vm.mediaFiles = vm.question.mediaFiles;
                break;

                case 'media':
                    if (!vm.question.mediaFiles || vm.question.mediaFiles.length === 0) {
                        vm.mediaFiles = [{
                            file: ''
                        }];
                    } else {
                        vm.question.mediaFiles[0].thumbUrl = thumbnailImage(vm.question.mediaFiles[0].url);
                        vm.mediaFiles = vm.question.mediaFiles;
                    }
                    vm.switches.type = vm.question.mediaFiles.length ? 'media' : 'link';
                break;

                case 'dropdown':
                    vm.question.dropdown = vm.question.choices.first();
                    vm.question.dropdownOptions = _.map(vm.question.choices, 'text').join(', ');
                break;

                case 'pairing':
                    var totalCount = 2;
                    if (vm.question.leftChoices < vm.question.rightChoices) {
                        totalCount = vm.question.rightChoices.length;
                    } else {
                        totalCount = vm.question.leftChoices.length;
                    }
                    vm.choiceCounts = new Array(totalCount);
                break;

                default:
            }
        }

        /**
         * Assign default properties to new question object
         */
        function setNewQuestionDefaults() {
            vm.question.isCompulsary = false;
            switch (vm.question.questionType) {
                case 'multiChoice':
                    addEmptyTexts('choices', 4);
                    vm.question.radioButtons = false;
                    vm.mediaFiles = [{
                        file: ''
                    }];
                break;

                case 'imageChoice':
                    vm.mediaFiles = [{
                        file: ''
                    }];
                break;

                case 'media':
                    vm.mediaFiles = [{
                        file: ''
                    }];
                    vm.switches.type = 'media';
                break;

                case 'rankOrder':
                    addEmptyTexts('choices', 4);
                break;

                case 'matrix':
                    addEmptyTexts('rows', 2);
                    addEmptyTexts('columns', 2);
                    vm.radioButtons = false;
                break;

                case 'slider':
                    addEmptyTexts('choices', 5, true);
                    vm.question.optionCount = 5;
                    updateSliderConfig();
                break;

                case 'pairing':
                    addEmptyTexts('leftChoices', 2);
                    addEmptyTexts('rightChoices', 2);
                    vm.question.radioButtons = false;
                break;

                case 'timeAndDate':
                    vm.question.timeDate = {
                        type: 'TimeAndDate',
                        timeOptions: {
                          hourStep: 1,
                          minuteStep: 5,
                          amPm: false
                        },
                        dateOptions: {
                            pastDates: false,
                            futureDates: false
                        }
                    };
                break;

                default:
            }
        }

        /**
         * Add empty choices/rows/columns to array object
         * @param {String} key - key name of Array records. Can be choices for multiple choice question, choices, matrix rows, matrix columns, rank order question options
         * @param {Number} count - Number of options to be added in records
         */
        function addEmptyTexts(key, count, indexText) {
            if (!vm.question[key]) {
                vm.question[key] = [];
            }
            _.times(count, function(i) {
                vm.question[key].push({
                    text: (indexText ? (i + 1) : '')
                });
            });
        }

        /**
         * Assign default properties to questions
         */
        function setQuestionDefaults() {
            switch (vm.question.questionType) {
                case 'multiChoice':
                    vm.otherOptions = true;
                break;

                case 'imageChoice':
                    vm.otherOptions = true;
                break;

                case 'matrix':
                    vm.otherOptions = true;
                break;

                case 'timeAndDate':
                    setDatepickerOptions();
                break;

                default:
            }
        }

        // Fetch survey details from Server
        function fetchSurvey() {
            Survey.get({ id: vm.params.surveyID }, function success(survey) {
                vm.survey = survey;
                fetchQuestion();
            }, function error(err) {
                $state.go('dashboard');
                ErrorHandler.error(err);
            });
        }

        /**
         * Set question object
         * if vm.params.questionID is present, fetch question from server
         * else create question object
         * @param {[type]} questionID [description]
         */
        function fetchQuestion(questionID) {
            if (vm.params.questionID) {
                Question.get({ id: vm.params.questionID }, function success(question) {
                    vm.question = question;
                    vm.question.displayTitle = $window.questionTypes[question.questionType].title;
                    setEditQuestionDefaults();
                    setQuestionDefaults();
                    generatePreview();
                }, function error(err) {
                    $state.go('dashboard');
                    ErrorHandler.error(err);
                });
            } else {
                vm.question = new Question();
                vm.question.questionType = vm.params.slug;
                vm.question.survey = vm.params.surveyID;
                vm.question.displayTitle = $window.questionTypes[vm.question.questionType].title;
                setNewQuestionDefaults();
                setQuestionDefaults();
            }
        }

        /**
         * Add choice in choices for multichoice question
         */
        function addChoice(index) {
            vm.question.choices.splice(index + 1, 0, { text: '' });
            vm.question.optionCount = vm.question.choices.length;
            updateSliderConfig();
        }

        /**
         * Remove a choice from multichoice question
         */
        function removeChoice(index) {
            vm.question.choices.splice(index, 1);
            vm.question.optionCount = vm.question.choices.length;
            updateSliderConfig();
        }

        /**
         * Add Choice in left/right side choices
         * @param {Number} index    index where choice needs to be added
         * @param {String} position [description]
         */
        function addPair(index, position) {
            var key = position + 'Choices';
            vm.question[key].splice(index + 1, 0, { text: '' });
            if ((vm.choiceCounts.length < vm.question.leftChoices.length) || (vm.choiceCounts.length < vm.question.rightChoices.length)) {
                vm.choiceCounts.push(1);
            }
        }

        /**
         * Remove pair from left/right choices
         * @param  {Number} index position from where choice should be deleted
         * @param  {String} position left/right
         */
        function removePair(index, position) {
            var key = position + 'Choices';
            vm.question[key].splice(index, 1);
            vm.question.optionCount = vm.question[key].length;
        }

        /**
         * Add row/column to Matrix question
         */
        function addRowCols(index, rowCol) {
            vm.question[rowCol].splice(index + 1, 0, { text: '' });
        }

        /**
         * Remove row/column from Matrix question
         */
        function removeRowCols(index, rowCol) {
            vm.question[rowCol].splice(index, 1);
        }

        /**
         * Remove image
         */
        function removeImage(index, img) {
            clearImage(img);
            vm.mediaFiles.splice(index, 1);
        }

        /**
         * Add new image tag button
         */
        function addImage() {
            vm.mediaFiles.push({ file: null });
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
                if (vm.question.questionType === 'imageChoice' || vm.question.questionType === 'multiChoice') {
                    toastr.error('Only ' + vm.whitelistExtensions.image.join(', ') + ' files are allowed to upload');

                } else {
                    toastr.error('Only ' + vm.mediaFilePattern.join(', ') + ' files are allowed to upload');
                }
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

            if (vm.question.questionType === 'imageChoice') {
                addNewFileUpload();
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
         * Add new file upload eleent in UI
         * - Check if all file uploader contains file
         *   -- if yes add new file upload
         * - else
         *   -- dont add new file upload
         *
         */
        function addNewFileUpload() {
            vm.mediaFiles.push({ file: null });
        }

        /*
         * Randomise order
         */
        function randomOrder() {
            return 0.5 - Math.random();
        }

        function cancelEditing() {
            $uibModalInstance.dismiss('cancel');
        }

        /**
         * Datepicker options
         */
        function setDatepickerOptions() {
            var options = {};
            if (vm.question.timeDate) {
                if (vm.question.timeDate.dateOptions.pastDates) {
                    options = { maxDate: new Date() };
                } else if (vm.question.timeDate.dateOptions.futureDates) {
                    options = { minDate: new Date() };
                }
                vm.datepickerOptions = options;
            }
        }

        function videos() {
            vm.linkactive = true;
        }
        function links() {
            vm.linkactive = false;
        }

        function generatePreview() {
            var matches;
            var url = '';
            if (vm.question.videoUrl)
                url = vm.question.videoUrl;
            if (url.indexOf('https://www.youtube.com/watch') !== -1) {
                var re = new RegExp('(\\?|&)' + 'v' + '\\=([^&]*)(&|$)');
                matches = url.match(re);
                if (matches)
                    vm.previewVideo = 'https://www.youtube.com/embed/' + matches[2];
                else
                    vm.previewVideo = '';
            } else if (url.indexOf('https://youtu.be') !== -1) {
                matches = url.match(/youtu.be\/([^&]*)(&|$)/);
                if (matches)
                    vm.previewVideo = 'https://www.youtube.com/embed/' + matches[1];
                else
                    vm.previewVideo = '';
            } else if (url.indexOf('https://vimeo.com/') !== -1) {
                matches = url.match(/vimeo.com\/(\d+)/);
                if (matches)
                    vm.previewVideo = 'https://player.vimeo.com/video/' + matches[1];
                else
                    vm.previewVideo = '';
            } else {
                vm.previewVideo = '';
            }

            $scope.trustSrc = function(src) {
                return $sce.trustAsResourceUrl(src);
            };

            $scope.previewVideo = { src: vm.previewVideo };
        }
    }
}());
