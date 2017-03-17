(function () {
  'use strict';

  // User responses controller
  angular
    .module('user-responses')
    .controller('UserResponsesController', UserResponsesController)
    .factory('LS', function($window, $rootScope) {
      angular.element($window).on('storage', function(event) {
        if (event.key === 'my-storage') {
          $rootScope.$apply();
        }
      });
      return {
        setData: function(val) {
          $window.localStorage && $window.localStorage.setItem('my-storage', val);
          return this;
        },
        getData: function() {
          return $window.localStorage && $window.localStorage.getItem('my-storage');
        },
        remData: function() {
          return $window.localStorage && $window.localStorage.removeItem('my-storage');
        }
      };
    });

  UserResponsesController.$inject = ['$scope', '$http', '$state', '$stateParams', '$window', 'Authentication', 'UserResponses', 'Question', 'ErrorHandler', 'Survey', '$sce', 'toastr', '$filter', 'Upload', 'LS', '$q', 'FileHelper', '$rootScope', '$mdDialog'];

  function UserResponsesController ($scope, $http, $state, $stateParams, $window, Authentication, UserResponses, Question, ErrorHandler, Survey, $sce, toastr, $filter, Upload, LS, $q, FileHelper, $rootScope, $mdDialog) {

      $rootScope.navHeader = false;
      var vm = this;
      vm.error = null;
      vm.form = {};
      vm.startSurvey = false;
      vm.endSurvey = false;
      vm.startQuesSurvey = startQuesSurvey;
      vm.slideQuestions = slideQuestions;
      vm.showQuesOne = {};
      vm.allQuestions = [];
      vm.showkey = 0;
      vm.dynamic = 0;
      vm.generatePreview = generatePreview;
      var maxFileSize = $window.maxFileSize;
      vm.validateFile = validateFile;
      vm.toggleFileSelect = toggleFileSelect;
      vm.toggleVideoSelect = toggleVideoSelect;
      vm.toggleChoiceSelect = toggleChoiceSelect;
      vm.toggleVid = false;
      vm.mediaFiles = [[]];
      vm.userResponse = {};
      vm.userResponse.mediaFiles = [];
      vm.userResponse.choices = [];
      vm.fetchResponse = fetchResponse;
      vm.toggleMatrix = toggleMatrix;
      vm.userResponse.matrix = [];
      // vm.matrix = [[]];
      vm.updateSliderConfig = updateSliderConfig;
      vm.sliderIntervalChange = sliderIntervalChange;
      vm.userResponse.pairing = [];
      vm.surveyId = '';
      vm.allResponseData = '';
      vm.allQuesAnswers = [];
      vm.selectionQuestionLeftSide = selectionQuestionLeftSide;
      vm.selectionQuestionRightSide = selectionQuestionRightSide;
      vm.storeLeftAnswerId = [];
      vm.storeRightAnswerId = [];
      vm.quesAnswersNew = [];
      vm.reload = reload;
      vm.closewindow = false;
      vm.closeWindowPopup = closeWindowPopup;
      vm.videoAudioPreview = videoAudioPreview;
      vm.setDisplayHeight = setDisplayHeight;
      vm.width = 0;
      vm.createDateInstance = createDateInstance;
      vm.pairSelStorage = pairSelStorage;
      vm.subscriptionExpired = false;

      vm.getArrayCount = function(leftChoices, rightChoices) {
          if (leftChoices.length > rightChoices.length) {
              return new Array(leftChoices.length);
          } else {
              return new Array(rightChoices.length);
          }
      };
      document.addEventListener('keydown', function(e) {
        if (e.keyCode === 9) {
          e.preventDefault();
        }
      });
      vm.numberToChars = {
          0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F',
          6: 'G', 7: 'H', 8: 'I', 9: 'J', 10: 'K',
          11: 'L', 12: 'M', 13: 'N', 14: 'O', 15: 'P',
          16: 'Q', 17: 'R', 18: 'S', 19: 'T', 20: 'U',
          21: 'V', 22: 'W', 23: 'X', 24: 'Y', 25: 'Z'
      };

      vm.whitelistExtensions = {
          image: ['.png', '.jpg', '.jpeg', '.bmp']
      };

      vm.mediaFilePattern = _.flatten([
          vm.whitelistExtensions.image
      ]);

      // Fetch all the questions related to survey
      startQuesSurvey();

      // Begin survey and load all the questions of url's survey
      function startQuesSurvey() {

          if ($window.location.href.indexOf('preview=true') > -1) {
            LS.remData();
          }
          var vmNew = this;

          vmNew = JSON.parse(LS.getData());

          if (vmNew) {
            if ($stateParams.id !== vmNew.randomCode) {
              LS.remData();
              vmNew = false;
            }
          }

          if (vmNew) {
              for (var key in vmNew) {
                if (vmNew.hasOwnProperty(key)) {
                  vm[key] = vmNew[key];
                }
              }
              setDisplayHeight('N');
          } else {
              UserResponses.get({ id: $stateParams.id }, function success(response) {

                vm.allResponseData = response;
                vm.pages = vm.allResponseData.survey.pages;
                vm.project = vm.allResponseData.survey.project;
                vm.surveyName = vm.allResponseData.survey.name;
                vm.randomCode = $stateParams.id;
                var surveyOwner = vm.allResponseData.survey.user;
                var balanceResponses = (surveyOwner.totalNoOfRespondants - surveyOwner.receivedUserResponses);
                // balanceResponses = 0; // for Testing uncomment
                var dateExpired = false;
                if (vm.allResponseData.ownerOrder.billingPeriodEndDate) {
                  var endDate = Date.parse(vm.allResponseData.ownerOrder.billingPeriodEndDate);
                  // console.log('currDate--> ', Date.now(), 'EndDate-->', endDate);
                  if (Date.now() > endDate) {
                      dateExpired = true;
                  }
                }
                // console.log(balanceResponses, dateExpired);
                if (balanceResponses <= 0 || dateExpired === true) {
                    vm.subscriptionExpired = true;
                    return false;
                }

                /*
                *   bellow code for sorting of pages and add it to common array.
                */
                if (vm.pages.length > 0) {
                  vm.pages.filter(function(n) {
                      if (n.slug === 'welcome') {
                        n.questionType = 'pages';
                        n.position = -9999;
                        vm.allResponseData.questions.push(n);
                      }
                      if (n.slug === 'thankYou') {
                        n.questionType = 'pages';
                        n.position = 9999;
                        vm.allResponseData.questions.push(n);
                      }
                      if (n.inQuestions === false && n.slug === 'customPage') {
                        n.questionType = 'pages';
                        n.position = -n.position;
                        vm.allResponseData.questions.push(n);
                      }
                      if (n.inQuestions === true && n.slug === 'customPage') {
                        n.questionType = 'pages';
                        vm.allResponseData.questions.push(n);
                      }
                      return true;
                  });
                }

                var iswelcome = vm.pages.filter(function(n) { return (n.slug === 'welcome'); });
                if (iswelcome.length === 0) {
                  var w = {};
                  w.slug = 'welcome';
                  w.questionType = 'pages';
                  w.position = -9999;
                  vm.allResponseData.questions.push(w);
                }

                var isThankyou = vm.pages.filter(function(n) { return (n.slug === 'thankYou'); });
                if (isThankyou.length === 0) {
                    var t = {};
                    t.slug = 'thankYou';
                    t.questionType = 'pages';
                    t.position = 9999;
                    vm.allResponseData.questions.push(t);
                }


                vm.surveyId = vm.allResponseData.survey._id;
                var allqueses = $filter('orderBy')(vm.allResponseData.questions, 'position');
                allqueses.forEach(function(data, key) {
                  vm.allQuestions.push(data);
                  makeAnswerDraggable();
                });

                // console.log('allQuestions--> ', vm.allQuestions);
                if (vm.allQuestions.length > 0) {
                  vm.exceptWelThank = vm.allQuestions.filter(function(n) { return (n.slug !== 'welcome'); });
                  vm.max = vm.exceptWelThank.length - 1;
                  vm.allQuestions.forEach(function (question) {
                    if (question.randomizeOrder) {
                      var m = question.choices.length,
                        t,
                        i;
                      // While there remain elements to shuffle
                      while (m) {
                        // Pick a remaining element…
                        i = Math.floor(Math.random() * m--);
                        // And swap it with the current element.
                        t = question.choices[m];
                        question.choices[m] = question.choices[i];
                        question.choices[i] = t;
                      }
                      return question.choices;
                    } else if (question.randomizeRight && question.randomizeLeft) {
                        rightRandomizeOrder(question);
                        leftRandomizeOrder(question);
                    } else if (question.randomizeRight || question.randomizeLeft) {
                      if (question.randomizeRight) {
                        rightRandomizeOrder(question);
                      } else {
                        leftRandomizeOrder(question);
                      }
                    }

                  });
                }

                if (vm.pages.length === 0) {
                    vm.startSurvey = true;
                    fetchResponse(0);
                }

              }, function error(err) {
                  ErrorHandler.error(err);
              });

              if ($window.location.href.indexOf('preview=true') >= 0) {
                 vm.closewindow = true;
              }

              setTopWrapper();

          }

      }

      function setTopWrapper() {
        setTimeout(function() {
            $('.question-top-wrapper').height($(window).height() - 112);
        }, 1000);
      }

      function fetchResponse(len) {
          if (vm.allQuestions.length === 0) {
            toastr.error('There are no questions available!!');
            return false;
          }

          if (vm.allQuestions[len].questionType === 'slider') {
            vm.allQuestions[len].optionCount = vm.allQuestions[len].choices.length;
            updateSliderConfig();
          }


          if (vm.allQuestions[len].responsesData) {
              if (vm.allQuestions[len].questionType === 'multiChoice') {
                vm.userResponse.choices = [];
                for (var i = 0; i < vm.allQuestions[len].toggle.length; i++) {
                  if (vm.allQuestions[len].toggle[i] === true) {
                    vm.userResponse.choices[i] = vm.allQuestions[len].choices[i];
                  } else {
                    vm.userResponse.choices[i] = {};
                  }
                }
              } else if (vm.allQuestions[len].questionType === 'imageChoice') {
                vm.userResponse.mediaFiles = [];
                for (var m = 0; m < vm.allQuestions[len].toggleImg.length; m++) {
                  if (vm.allQuestions[len].toggleImg[m] === true) {
                    vm.userResponse.mediaFiles[m] = vm.allQuestions[len].mediaFiles[m];
                  } else {
                    vm.userResponse.mediaFiles[m] = {};
                  }
                }
              } else {
                vm.userResponse = vm.allQuestions[len].responsesData;
              }
              if (vm.allQuestions[len].questionType === 'slider') {
                  vm.sliderConfig.value = vm.allQuestions[len].responsesData.sliderCfgVal;
              }
          } else {
              vm.userResponse.mediaFiles = [];
              vm.userResponse.choices = [];
              vm.userResponse.matrix = [];
              vm.userResponse.pairing = [];
              vm.allQuestions[vm.showkey].toggle = [];
              vm.allQuestions[vm.showkey].toggleImg = [];
              vm.mediaFiles[vm.showkey] = [];
              vm.mediaFiles[vm.showkey].push({ file: null });
              vm.allQuestions[vm.showkey].matrix = [[]];
          }
          // console.log('-----media---->', vm.allQuestions[len]);
          if (vm.allQuestions[len].questionType === 'media' && vm.allQuestions[len].mediaFiles.length > 0) {
              videoAudioPreview(vm.allQuestions[len].mediaFiles[0].url, len);
          }

          newSurveyCount(len);
          newSurveyPrevious(len);
      }


      function updateToWindowObj() {
        if ($window.location.href.indexOf('preview=true') < 0) {
            LS.setData(JSON.stringify(vm));
        }
      }

      function newSurveyCount(v) {
          vm.nextKey = v;
          vm.nextKey = v + 1;
      }

      function newSurveyPrevious(v) {
          vm.previousKey = v;
          vm.previousKey = v - 1;
      }

      // slide question Previous/Next in survey
      function slideQuestions(type, quesType) {

        vm.userResponse.questionId = vm.allQuestions[vm.showkey]._id;
        vm.userResponse.questionType = vm.allQuestions[vm.showkey].questionType;
        vm.userResponse.surveyId = vm.allQuestions[vm.showkey].survey;

        if (quesType === 'multiChoice') {
          if (!saveMultichoice()) {
          toastr.error('You can not skip this question, please record your answer.');
          return false;
          }
        }
        if (quesType === 'imageChoice') {
          if (!saveImageChoice()) {
          toastr.error('You can not skip this question, please record your answer.');
          return false;
          }
        }
        if (quesType === 'descriptiveText') {
          if (!saveDescription()) {
          toastr.error('You can not skip this question, please record your answer.');
          return false;
          }
        }
        if (quesType === 'dropdown') {
          if (!saveDropdown()) {
          toastr.error('You can not skip this question, please record your answer.');
          return false;
          }
        }
        if (quesType === 'matrix') {
          if (!saveMatrix()) {
          toastr.error('You can not skip this question, please record your answer.');
          return false;
          }
        }
        if (quesType === 'rankOrder') {
          if (!saveRankOrder()) {
          toastr.error('You can not skip this question, please record your answer.');
          return false;
          }
        }
        if (quesType === 'slider') {
          if (!saveSlider()) {
          toastr.error('You can not skip this question, please record your answer.');
          return false;
          }
        }
        if (quesType === 'pairing') {
          if (!savePairing()) {
          toastr.error('You can not skip this question, please record your answer.');
          return false;
          }
        }
        if (quesType === 'timeAndDate') {
          if (!saveTimeDate()) {
            toastr.error('You can not skip this question, please record your answer.');
            return false;
          }
        }
        if (quesType === 'picture') {
          if (!saveDummyPicture()) {
            toastr.error('You can not skip this question, please record your answer.');
            return false;
          }
        }

        // for logic jump to question
        if (type === 'N') {
          logicJumpToQues(vm.showkey);
          console.log('jumpid---->', vm.jumptoQ);
        }

        /* -------------------------------------------------------------------
        * bellow code to update the vm.showkey according to
        * LogicJump, Next, Previous
        */
        if (vm.jumptoQ) {
            var prevKey = vm.showkey;
            vm.allQuestions.forEach(function(rowAll, kall) {
              if (rowAll._id === vm.jumptoQ) {
                vm.jumptoQ = '';
                // vm.allQuestions[kall].newRespData = 'new';
                // delete vm.allQuestions[kall].responsesData;
                if (kall > vm.showkey) {
                    vm.allQuestions[kall].setPrvKey = prevKey;
                }
                vm.showkey = kall;
                deleteOnJumpTo(vm.showkey, prevKey);
              }
            });
            fetchResponse(vm.showkey);
            updateToWindowObj(); // update saved data to window object
        } else {
            if (type === 'P') {
              deleteAnswer(vm.showkey);
              if (vm.allQuestions[vm.showkey].setPrvKey >= 0) {
                  vm.showkey = vm.allQuestions[vm.showkey].setPrvKey;
              } else {
                  if (vm.showkey === 0) { // vm.showkey will never go bellow 0.
                      vm.showkey = 0;
                  } else {
                      vm.showkey = vm.showkey - 1;
                  }
              }
              fetchResponse(vm.showkey);
              updateToWindowObj(); // update saved data to window object
            } else if (type === 'N') {
              // remove all previous keys from all questions
              for (var i = 0; i < vm.allQuestions.length; i++) {
                if (vm.allQuestions[i].setPrvKey >= 0)
                  delete vm.allQuestions[i].setPrvKey;
              }
              // check if last page
              vm.showkey = vm.showkey + 1;
              var iswelcome = _.size(vm.allQuestions.filter(function(n) { return (n.slug === 'welcome'); }));
              if (iswelcome === 0) {
                vm.lastcnt = vm.showkey + 1;
              } else {
                vm.lastcnt = vm.showkey;
              }

              if (vm.lastcnt === vm.exceptWelThank.length) {
                vm.endSurvey = true;
                vm.startSurvey = false;
                responseCollectedCallback();
                LS.remData();
              } else {
                fetchResponse(vm.showkey);
                updateToWindowObj(); // update saved data to window object
              }
            }
        }
        setDisplayHeight(type);
        // setProgressBar(type);
      }


      function logicJumpToQues(currKey) {

        if (!vm.allQuestions[currKey].jumps) {
          return false;
        }

        var logicjumpsAll = vm.allQuestions[currKey].jumps;
        var jumpsLength = vm.allQuestions[currKey].jumps.length;

        for (var i = 0; i < logicjumpsAll.length; i++) {

          var flagFalse = false;

          for (var j = 0; j < logicjumpsAll[i].logic.length; j++) {

              var logicQues = logicjumpsAll[i].logic[j].question;
              var logicAns = logicjumpsAll[i].logic[j].choice;

              var detailQues = reduceQues(logicQues);

              var qInLogic = quesInlogic(logicjumpsAll[i].logic, logicQues);

              if (!detailQues.responsesData) {
                flagFalse = true;
                break;
              }
              if (detailQues.questionType === 'multiChoice') {
                  if (detailQues.responsesData.choices.length !== qInLogic) {
                    flagFalse = true;
                    break;
                  }
                  var ansFoundM = findIndex(detailQues.responsesData.choices, logicAns);
                  if (ansFoundM < 0) {
                    flagFalse = true;
                    break;
                  }
              }

              if (detailQues.questionType === 'dropdown') {
                  if (detailQues.responsesData.choices.length !== qInLogic) {
                    flagFalse = true;
                    break;
                  }
                  var ansFoundD = findIndex(detailQues.responsesData.choices, logicAns);
                  if (ansFoundD < 0) {
                    flagFalse = true;
                    break;
                  }
              }

              if (detailQues.questionType === 'imageChoice') {
                  if (detailQues.responsesData.mediaFiles.length !== qInLogic) {
                    flagFalse = true;
                    break;
                  }
                  var ansFoundI = findIndex(detailQues.responsesData.mediaFiles, logicAns);
                  if (ansFoundI < 0) {
                    flagFalse = true;
                    break;
                  }
              }

          }

          if (flagFalse === false) {
              vm.jumptoQ = logicjumpsAll[i].jumptoQuestion;
              break;
          }

        }

      }

      // -------------- functions added for logicJumps --------------- //
      function reduceQues(logicQues) {
          var ques = _.reduce(vm.allQuestions.filter(function(n) {
              return (n._id === logicQues);
          }));
          return ques;
      }

      function quesInlogic(logicAll, logicQues) {
        var size = _.size(logicAll.filter(function(lg) {
              return (lg.question === logicQues);
        }));
        return size;
      }

      function findIndex(respData, logicAns) {
          var inx = _.findIndex(respData, function(o) {
              return o._id === logicAns;
          });
          return inx;
      }
      // -------------- functions added for logicJumps End---------------//

      function deleteAnswer(passedkey) {
        var answerIds = [];
        var questions = [];
        if (vm.allQuestions[passedkey].answer) {
          answerIds.push(vm.allQuestions[passedkey].answer._id);
          questions.push(vm.allQuestions[passedkey]._id);
          UserResponses.deleteAnswer({ answer: answerIds, userResponse: vm.respondedId, questions: questions }, function success(response) {
              delete vm.allQuestions[passedkey].answer;
              answerIds.length = 0;
          }, function error(err) {
              ErrorHandler.error(err);
          });
        }
      }

      function deleteOnJumpTo(currkey, prevKey) {
          var initial;
          var max;
          var answerIds = [];
          var questions = [];
          if (currkey > prevKey) {
            initial = prevKey + 1;
            max = currkey;
          } else if (prevKey > currkey) {
            initial = currkey + 1;
            max = prevKey;
          }

          for (var i = initial; i < max; i++) {
              if (vm.allQuestions[i].answer) {
                  answerIds.push(vm.allQuestions[i].answer._id);
                  questions.push(vm.allQuestions[i]._id);
                  delete vm.allQuestions[i].answer;
              }
          }

          if (answerIds.length > 0) {
              console.log('ques to remove', answerIds);
              UserResponses.deleteAnswer({ answer: answerIds, userResponse: vm.respondedId, questions: questions }, function success(response) {
                answerIds.length = 0;
              }, function error(err) {
                  ErrorHandler.error(err);
              });
          }
      }

      function toggleFileSelect(index, file) {
        vm.allQuestions[vm.showkey].toggleImg[index] = !vm.allQuestions[vm.showkey].toggleImg[index];
        if (vm.allQuestions[vm.showkey].toggleImg[index] === true) {
          vm.userResponse.mediaFiles[index] = file;
        } else if (vm.allQuestions[vm.showkey].toggleImg[index] === false) {
          vm.userResponse.mediaFiles[index] = {};
        }

        if (vm.allQuestions[vm.showkey].questionType === 'imageChoice' && vm.allQuestions[vm.showkey].radioButtons === true) {
            for (var i = 0; i < vm.userResponse.mediaFiles.length; i++) {
              if (i !== index) {
                vm.allQuestions[vm.showkey].toggleImg[i] = false;
                vm.userResponse.mediaFiles[i] = {};
              }
            }
        }
      }


      function makeAnswerDraggable() {
        vm.answerListingOptions = {
          allowDuplicates: true,
          containment: '#sortable-container',
          orderChanged: function (cbObject) {
            console.log('order changed function called');

          }
        };
      }

      function toggleChoiceSelect(index, choice) {
        vm.allQuestions[vm.showkey].toggle[index] = !vm.allQuestions[vm.showkey].toggle[index];
        if (vm.allQuestions[vm.showkey].toggle[index] === true) {
            vm.userResponse.choices[index] = {};
            vm.userResponse.choices[index] = choice;

            if (vm.allQuestions[vm.showkey].questionType === 'multiChoice' && vm.allQuestions[vm.showkey].radioButtons === true) {
                for (var i = 0; i < vm.userResponse.choices.length; i++) {
                  if (i !== index) {
                    vm.allQuestions[vm.showkey].toggle[i] = false;
                    vm.userResponse.choices[i] = {};
                  }
                }
            }

        } else if (vm.allQuestions[vm.showkey].toggle[index] === false) {
          vm.userResponse.choices[index] = {};
        }
      }


      function toggleVideoSelect() {
        vm.toggleVid = !vm.toggleVid;
        if (vm.toggleVid === true) {
          vm.userResponse.videoUrl = vm.allQuestions[vm.showkey].videoUrl;
        } else if (vm.toggleVid === false) {
          vm.userResponse.videoUrl = '';
        }
      }


      function toggleMatrix(rowKey, colKey) {
        var newKey = rowKey + '_' + colKey;
        var newObj = {};
        if (vm.allQuestions[vm.showkey].matrix[rowKey][colKey] === true || vm.allQuestions[vm.showkey].matrix[rowKey][colKey] === 'true') {
          newObj.row = vm.allQuestions[vm.showkey].rows[rowKey];
          newObj.col = vm.allQuestions[vm.showkey].columns[colKey];
          newObj.mtxKey = newKey;
          newObj.weightage = colKey + 1;
          vm.userResponse.matrix.push(newObj);
          if (vm.allQuestions[vm.showkey].radioButtons === true) {
            var rowCnt = vm.allQuestions[vm.showkey].rows.length;
            for (var keyR in vm.userResponse.matrix) {
              if (vm.userResponse.matrix.hasOwnProperty(keyR)) {
                // console.log(keyR);
                for (var i = 0; i < rowCnt; i++) {
                  var rmKey = rowKey + '_' + i;
                    if (newKey === rmKey) {
                      continue;
                    } else {
                      if (vm.userResponse.matrix[keyR].mtxKey === rmKey) {
                        vm.userResponse.matrix.splice(keyR, 1);
                        vm.allQuestions[vm.showkey].matrix[rowKey][i] = 'false';
                      }
                    }
                }
              }
            }
          }
        } else if (vm.allQuestions[vm.showkey].matrix[rowKey][colKey] === false) {
          for (var key in vm.userResponse.matrix) {
            if (vm.userResponse.matrix.hasOwnProperty(key)) {
              if (vm.userResponse.matrix[key].mtxKey === newKey) {
               vm.userResponse.matrix.splice(key, 1);
              }
            }
          }
        }
        // console.log(vm.userResponse.matrix);
      }


      function saveDummyPicture() {
        if ((!vm.userResponse.mediaFiles.length === 0 || !vm.mediaFiles[vm.showkey][0].name) && vm.allQuestions[vm.showkey].isCompulsary === true) {
            return false;
        }
        if (vm.allQuestions[vm.showkey].pictureUrl) {
            vm.userResponse.pictureUrl = vm.allQuestions[vm.showkey].pictureUrl;
        }
        if (vm.userResponse.mediaFiles.length > 0 || vm.userResponse.pictureUrl) {
          saveToNewArray(vm.userResponse);
          return true;
        } else {
          return true;
        }
      }

      function generateFilesData() {
          var promises = [],
              files = [];
          vm.mediaFiles[vm.showkey].forEach(function(img, index) {
              promises.push(FileHelper.getData(img.file, true).then(function(f) {
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

      function savePairing () {

          for (var k in vm.userResponse.pairing) {
            if (vm.userResponse.pairing.hasOwnProperty(k)) {
              vm.userResponse.pairing.splice(k, 1);
            }
          }

          var leftLength = vm.storeLeftAnswerId.length;
          for (var i = 0; i < leftLength; i++) {
            var newObj = {};

            if (vm.storeLeftAnswerId.length > 0 && vm.storeRightAnswerId.length > 0) {
                for (var j = 0; j < vm.storeLeftAnswerId.length; j++) {
                    if (vm.storeLeftAnswerId[j].customId === i) {
                        newObj.left = vm.storeLeftAnswerId[j];
                        break;
                    }
                }

                for (var v = 0; v < vm.storeRightAnswerId.length; v++) {
                    if (vm.storeRightAnswerId[v].customId === i) {
                        newObj.right = vm.storeRightAnswerId[v];
                        break;
                    }
                }
            }

            vm.userResponse.pairing.push(newObj);
          }

          if (vm.userResponse.pairing.length === 0 && vm.allQuestions[vm.showkey].isCompulsary === true) {
              return false;
          }

          if (vm.userResponse.pairing.length > 0) {
            saveToNewArray(vm.userResponse);
            return true;
          } else {
              if (vm.allQuestions[vm.showkey].answer) {
                deleteAnswer(vm.showkey);
                console.log('del from pair un-saved');
              }
              return true;
          }
      }


      function saveSlider() {
        var nObj = {};
        nObj.text = vm.sliderConfig.value;
        if (nObj.text) {
          vm.allQuestions[vm.showkey].choices.forEach(function(ch) {
            if (_.trim(nObj.text) === _.trim(ch.text)) {
              nObj.slug = ch.slug;
              nObj._id = ch._id;
            }
          });
        }
        for (var k in vm.userResponse.choices) {
          if (vm.userResponse.choices.hasOwnProperty(k)) {
            vm.userResponse.choices.splice(k, 1);
          }
        }
        vm.userResponse.choices.push(nObj);
        vm.userResponse.sliderCfgVal = vm.sliderConfig.value;
        vm.allQuestions[vm.showkey].sliderCfgVal = vm.userResponse.sliderCfgVal;

        if (vm.userResponse.choices.length === 0 && vm.allQuestions[vm.showkey].isCompulsary === true) {
              return false;
        }

        if (vm.userResponse.choices.length > 0) {
            saveToNewArray(vm.userResponse);
            return true;
        } else {
            if (vm.allQuestions[vm.showkey].answer) {
                deleteAnswer(vm.showkey);
                console.log('del from slider un-saved');
            }
            return true;
        }
      }


      function saveRankOrder () {
        var userNewResp = JSON.parse(JSON.stringify(vm.userResponse));

        userNewResp.choices = [];
        vm.allQuestions[vm.showkey].choices.forEach(function(val, key) {
          if (val.text) {
            userNewResp.choices.push(val);
          }
        });

        if (userNewResp.choices.length === 0 && vm.allQuestions[vm.showkey].isCompulsary === true) {
              return false;
        }
        if (userNewResp.choices.length > 0) {
            saveToNewArray(userNewResp);
            return true;
        } else {
            if (vm.allQuestions[vm.showkey].answer) {
                deleteAnswer(vm.showkey);
                console.log('del from rank un-saved');
            }
            return true;
        }

      }


      function saveMatrix () {
          if (vm.userResponse.matrix.length === 0 && vm.allQuestions[vm.showkey].isCompulsary === true) {
              return false;
          }

          if (vm.userResponse.matrix.length > 0) {
              saveToNewArray(vm.userResponse);
              return true;
          } else {
              if (vm.allQuestions[vm.showkey].answer) {
                deleteAnswer(vm.showkey);
                console.log('del from matrix un-saved');
              }
              return true;
          }
      }


      function saveDropdown() {
        if (!vm.allQuestions[vm.showkey].dropChoice && vm.allQuestions[vm.showkey].isCompulsary === true) {
            return false;
        }
        vm.userResponse.choices = new Array();
        if (vm.allQuestions[vm.showkey].dropChoice) {
          vm.userResponse.choices.push(vm.allQuestions[vm.showkey].dropChoice);
        }
        if (vm.userResponse.choices.length > 0) {
          saveToNewArray(vm.userResponse);
          return true;
        } else {
          if (vm.allQuestions[vm.showkey].answer) {
                deleteAnswer(vm.showkey);
                console.log('del from dropdown un-saved');
          }
          return true;
        }
      }


      function saveDescription() {
        if (!vm.allQuestions[vm.showkey].resDescription && vm.allQuestions[vm.showkey].isCompulsary === true) {
            return false;
        }
        vm.userResponse.resDescription = vm.allQuestions[vm.showkey].resDescription;
        if (vm.allQuestions[vm.showkey].answer || vm.userResponse.resDescription) {
          saveToNewArray(vm.userResponse);
          return true;
        } else {
          if (vm.allQuestions[vm.showkey].answer) {
            deleteAnswer(vm.showkey);
            console.log('del from desc un-saved');
          }
          return true;
        }
      }


      function saveImageChoice() {
          var userNewResp = JSON.parse(JSON.stringify(vm.userResponse));
          userNewResp.mediaFiles = [];
          vm.userResponse.mediaFiles.forEach(function(val, key) {
            if (val.url) {
              userNewResp.mediaFiles.push(val);
            }
          });

          if (userNewResp.mediaFiles.length === 0 && vm.allQuestions[vm.showkey].isCompulsary === true) {
              return false;
          }

          if (userNewResp.mediaFiles.length > 0) {
            saveToNewArray(userNewResp);
            return true;
          } else {
            if (vm.allQuestions[vm.showkey].answer) {
              deleteAnswer(vm.showkey);
              console.log('del from img un-saved');
            }
            return true;
          }
      }


      function saveMultichoice() {
          var userNewResp = JSON.parse(JSON.stringify(vm.userResponse));

          userNewResp.choices = [];
            if (vm.userResponse.choices.length) {
            vm.userResponse.choices.forEach(function(val, key) {
              if (val.text) {
                userNewResp.choices.push(val);
              }
            });
          }

          if (userNewResp.choices.length === 0 && vm.allQuestions[vm.showkey].isCompulsary === true) {
            return false;
          }

          if (userNewResp.choices.length > 0) {
            saveToNewArray(userNewResp);
            return true;
          } else {
            if (vm.allQuestions[vm.showkey].answer) {
              deleteAnswer(vm.showkey);
              console.log('del from multiChoice un-saved');
            }
            return true;
          }
      }


      function saveTimeDate() {

        if (vm.allQuestions[vm.showkey].timeDate.type === 'TimeAndDate') {
            if ((!vm.allQuestions[vm.showkey].ansDate || !vm.allQuestions[vm.showkey].ansTime) && (vm.allQuestions[vm.showkey].isCompulsary === true))
              return false;

            vm.userResponse.ansDate = vm.allQuestions[vm.showkey].ansDate;
            vm.userResponse.ansTime = vm.allQuestions[vm.showkey].ansTime;
        }
        if (vm.allQuestions[vm.showkey].timeDate.type === 'Date') {
          if (!vm.allQuestions[vm.showkey].ansDate && vm.allQuestions[vm.showkey].isCompulsary === true)
            return false;

          vm.userResponse.ansDate = vm.allQuestions[vm.showkey].ansDate;
        }
        if (vm.allQuestions[vm.showkey].timeDate.type === 'Time') {
          if (!vm.allQuestions[vm.showkey].ansTime && vm.allQuestions[vm.showkey].isCompulsary === true)
            return false;

          vm.userResponse.ansTime = vm.allQuestions[vm.showkey].ansTime;
        }

        if (vm.userResponse.ansTime || vm.userResponse.ansDate) {
          saveToNewArray(vm.userResponse);
          return true;
        } else {
          if (vm.allQuestions[vm.showkey].answer) {
            deleteAnswer(vm.showkey);
            console.log('del from date un-saved');
          }
          return true;
        }

      }

      function saveToNewArray(userNewResp) {
          vm.allQuestions[vm.showkey].responsesData = userNewResp;
          vm.userResponse = {};
          if ($window.location.href.indexOf('preview=true') < 0) {
              saveUserResponses(vm.showkey, userNewResp);
          }
      }

      function saveUserResponses(passedQuesKey, userNewResp) {
          var saveData = {};
          saveData.surveyidobj = { surveyId: vm.surveyId };
          saveData.allQuestions = new Array();
          saveData.allQuestions.push(userNewResp);

          if (!vm.respondedId) {
              UserResponses.save(saveData, function success(responses) {
                  if (responses.subscriptionExpired === true) {
                      vm.subscriptionExpired = true;
                      LS.remData();
                      return false;
                  }
                  vm.respondedId = responses.responseMaster._id;
                  vm.allQuestions[passedQuesKey].answer = responses.answer;
                  if (vm.allQuestions[passedQuesKey].questionType === 'picture') {
                    vm.allQuestions[passedQuesKey].pictureUrl = responses.answer.mediaFile.url;
                  }
              }, function error(err) {
                  ErrorHandler.error(err);
              });
          } else {
              saveData._id = vm.respondedId;
              saveData.answer = vm.allQuestions[passedQuesKey].answer;
              UserResponses.update(saveData, function success(responses) {
                  vm.respondedId = responses.responseMaster._id;
                  vm.allQuestions[passedQuesKey].answer = responses.answer;
                  if (vm.allQuestions[passedQuesKey].questionType === 'picture') {
                    vm.allQuestions[passedQuesKey].pictureUrl = responses.answer.mediaFile.url;
                  }
              }, function error(err) {
                  ErrorHandler.error(err);
              });
          }
      }

      function responseCollectedCallback() {
          $mdDialog.show(
            $mdDialog.alert()
              // .parent(angular.element(document.querySelector('#popupContainer')))
              .clickOutsideToClose(true)
              // .title('Success')
              .textContent('Your response recorded successfully. Thank you.')
              .ariaLabel('Response collected')
              .ok('Okay')
          );
      }

      function questionSavedCB(response) {
          if ($window.env === 'development') {
              toastr.error('User-responses saved successfully!');
          } else {
              startS3Upload(response);
          }
      }

      function startS3Upload(response) {
          var s3Data = response.s3Data;
          var promises = [];
          vm.mediaFiles[vm.showkey].forEach(function(f, index) {
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
          });
      }


      // To generate Video preview for media type question
      function generatePreview(currUrl) {
        var matches;
        var url = '';
        if (currUrl)
            url = currUrl;
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


      // To validate image and upload it on local
      function validateFile($file, $invalidFile, index, img) {
        if (!$file && !$invalidFile) {
            return;
        }
        if ($invalidFile && $invalidFile.$error === 'pattern') {
            img.thumbUrl = img.file = img.name = null;
            toastr.error('File type error: Only ' + vm.mediaFilePattern.join(', ') + ' files are allowed to upload');
            return;
        }
        // Check if File size if correct and file type is correct
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
            img.thumbUrl = $file.name;
            img.name = $file.name;
        }

        generateFilesData()
        .then(function(files) {
            vm.userResponse.mediaFiles = [];
            vm.userResponse.mediaFiles = files;
        });
      }

      /**
       * Checks if choice is entered by user
       * @param  {Object}  c-Choice onject
       * @return {Boolean}   Returns true if choice is valid otherwise false
       */
      function isChoiceEntered(c) {
          return (c.text && c.text !== '');
      }


      function addEmptyTexts(key, count, indexText) {
        if (!vm.allQuestions[vm.showkey][key]) {
            vm.allQuestions[vm.showkey][key] = [];
        }
        _.times(count, function(i) {
            vm.allQuestions[vm.showkey][key].push({
                text: (indexText ? (i + 1) : '')
            });
        });
      }

      /**
       * Callback function when user changes slider interval value
       */
      function sliderIntervalChange() {
          if (vm.allQuestions[vm.showkey].optionCount < vm.allQuestions[vm.showkey].choices.length) {
              vm.allQuestions[vm.showkey].choices.splice(vm.allQuestions[vm.showkey].optionCount);
          } else if (vm.allQuestions[vm.showkey].optionCount > vm.allQuestions[vm.showkey].choices.length) {
              addEmptyTexts('choices', vm.allQuestions[vm.showkey].optionCount - vm.allQuestions[vm.showkey].choices.length);
          }
          updateSliderConfig();
      }


      /**
       * Set values for slider question
       */
      function updateSliderConfig() {
        if (vm.allQuestions[vm.showkey].questionType !== 'slider') {
            return;
        }
        vm.sliderConfig = {
            options: {
                showSelectionBar: true,
                showTicksValues: true,
                getSelectionBarColor: function(val) {
                    var i = 0,
                    choiceCount = vm.allQuestions[vm.showkey].choices.length;
                    vm.allQuestions[vm.showkey].choices.forEach(function(c, index) {
                        if (c.text === val) {
                            i = index + 1;
                        }
                    });
                    if (i <= Math.floor(choiceCount * 0.3))
                        return 'red';
                    if (i <= Math.floor(choiceCount * 0.6))
                        return 'orange';
                    if (i <= Math.floor(choiceCount * 0.9))
                        return 'yellow';
                    return '#2AE02A';
                },
                stepsArray: _.map(vm.allQuestions[vm.showkey].choices, function(c) { return (c.text || ''); }),
                disabled: !_.every(vm.allQuestions[vm.showkey].choices, isChoiceEntered)
            }
        };
      }

      function reload() {
          $window.location.reload();
      }

      function selectionQuestionLeftSide(choice, index) {
          var i,
          customId = 0,
          duplicateimage = [],
          left1,
          right1,
          customId1,
          leftindex,
          temperoryindex,
          rightsideid,
          rihgtchoiceindex,
          leftanswer,
          thirdcheck,
            afterdele = [],
            nonmatch = [];
          vm.storeLeftAnswerId.forEach(function (leftAns, index1) {
              vm.allQuestions[vm.showkey].leftChoices.forEach(function (leftside, index) {
                  if (choice._id === leftAns._id && choice.selected !== true && choice._id === leftside._id) {
                    rihgtchoiceindex = index1;
                    temperoryindex = index;
                    leftanswer = leftAns.customId;
              vm.storeRightAnswerId.forEach(function (rightAns, index1) {
                  if (leftAns.customId === rightAns.customId) {
                      rightsideid = rightAns.customId;
                  }
              });
              if (rightsideid === null || rightsideid === undefined) {
                  $('.poi').eq(temperoryindex).removeClass('test' + leftanswer);
                  vm.storeLeftAnswerId.splice(rihgtchoiceindex, 1);
              }
            }
          });
        });
        vm.allQuestions[vm.showkey].leftChoices.forEach(function (list, index) {
          vm.allQuestions[vm.showkey].rightChoices.forEach(function (rightside, index) {
            vm.storeRightAnswerId.forEach(function (right, j) {
              vm.storeLeftAnswerId.forEach(function (leftAns, index1) {
                if (choice._id === leftAns._id && choice.selected !== true) {
                  if (right.customId === leftAns.customId && right._id === rightside._id) {
                    rightside.selected = false;
                    $('.added').eq(right.index).removeClass('test' + right.customId);
                    $('.poi').eq(leftAns.index).removeClass('test' + leftAns.customId);
                    vm.storeLeftAnswerId.splice(index1, 1);
                    vm.storeRightAnswerId.splice(j, 1);

                        if (vm.storeRightAnswerId.length !== vm.storeLeftAnswerId.length) {
                          if (vm.storeRightAnswerId.length > vm.storeLeftAnswerId.length) {
                            var props = ['id'];
                            var result = vm.storeRightAnswerId.filter(function(o1) {
                              // filter out (!) items in result2
                              return !vm.storeLeftAnswerId.some(function(o2) {
                                return o1.customId === o2.customId;          // assumes unique id
                              });
                            }).map(function(o) {
                              // use reduce to make objects with only the required properties
                              // and map to apply this to the filtered array as a whole
                              return props.reduce(function(newo, name) {
                                newo[name] = o.customId;
                                return newo;
                              }, {});
                            });
                            result.forEach(function (value) {
                              vm.storeRightAnswerId.forEach(function (right, index1) {
                                 if (value.id === right.customId) {
                                   var right1 = right.index;
                                   vm.allQuestions[vm.showkey].rightChoices.forEach(function (rightside, index) {
                                     if (right1 === index) {
                                       rightside.selected = false;
                                       $('.added').eq(index).removeClass('test' + right.customId);
                                       return vm.storeRightAnswerId.splice(index1, 1);
                                     }
                                   });
                                 }
                              });

                            });
                          } else {
                            if (vm.storeLeftAnswerId.length > vm.storeRightAnswerId.length) {
                              var props1 = ['id'];
                              var result1 = vm.storeLeftAnswerId.filter(function (o1) {
                                // filter out (!) items in result2
                                return !vm.storeRightAnswerId.some(function (o2) {
                                  return o1.customId === o2.customId;          // assumes unique id
                                });
                              }).map(function (o) {
                                // use reduce to make objects with only the required properties
                                // and map to apply this to the filtered array as a whole
                                return props1.reduce(function (newo, name) {
                                  newo[name] = o.customId;
                                  return newo;
                                }, {});
                              });
                              // console.log(JSON.stringify(result1, null, 4));
                              result1.forEach(function (value) {
                                vm.storeLeftAnswerId.forEach(function (right, index1) {
                                  if (value.id === right.customId) {
                                    var right1 = right.index;
                                    vm.allQuestions[vm.showkey].leftChoices.forEach(function (leftside, index) {
                                      if (right1 === index) {
                                        leftside.selected = false;
                                        $('.poi').eq(index).removeClass('test' + right.customId);
                                        return vm.storeLeftAnswerId.splice(index1, 1);
                                      }
                                    });
                                  }
                                });

                              });
                            }
                          }

                        }
                  }
                }
                if (vm.storeRightAnswerId.length === 1) {
                  var storevalue = vm.storeRightAnswerId[0];
                    vm.storeLeftAnswerId.forEach(function (leftAns, index1) {
                        if (leftAns.customId === storevalue.customId || thirdcheck === undefined) {
                          thirdcheck = leftAns.customId;
                          return;
                        }
                    });
                    if (thirdcheck === storevalue.customId) {
                      return false;
                    } else {
                      // console.log('else block called');
                      vm.allQuestions[vm.showkey].rightChoices.forEach(function (rightside, index) {
                        vm.storeLeftAnswerId.forEach(function (leftAns, index1) {
                          if (rightside._id === storevalue._id && leftAns.customId === storevalue.customId) {
                            rightside.selected = false;
                            $('.added').eq(storevalue.index).removeClass('test' + storevalue.customId);
                            return vm.storeRightAnswerId.splice(0, 1);
                          }
                        });
                          if (vm.storeLeftAnswerId.length === 0) {
                            rightside.selected = false;
                            $('.added').eq(storevalue.index).removeClass('test' + storevalue.customId);
                            return vm.storeRightAnswerId.splice(0, 1);
                          }

                        });
                    }
                }

              });

            });
            });
            if (choice._id === list._id && choice.selected === true) {
              i = index;
              var leftLength = vm.storeLeftAnswerId.length;
              vm.storeLeftAnswerId.forEach(function (id) {
                if (id.customId === vm.storeLeftAnswerId.length) {
                  leftLength = vm.storeLeftAnswerId.length + 1;
              }
            });
              vm.storeLeftAnswerId.push({
                  _id: choice._id,
                  index: index,
                  type: 'leftside',
                  customId: leftLength,
                  selected: choice.selected,
                  text: choice.text,
                  slug: choice.slug
                });
            vm.storeLeftAnswerId.forEach(function (id) {
               customId = id.customId;
            });
            i = index;
          }
        });
          vm.storeLeftAnswerId.forEach(function (left, index) {
              duplicateimage.push(
                left.customId
              );
              left1 = left.customId;
              leftindex = left.index;
            if (!duplicateimage.hasDuplicates()) {
              if (left1 !== null && choice.selected === true) {
                $('.poi').eq(leftindex).addClass('test' + left1);
              }
            } else {
              duplicateimage.splice(-1, 1);
              var max = Math.max.apply(null, duplicateimage);
              max = max + 1;
              var totallength = vm.storeLeftAnswerId.length - 1;
              vm.storeLeftAnswerId[totallength].customId = max;
              if (!duplicateimage.hasDuplicates()) {
                if (left1 !== null && choice.selected === true) {
                  $('.poi').eq(leftindex).addClass('test' + max);
                }
              }
            }
        });
      }

      function pairSelStorage(question) {
        if (question.responsesData) {
            question.responsesData.pairing.forEach(function(data) {
                if (data.left) {
                  question.leftChoices[data.left.index].customId = data.left.customId;
                }
                if (data.right) {
                  question.rightChoices[data.right.index].customId = data.right.customId;
                }
            });
        }
      }

      function closeWindowPopup() {
        LS.remData(); // remove local storage data
        if ($window.close()) { // check if window is closable
          return false;
        } else {
          $window.open('/dashboard', '_self');
        }
      }

      function createDateInstance(q) {
        if (q.ansDate)
        q.ansDate = new Date(q.ansDate);
        if (q.ansTime)
        q.ansTime = new Date(q.ansTime);
      }

      function videoAudioPreview(url, currkey) {
          if (vm.whitelistExtensions.image.indexOf('.' + _.last(url.split('.'))) > -1) {
              vm.allQuestions[currkey].mediaImgShow = true;
          } else {
              var srcAudVid;
              vm.allQuestions[currkey].mediaImgShow = false;
              if ($window.env === 'development') {
                srcAudVid = $window.location.protocol + '//' + $window.location.host + url;
                $scope.trustSrc = function(src) {
                    return $sce.trustAsResourceUrl(src);
                };
                $scope.srcAudVid = { src: srcAudVid };
                // console.log('--->', $scope.srcAudVid);
              } else {
                $scope.trustSrc = function(src) {
                    return $sce.trustAsResourceUrl(src);
                };
                $scope.srcAudVid = { src: url };
              }
              // console.log(currkey);
              $('#video_' + currkey).load();
          }
      }


      function setDisplayHeight(type) {

          setTimeout(function() {
            $('.question-top-wrapper').height($(window).height() - 112);
            var calculateScroll = $('.currentQuestion').parent().position().top - 50;
                  $('.survey-content').animate({ top: (calculateScroll * (-1)) + 'px' }, 1000);
                      //  var er = $('.currentQuestion').height();
                      //  var pd = $('.currentQuestion').height() / 4;
                      //   if (er > 500) {
                      //     var maxHeight = er - 400;
                      //   $('.currentQuestion').css('overflow', 'auto');
                      //   $('.currentQuestion').css('max-height', maxHeight);
                      //   $('.currentQuestion').css('width', '100%');
                      //   $('.currentQuestion').css('margin', 'auto');
                      //   var co = $('.currentQuestion').parent('.container').width() + 100;
                      //   $('.currentQuestion').parent('.container').css('width', co);
                      //   $('.currentQuestion').css('padding-top', pd);
                      // } else {
                      //   $('.currentQuestion').css('padding-top', 0);
                      // }
                      setProgressBar();
          }, 100);
      }


      function selectionQuestionRightSide(choice, index) {
          var i,
          customId = 0,
          left1,
          right1,
          leftIndex,
          customId2,
          duplicateimage = [],
          temperoryindex,
          leftsideid,
          rightchoice,
          rihgtchoiceindex,
          thirdcheck;
          // console.log('---->', vm.allQuestions[vm.showkey].rightChoices);
          vm.storeRightAnswerId.forEach(function (rightAns, index1) {
             vm.allQuestions[vm.showkey].rightChoices.forEach(function (list, index) {
               if (choice._id === rightAns._id && choice.selected !== true && choice._id === list._id) {
                 temperoryindex = index;
                 rihgtchoiceindex = index1;
                 rightchoice = rightAns.customId;
                 vm.storeLeftAnswerId.forEach(function (leftAns, index1) {
                   if (leftAns.customId === rightAns.customId) {
                     leftsideid = rightAns.customId;
                   }
                 });
                 if (leftsideid === null || leftsideid === undefined) {
                  $('.added').eq(temperoryindex).removeClass('test' + rightchoice);
                  vm.storeRightAnswerId.splice(rihgtchoiceindex, 1);
                 }
               }
             });
            });
          vm.allQuestions[vm.showkey].rightChoices.forEach(function (list, index) {
            vm.allQuestions[vm.showkey].leftChoices.forEach(function (leftside, index) {
              vm.storeRightAnswerId.forEach(function (right, j) {
                vm.storeLeftAnswerId.forEach(function (leftAns, index1) {
                  if (choice._id === right._id && choice.selected !== true) {
                    if (right.customId === leftAns.customId && leftAns._id === leftside._id) {
                      leftside.selected = false;
                      $('.added').eq(right.index).removeClass('test' + right.customId);
                      $('.poi').eq(leftAns.index).removeClass('test' + leftAns.customId);
                      vm.storeLeftAnswerId.splice(index1, 1);
                      vm.storeRightAnswerId.splice(j, 1);

                      if (vm.storeRightAnswerId.length !== vm.storeLeftAnswerId.length) {
                        if (vm.storeLeftAnswerId.length > vm.storeRightAnswerId.length) {
                          var props2 = ['id'];
                          var result2 = vm.storeLeftAnswerId.filter(function(o1) {
                            // filter out (!) items in result2
                            return !vm.storeRightAnswerId.some(function(o2) {
                              return o1.customId === o2.customId;          // assumes unique id
                            });
                          }).map(function(o) {
                            // use reduce to make objects with only the required properties
                            // and map to apply this to the filtered array as a whole
                            return props2.reduce(function(newo, name) {
                              newo[name] = o.customId;
                              return newo;
                            }, {});
                          });
                          console.log(JSON.stringify(result2, null, 4));
                          result2.forEach(function (value) {
                            vm.storeLeftAnswerId.forEach(function (right, index1) {
                              if (value.id === right.customId) {
                                var right1 = right.index;
                                vm.allQuestions[vm.showkey].leftChoices.forEach(function (leftside, index) {
                                  if (right1 === index) {
                                    leftside.selected = false;
                                    $('.poi').eq(index).removeClass('test' + right.customId);
                                    return vm.storeLeftAnswerId.splice(index1, 1);
                                  }
                                });
                              }
                            });

                          });
                        } else {
                          if (vm.storeRightAnswerId.length > vm.storeLeftAnswerId.length) {
                            var props3 = ['id'];
                            var result3 = vm.storeRightAnswerId.filter(function(o1) {
                              // filter out (!) items in result2
                              return !vm.storeLeftAnswerId.some(function(o2) {
                                return o1.customId === o2.customId;          // assumes unique id
                              });
                            }).map(function(o) {
                              // use reduce to make objects with only the required properties
                              // and map to apply this to the filtered array as a whole
                              return props3.reduce(function(newo, name) {
                                newo[name] = o.customId;
                                return newo;
                              }, {});
                            });
                            result3.forEach(function (value) {
                              vm.storeRightAnswerId.forEach(function (right, index1) {
                                if (value.id === right.customId) {
                                  var right1 = right.index;
                                  vm.allQuestions[vm.showkey].rightChoices.forEach(function (rightside, index) {
                                    if (right1 === index) {
                                      rightside.selected = false;
                                      $('.added').eq(index).removeClass('test' + right.customId);
                                      return vm.storeRightAnswerId.splice(index1, 1);
                                    }
                                  });
                                }
                              });

                            });
                          }

                        }
                      }
                    }
                  }
                  if (vm.storeLeftAnswerId.length === 1) {
                    var storevalue = vm.storeLeftAnswerId[0];
                    vm.storeRightAnswerId.forEach(function (rightAns, index1) {
                      if (rightAns.customId === storevalue.customId || thirdcheck === undefined) {
                        thirdcheck = rightAns.customId;
                        return;
                      }
                    });
                    if (thirdcheck === storevalue.customId) {
                      return false;
                    } else {
                      console.log('else block called');
                      vm.allQuestions[vm.showkey].leftChoices.forEach(function (leftside, index) {
                        vm.storeRightAnswerId.forEach(function (rightAns, index1) {
                          if (leftside._id === storevalue._id && rightAns.customId === storevalue.customId) {
                            leftside.selected = false;
                            $('.added').eq(storevalue.index).removeClass('test' + storevalue.customId);
                            return vm.storeLeftAnswerId.splice(0, 1);
                          }
                        });
                        if (vm.storeRightAnswerId.length === 0) {
                          leftside.selected = false;
                          $('.poi').eq(storevalue.index).removeClass('test' + storevalue.customId);
                          return vm.storeLeftAnswerId.splice(0, 1);
                        }
                      });
                    }
                  }
                });
            });
          });
          if (choice._id === list._id && choice.selected === true) {
            i = index;
            var legnth = vm.storeRightAnswerId.length;
            vm.storeRightAnswerId.forEach(function (id) {
              if (id.customId === vm.storeRightAnswerId.length) {
                legnth = vm.storeRightAnswerId.length + 1;
              }
            });
            vm.storeRightAnswerId.push({
               _id: choice._id,
               index: index,
               type: 'rightside',
               customId: legnth,
               selected: choice.selected,
               text: choice.text,
               slug: choice.slug
            });
            vm.storeRightAnswerId.forEach(function (id1, rightindex) {
              customId2 = id1.customId;
            });
            i = index;
          }
         });
         vm.storeRightAnswerId.forEach(function (right, index) {
           duplicateimage.push(
             right.customId
           );
            right1 = right.customId;
           if (!duplicateimage.hasDuplicates()) {
             if (right1 !== null && choice.selected === true) {
               $('.added').eq(right.index).addClass('test' + right1);
             }
           } else {
             duplicateimage.splice(-1, 1);
             var max = Math.max.apply(null, duplicateimage);
             max = max + 1;
             var totallength = vm.storeRightAnswerId.length - 1;
             vm.storeRightAnswerId[totallength].customId = max;
             if (!duplicateimage.hasDuplicates()) {
               if (right1 !== null && choice.selected === true) {
                 $('.added').eq(right.index).addClass('test' + max);
               }
             }
           }
         });
        console.log(vm.storeLeftAnswerId);
        console.log(vm.storeRightAnswerId);
      }

      /*
      * for pairing right answer randomize
      * */
      function rightRandomizeOrder(question) {
          var m = question.rightChoices.length,
            t,
            i;
            // While there remain elements to shuffle
            while (m) {
            // Pick a remaining element…
            i = Math.floor(Math.random() * m--);
            // And swap it with the current element.
            t = question.rightChoices[m];
            question.rightChoices[m] = question.rightChoices[i];
            question.rightChoices[i] = t;
          }
          return question.rightChoices;
      }


      /*
      * for pairing left answer randomize
      * */
      function leftRandomizeOrder (question) {
          var m = question.leftChoices.length,
            t,
            i;
          // While there remain elements to shuffle
          while (m) {
            // Pick a remaining element…
            i = Math.floor(Math.random() * m--);
            // And swap it with the current element.
            t = question.leftChoices[m];
            question.leftChoices[m] = question.leftChoices[i];
            question.leftChoices[i] = t;
          }
          return question.leftChoices;
      }


      function setProgressBar (type) {
        vm.exceptWelThank = vm.allQuestions.filter(function(n) { return (n.slug !== 'welcome'); });
        vm.totallength = vm.exceptWelThank.length - 1;
        vm.totalwidth = 100 / vm.totallength;
        vm.width = vm.showkey * vm.totalwidth;
        $('.user-responses-page-footer').find('.progress-bar').attr('style', 'width:' + vm.width + '% !important');
      }

    }
}());
