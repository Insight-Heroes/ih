(function () {
        'use strict';

        angular.module('surveys')
                .controller('SurveyDistributeController', SurveyDistributeController);

        SurveyDistributeController.$inject = ['Survey', '$scope', 'toastr', '$state', '$http', '$stateParams', 'ErrorHandler', '$window', '$mdDialog', 'SharedService'];
        function SurveyDistributeController(Survey, $scope, toastr, $state, $http, $stateParams, ErrorHandler, $window, $mdDialog, SharedService) {
            var vm = this;
            var relativeSurveyUrl = '';

            // View function bindings
            vm.socialShare = socialShare;
            vm.urlCopySuccess = urlCopySuccess;
            vm.urlCopyError = urlCopyError;
            vm.UserList = UserList;
            vm.createnewUserList = createnewUserList;
            vm.activeForm = 'List';
            vm.validateCreateNewListForm = validateCreateNewListForm;
            vm.submituserlist = submituserlist;
            vm.currentNavItem = 'distribute';
            vm.publishURL = publishURL;
            distributeToUser();
            vm.gethereUser = [];
            vm.userGatherer = [];
            distributeAndUserHistory();

            if ($state.$current.name === 'surveys.distribute_to_user') {
              vm.hidePreview = true;
              vm.publishText = 'Send';
            } else {
              vm.hidePublish = true;
              vm.publishText = 'Publish';
            }

            // Publish Survey
            vm.openPublishModal = function() {
              if ($state.$current.name === 'surveys.distribute_to_user') {
                vm.gethereUser = [];
                vm.userGatherer.forEach(function(Gatherer) {
                  if (!!Gatherer.selected) {
                    vm.gethereUser.push(Gatherer._id);
                  }
                });
                if (vm.publishbtn === false) {
                  toastr.error('Already published all users');
                  return false;
                }
                if (vm.gethereUser.length === 0) {
                  toastr.error('Please Select Users from the list');
                  return false;
                }
                $http.post('/api/surveys/' + $stateParams.id + '/publish_to_gatherers', vm.gethereUser).success(function (response) {
                  toastr.success('Survey has been published successfully to user');
                  $state.go('surveys.distribute', { id: $stateParams.id }, { reload: true });
                }, function error(err) {
                  ErrorHandler.error(err);
                });
              } else {
                SharedService.publishSurvey(vm.survey);
              }
            };
            // Fetch Survey
            Survey.get({ id: $stateParams.id }, function success(survey) {
                vm.survey = survey;
                relativeSurveyUrl = '/r/' + vm.survey.randomCode;
                hidePublish(vm.survey.questions.length);
            }, function error(err) {
                $state.go('dashboard');
                ErrorHandler.error(err);
            });

            function hidePublish(questions) {
                if (questions < 1 || vm.userGatherer.length === 0) {
                    vm.hidePublishButton = true;
                }
            }
            function UserList() {
                $state.go('surveys.distributeList');
            }

            function createnewUserList() {
                $state.go('surveys.createdistributeList');
            }

            function validateCreateNewListForm(formValid) {
                if (!formValid) {
                    $scope.$broadcast('show-form-errors');
                    return false;
                }
                $scope.$broadcast('reset-form-errors');
                vm.activeForm = 'uploadcsv';
            }

            function submituserlist() {
                $state.go('surveys.distributeListName');
            }

            /**
             * Share survey in FB/Twitter/LinkedIn
             * @param  {String} networkType - network type can be facebook, twitter, linkedin
             */
            function socialShare(networkType) {
                var url = $window.encodeURIComponent(publishURL()),
                    windowURL = null,
                    sourceURL = $window.location.href,
                    text = 'Participate in Survey - ' + vm.survey.name;
                if (networkType === 'facebook') {
                    windowURL = 'http://www.facebook.com/sharer.php?u=' + url + '&message=' + text + '&display=popup';
                } else if (networkType === 'twitter') {
                    windowURL = 'http://twitter.com/share?url=' + url + '&text=' + text;
                } else if (networkType === 'linkedIn') {
                    windowURL = 'https://www.linkedin.com/shareArticle?mini=true&url=' + url + '&title=' + url + '&summary=&source=';
                }
                var socialWindow = $window.open(windowURL, networkType, 'height=450,width=700');
                if ($window.focus) {
                    socialWindow.focus();
                }
            }

            /**
             * Success callback when Survey URL is copied to clipboard
             * @param  {Object} e - Clipboad object
             */
            function urlCopySuccess(obj, e) {

                // console.log('Success function called');

                toastr.success('The shareable link has been copied successfully');

                // $mdDialog.show(
                //   $mdDialog.alert()
                //     .clickOutsideToClose(true)
                //     .textContent('Copied')
                //     .ariaLabel('Text Copied')
                //     .ok('Okay')
                //     .targetEvent(e)
                // );

            }
            /**
             * Failure callback when Survey URL is can not be copied to clipboard
             * @param  {Object} e - Clipboad object
             */
            function urlCopyError(e) {
                // console.error(e);
                toastr.error('Could not copy URL');
            }

            function publishURL(iframe) {
                var url;
                if (vm.survey) {
                    url = $window.location.origin + relativeSurveyUrl;
                    if (iframe) {
                        return '<iframe src=\'' + url + '\'></iframe>';
                    }
                }
                return url;
            }

            function distributeToUser() {
              if ($state.$current.name === 'surveys.distribute_to_user') {
                $http.get('api/admin/gatherer').success(function (gatherer) {
                  vm.userGatherer = gatherer;
                  vm.publishbtn = false;
                  // console.log(vm.userGatherer);
                  vm.userGatherer.forEach(function(publish) {
                   if (publish.publishedSurveys.indexOf($stateParams.id) >= 0) {
                     publish.isDisabled = true;
                   } else {
                     vm.publishbtn = true;
                     publish.isDisabled = false;
                   }
                  });
                });
              }
            }

            function distributeAndUserHistory() {
              if ($state.$current.name === 'surveys.distribute') {
                $http.get('api/surveys/' + $stateParams.id + '/distribute-history').success(function (history) {
                  vm.usersHistroy = history.users;
                  vm.listsHistroy = history.lists;
                });
              }
            }

        }
}());
