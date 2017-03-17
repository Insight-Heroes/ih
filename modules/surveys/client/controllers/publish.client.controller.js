(function() {
    'use strict';

    angular
        .module('surveys')
        .controller('SurveyPublishController', SurveyPublishController);

    SurveyPublishController.$inject = ['ListsService', '$filter', '$http', '$scope', 'toastr', '$state', '$stateParams', 'ErrorHandler', 'Authentication', 'SharedService', '$uibModalInstance', 'surveyId', 'surveyToken'];

    function SurveyPublishController(List, $filter, $http, $scope, toastr, $state, $stateParams, ErrorHandler, Authentication, SharedService, $uibModalInstance, surveyId, surveyToken) {

        // Controller name
        var vm = this;
        vm.ListNameArray = [];

        // View variables
        vm.activeTab = 'lists-selection';
        vm.activeClick = activeClick;
        // View function mapping
        vm.closeModal = closeModal;
        vm.goToListSelection = goToListSelection;
        vm.changeofthecircle = changeofthecircle;
        vm.publishSurvey = publishSurvey;
        vm.respdtCnt = [];
        vm.validRespCount = validRespCount;
        // vm.changedTable = changedTable;
        // vm.changedTableOut = changedTableOut;
        vm.checks = checks;
        vm.activeLabel = true;

        vm.typesArr = [{ respondentType: 'email', 'count': 0, 'title': 'Email' },
        { respondentType: 'cati', 'count': 0, 'title': 'CATI' },
        { respondentType: 'webEmbedLinks', 'count': 0, 'title': 'WebEmbed/Link' },
        { respondentType: 'fod', 'count': 0, 'title': 'FOS' }];

        // Find the lists
        vm.lists = List.query();
        function closeModal() {
            $uibModalInstance.dismiss('cancel');
        }

      /**
       *
       * @param Checking for enable disable next button if any one them selected form the list or not
       * @returns {boolean}
       */
        function checks(list) {
            var rt = [];
          if (list.selected) {
            vm.activeLabel = false;
            return vm.activeLabel;
          }
          vm.lists.forEach(function (list) {
            if (list.selected) {
              rt.push(list);
            }
          });

          if (rt.length > 0) {
              vm.activeLabel = false;
          } else {
            vm.activeLabel = true;
          }
        }

        function activeClick() {
            vm.ListNameArray = [];
            vm.newlists = [];
            vm.lists.forEach(function(list) {
                if (!!list.selected) {
                    vm.ListNameArray.push(list.name);
                    vm.newlists.push(list._id);
                }
            });
            vm.activeTab = 'contacts-selection';

            var publishObj = {};
            publishObj.surveyId = surveyId;
            publishObj.lists = vm.newlists;

            $http.post('/api/lists/publish_survey', publishObj).success(function (res) {
                vm.respondantTypeCnt = [];
                for (var i = 0; i < vm.typesArr.length; i++) {
                    var results = $filter('filter')(res.respondentCounts, { respondentType: vm.typesArr[i].respondentType }, true);
                    if (results.length > 0) {
                        results[0].title = vm.typesArr[i].title;
                        vm.respondantTypeCnt.push(results[0]);
                    } else {
                        vm.respondantTypeCnt.push(vm.typesArr[i]);
                    }
                }
                vm.selectedListData = res.listsData;
            }).error(function(res) {
                toastr.error(res);
            });
        }


        function publishSurvey() {
            if (vm.ListNameArray.length === 0) {
                toastr.error('Please choose list!!');
                return false;
            }

            var processPublishObj = {};
            processPublishObj.surveyId = surveyId;
            processPublishObj.surveyToken = surveyToken;
            if (vm.randomSelection === true && vm.listSelection === false) {
                if (vm.selectedListData.length > 0) {
                    processPublishObj.processPublishArr = vm.selectedListData;
                    $http.put('/api/lists/publish_survey', processPublishObj).success(function (res) {
                        toastr.success('Thank You for Publishing the Survey!');
                        closeModal();
                    }).error(function(res) {
                        toastr.error(res);
                    });
                } else {
                    toastr.error('Respondants not available!');
                    return false;
                }
            } else if (vm.randomSelection === false && vm.listSelection === true) {
                processPublishObj.processPublishArr = [];
                for (var resptype in vm.respdtCnt) {
                    if (vm.respdtCnt.hasOwnProperty(resptype) && vm.respdtCnt[resptype] > 0) {
                        var j = 0;
                        for (var i = 0; i < vm.selectedListData.length; i++) {
                            if (vm.selectedListData[i].respondentType === resptype) {
                                if (j < vm.respdtCnt[resptype]) {
                                    // console.log(vm.selectedListData[i].email, j);
                                    processPublishObj.processPublishArr.push(vm.selectedListData[i]);
                                    j++;
                                }
                            }
                       }
                    }
                }
                if (processPublishObj.processPublishArr.length > 0) {
                    $http.put('/api/lists/publish_survey', processPublishObj).success(function (res) {
                        toastr.success('Thank You for Publishing the Survey!');
                        closeModal();
                    }).error(function(res) {
                        toastr.error(res);
                    });
                } else {
                toastr.error('Please choose count!');
                return false;
                }
            } else {
                toastr.error('Respondants not available!');
                return false;
            }
        }


        function validRespCount(typecont, respondantType) {
            var extCnt = Number(vm.respdtCnt[respondantType]);
            if (isNaN(extCnt)) {
                toastr.error('Please enter numeric value only!');
                vm.respdtCnt[respondantType] = '';
                return false;
            }
            if (extCnt > typecont && vm.listSelection === true) {
                toastr.error('Please enter below/equal available Respondants!');
                vm.respdtCnt[respondantType] = '';
                return false;
            }
        }

    /* Custom height set for table in project Assign Pop Up */
    function projectAssginHeight() {
      var outerdiv = $('.create-survey').height();
      var tablediv = outerdiv - 300;
      $('.set-max').css('max-height', tablediv);
    }
    setTimeout(function() {
       projectAssginHeight();
    }, 500);
     $(window).on('resize', function() {
            projectAssginHeight();
        });
     function changedTable() {
          $(window).on('resize', function() {
            $('.user-table-height').css('height', 'auto');
        });
      }
     function changedTableOut() {
         $(window).on('resize', function() {
                projectAssginHeight();
            });
     }

        // Move to first step of list selection
        function goToListSelection() {
            vm.activeTab = 'lists-selection';
        }

        function changeofthecircle() {
            $('input.example').not(this).prop('checked', false);
            $('#checkbox').prop('checked', true);
        }
    }

}());
