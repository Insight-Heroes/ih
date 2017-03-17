(function () {
    'use strict';

    angular
        .module('logicjumps')
        .controller('LogicJumpsController', LogicJumpsController);

    LogicJumpsController.$inject = ['Survey', '$scope', 'toastr', '$state', '$stateParams', 'ErrorHandler', 'currentQuestion', '$uibModalInstance', 'questions', '$http', 'Question', 'LogicJump', 'surveyjumps'];
    function LogicJumpsController(Survey, $scope, toastr, $state, $stateParams, ErrorHandler, currentQuestion, $uibModalInstance, questions, $http, Question, LogicJump, surveyjumps) {
        var vm = this;
        // To allow only given types of questions
        filterQuestions();

        vm.currentQuestion = currentQuestion;
        vm.closeModal = closeModal;
        vm.populateChoice = populateChoice;
        vm.saveLogicJumps = saveLogicJumps;
        vm.appendToMainDiv = appendToMainDiv;
        vm.logicjumpsAll = '';
        vm.populateEmptyJumps = populateEmptyJumps;
        vm.removeJumps = removeJumps;
        vm.remLogicjumpFromQues = remLogicjumpFromQues;
        vm.prepareRemLogFromQues = prepareRemLogFromQues;
        vm.validateDuplicate = validateDuplicate;
        vm.deleteLogicjumps = [];
        vm.remLogicFromQues = [];
        vm.comparejumps = [];
        vm.isFixed = true;

        // Code added by Kalpesh
        vm.updateQuestionModel = updateQuestionModel;
        vm.updateChoiceModel = updateChoiceModel;
        vm.updateJumpQuestionModel = updateJumpQuestionModel;
        vm.closeDropdown = closeDropdown;

        // --- to Add/Edit screen logicJump ---- //
        fetchLogicJumps();

        /**
         * Close modal
         */
        function closeModal() {
            $uibModalInstance.dismiss('cancel');
        }

         /**
          * hide element when click on logic-jump model
          * */

        /**
         * On change of question dropdown, it get populate choices
         */
        function populateChoice(quesid, count, el) {
            vm.questions.forEach(function(r, $index) {
                    if (r._id === quesid) {
                            if (r.questionType === 'imageChoice') {
                                el.choices = r.mediaFiles;
                            } else if (r.questionType !== 'imageChoice') {
                                el.choices = r.choices;
                            }
                    }
            });
        }

        /**
         * add/remove dynamic divs on click of +/x buttons
         */
        function appendToMainDiv(type, index, logicAr, questionId, logicId) {
            if (type === 'add') {
                var empty = {};
               logicAr.push(empty);
            } else {
                logicAr.splice(index, 1);
                prepareRemLogFromQues(logicAr, questionId, logicId);
            }
        }

        function validateDuplicate(quesId, ansId, quesObj, index, el) {
            var i = 0;
             quesObj.logic.forEach(function(row, key) {
                if (row.question === quesId && row.choice === ansId) {
                    i++;
                    if (i > 1) {
                       el.choice = '';
                       toastr.error('Please select different answer');
                       return false;
                    }
                }
             });
        }

        /**
         * create logic jump
         */
        function saveLogicJumps(formValid, errors) {

            /*
            *  ---- Logic jump validation start ------
            */
            var errorValidFlag = false;
            for (var v = 0; v < vm.logicjumpsAll.length; v++) {
                for (var lg = 0; lg < vm.logicjumpsAll[v].logic.length; lg++) {
                    if (!vm.logicjumpsAll[v].logic[lg].question) {
                        errorValidFlag = true;
                        vm.logicjumpsAll[v].logic[lg].questionError = true;
                    } else {
                        vm.logicjumpsAll[v].logic[lg].questionError = false;
                    }

                    if (!vm.logicjumpsAll[v].logic[lg].choice) {
                        errorValidFlag = true;
                        vm.logicjumpsAll[v].logic[lg].answerError = true;
                    } else {
                        vm.logicjumpsAll[v].logic[lg].answerError = false;
                    }
                }

                if (!vm.logicjumpsAll[v].jumptoQuestion) {
                    errorValidFlag = true;
                    vm.logicjumpsAll[v].jumpToError = true;
                } else {
                    vm.logicjumpsAll[v].jumpToError = false;
                }
            }

            if (errorValidFlag) {
                console.log(vm.logicjumpsAll);
                toastr.error('Please select all fields!!');
                return false;
            }
            /*
            *  ---- Logic jump validation end ------
            */


            /*
            *  ---- Bellow code for checking ----
            *  ---- duplicate logicJump group, self relation ------
            */
            var newJumpArr = [];
            for (var i = 0; i < vm.logicjumpsAll.length; i++) {
                var nobj = {};
                var aLogic = [];
                var selfRel = false;
                for (var j = 0; j < vm.logicjumpsAll[i].logic.length; j++) {
                    var obj2 = {};
                    obj2.choice = vm.logicjumpsAll[i].logic[j].choice;
                    obj2.question = vm.logicjumpsAll[i].logic[j].question;
                    aLogic.push(obj2);

                    if (vm.logicjumpsAll[i].logic[j].question !== vm.logicjumpsAll[i].jumptoQuestion) {
                        selfRel = true;
                    }
                }

                if (selfRel === false) {
                    toastr.error('Please do not make only self relation between jump to and condition question(s)!!');
                    return false;
                }

                nobj.logic = aLogic;
                nobj.jumptoQuestion = vm.logicjumpsAll[i].jumptoQuestion;

                if (newJumpArr.length > 0) {
                    for (var s = 0; s < newJumpArr.length; s++) {
                        if (newJumpArr[s].jumptoQuestion === nobj.jumptoQuestion) {
                            var a1 = _.orderBy(newJumpArr[s].logic, ['choice', 'question'], ['asc', 'ase']);
                            var a2 = _.orderBy(nobj.logic, ['choice', 'question'], ['asc', 'ase']);
                            var res = _.isEqual(a1, a2);
                            if (res === true) {
                                toastr.error('Some Logic groups are duplicate !!');
                                return false;
                            }
                        }
                    }
                }
                newJumpArr.push(nobj);
            }
            /*
            *  ----------End Of remove duplicate logicJump group, self relation -----------
            */

            LogicJump.save(vm.logicjumpsAll, function(response) {
                toastr.success('Logic-Jump saved successfully');
                closeModal();
                $state.go('surveys.design', { id: currentQuestion.survey }, { reload: true });
            }, function(err) {
                ErrorHandler.error(err);
            });

            // remove logic jumps with bunch of questions
            if (vm.deleteLogicjumps.length > 0) {
                removeCollectionJumps();
            }

        }

        /**
         * Edit logic jump
         */
        function fetchLogicJumps() {
            var questionId = currentQuestion._id;
            $http.get('/api/logicjumps/' + questionId + '/logic_jumps').success(function (res) {
                vm.logicjumpsAll = res;
                if (vm.logicjumpsAll.length > 0) {
                vm.logicjumpsAll.forEach(function(row, key) {
                    row.logic.forEach(function(rl, kl) {
                         vm.questions.forEach(function(qval, Qkey) {
                           if (qval._id === rl.question && qval.questionType === 'imageChoice') {
                                rl.choices = qval.mediaFiles;
                           } else if (qval._id === rl.question && qval.questionType !== 'imageChoice') {
                                rl.choices = qval.choices;
                           }
                        });
                    });
                    vm.comparejumps.push(row);
                });
                } else {
                    populateEmptyJumps();
                }
            }).error(function(response) {
                toastr.error(response);
            });
        }

        function populateEmptyJumps(index) {
            var empty = {};
            var emptyLogic = {};
            empty.logic = [];
            // emptyLogic.question = ''; Change Request...
            // emptyLogic.choice = ''; change Request...

            /* Change request to select by default self question for empty jump */
            emptyLogic.question = currentQuestion._id;
            vm.questions.forEach(function(r, $index) {
                    console.log(r._id, currentQuestion._id);
                    if (r._id === currentQuestion._id) {
                            if (r.questionType === 'imageChoice') {
                                emptyLogic.choices = r.mediaFiles;
                            } else if (r.questionType !== 'imageChoice') {
                                emptyLogic.choices = r.choices;
                            }
                    }
            });


            empty.logic.push(emptyLogic);

            if (vm.logicjumpsAll.length > 0) {
                vm.logicjumpsAll.splice(index + 1, 0, empty);
                // vm.logicjumpsAll.push(empty);
            } else {
                vm.logicjumpsAll = [];
                vm.logicjumpsAll.push(empty);
            }
            vm.logicjumpsAll.forEach(function(data, key) {
                data.logicPosition = String(key);
            });
        }

        // it create array of logicjump id and questions for delete
        function removeJumps(key) {
            if (vm.logicjumpsAll[key]) {
                vm.deleteLogicjumps.push(vm.logicjumpsAll[key]);
            }
            vm.logicjumpsAll.splice(key, 1);
            if (vm.logicjumpsAll.length === 0 && vm.logicjumpsAll.length === 0) {
                // populateEmptyJumps();
                vm.showallLogicdelete = true;
            }
            vm.logicjumpsAll.forEach(function(data, key) {
                data.logicPosition = String(key);
            });
        }

        function removeCollectionJumps() {
            $http.post('/api/logicjumps/delete_jumps', vm.deleteLogicjumps).success(function (res) {
            }).error(function(response) {
                toastr.error(response);
            });
        }


        // create array for deletion of logicJump from questions
        function prepareRemLogFromQues(logicAr, questionId, logicId) {
            var flag = 0;
            logicAr.forEach(function(data, key) {
                if (data.question === questionId || !questionId || !logicId) {
                    flag = 1;
                }
            });
            if (!flag) {
                var tempLogic = {};
                tempLogic.questionId = questionId;
                tempLogic.logicId = logicId;
                if (logicId && questionId) {
                    vm.remLogicFromQues.push(tempLogic);
                }
                tempLogic = {};
            }
            // console.log('delArr', vm.remLogicFromQues);
        }


        function remLogicjumpFromQues() {
            // console.log('delete logics', vm.remLogicFromQues);
            var remLogic = vm.remLogicFromQues;
            vm.remLogicFromQues = [];
            $http.post('/api/logicjumps/remLogicFromQues', remLogic).success(function (res) {
            }).error(function(response) {
                toastr.error(response);
            });
        }

        /**
         * Filter questions
         * - allowed bellow questions types for logic jump
         * @return {Array} Question array
         */
        function filterQuestions() {
            vm.quesAllType = questions.filter(function(n) { return (n.slug !== 'customPage'); });
            vm.questions = _.filter(questions, function(q) {
                if (_.includes(['multiChoice', 'dropdown', 'imageChoice'], q.questionType)) {
                    // console.log(q.questionType);
                    return true;
                } else {
                    return false;
                }
            });
        }


        /**
         * Update ng-model with value
         * This function is written to make Bootstrap dropdown work similar to Select list
         * for question selection
         * @param  {Object} model - ng-model to update
         * @param  {String} val   - Value to set in ng-model
         */
        function updateQuestionModel(el, c, index) {
            el.question = c._id;
            if (c._id) {
                el.questionError = false;
            }
            populateChoice(el.question, index, el);
            el.choice = null;
        }

        /**
         * Update ng-model with value
         * This function is written to make Bootstrap dropdown work similar to Select list
         * for choice selection
         * @param  {Object} model - ng-model to update
         * @param  {String} val   - Value to set in ng-model
         */
        function updateChoiceModel(el, opt, index, key) {
            el.choice = opt._id;
            if (opt._id) {
                el.answerError = false;
            }
            vm.validateDuplicate(el.question, el.choice, vm.logicjumpsAll[key], index, el);
        }

        /**
         * Update ng-model with value
         * This function is written to make Bootstrap dropdown work similar to Select list
         * for choice selection
         * @param  {Object} model - ng-model to update
         * @param  {String} val   - Value to set in ng-model
         */
        function updateJumpQuestionModel(item, c, index) {
            item.jumptoQuestion = c._id;
            if (c._id) {
                item.jumpToError = false;
            }
        }

        function closeDropdown() {
            $('.custom-dropdown .dropdown.open a').dropdown('close');
        }

    }
}());
