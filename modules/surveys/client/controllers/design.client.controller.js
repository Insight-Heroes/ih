(function() {
    'use strict';

    angular
        .module('surveys')
        .controller('SurveyDesignController', SurveyDesignController);

    SurveyDesignController.$inject = ['Survey', 'Question', 'Page', '$q', '$scope', 'toastr', '$state', '$stateParams', 'ErrorHandler', '$mdSidenav', 'Authentication', '$window', 'Encryption', '$uibModal', '$http', '$filter', '$mdDialog', 'Upload', 'SharedService', '$timeout'];

    function SurveyDesignController(Survey, Question, Page, $q, $scope, toastr, $state, $stateParams, ErrorHandler, $mdSidenav, Authentication, $window, Encryption, $uibModal, $http, $filter, $mdDialog, Upload, SharedService, $timeout) {
        var vm = this;

        // View variable binding
        vm.authentication = Authentication;
        vm.defaultPages = [];
        vm.questionVisible = true;
        vm.pageVisible = true;
        setDefaultPages();
        adjustSidebarHeight();
        vm.hidePublishButton = true;

        // View function bindings
        vm.surveyHasPages = surveyHasPages;
        vm.surveyHasQuestions = surveyHasQuestions;
        vm.getQuestionType = getQuestionType;
        vm.getPageType = getPageType;
        vm.getClassName = getClassName;
        vm.editQuestion = editQuestion;
        vm.editPage = editPage;
        vm.deleteQuestion = deleteQuestion;
        vm.copyQuestion = copyQuestion;
        vm.openLogicJumps = openLogicJumps;
        vm.deletePage = deletePage;
        vm.questionTypes = convertToArray($window.questionTypes);
        vm.navigateToDistribute = navigateToDistribute;
        vm.imagePreview = imagePreview;
        vm.jumpRelationQuestion = jumpRelationQuestion;
        vm.jumpRelationQuestionHide = jumpRelationQuestionHide;
        vm.togglePageQuestion = togglePageQuestion;
        vm.typeArr = {
          quesType: ['multiChoice', 'imageChoice', 'dropdown']
        };
        surveysNavHide();

        vm.showPreview = function() {
            if (vm.survey.questions.length === 0) {
                toastr.error('There are no questions in Survey to preview, please add questions!');
                return false;
            }
            // console.log(vm.survey);
            var url = $window.location.origin + '/r/' + vm.survey.randomCode + '?preview=true';
            // $window.open(url, '', 'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,top=' + 150 + ',left=' + 440 + ',width=600,height=400');
            $window.open(url, '_blank');
        };

        function surveysNavHide() {
            if ($state.current.name === 'surveys.design') {
                vm.onPage = true;
             }
            }
        function setSidebarBottomHeight() {
            var designSidebarHeaight = $('.design-sidebar').height();
            var designSidebarTopHeight = $('.design-sidebar .sidebar-top').height();
            var calculatedDesignSidebarBottomHeight = designSidebarHeaight - designSidebarTopHeight;
            $('.design-sidebar .sidebar-bottom').height(calculatedDesignSidebarBottomHeight);
        }

        /**
         * Toggle sidebar page & question section
         * @param  {String} type - it defines type which needs to be toggles
         * Type can be questions/pages
         */
        function togglePageQuestion(type) {
            if (type === 'page') {
                vm.pageVisible = !vm.pageVisible;
            } else {
                vm.questionVisible = !vm.questionVisible;
            }
            adjustSidebarHeight();
        }

        function adjustSidebarHeight() {
            $timeout(function() {
                setSidebarBottomHeight();
            }, 400);
        }

        $(window).on('resize', function() {
            setSidebarBottomHeight();
        });

        // Publish Survey
        vm.openPublishModal = function() {
            SharedService.publishSurvey(vm.survey);
        };

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
                .then(function(url) {
                    vm[modelKey] = url;
                });
        }

        // Fetch Survey
        Survey.get({ id: $stateParams.id }, function success(survey) {
            setModelNamesAndMoveCustomPage(survey);
            setDragNDrop();
        }, function error(err) {
            $state.go('dashboard');
            ErrorHandler.error(err);
        });

        function setModelNamesAndMoveCustomPage(survey) {
            var customPageIndices = [];
            vm.pages = null;
            vm.questions = null;
            survey.pages.forEach(function(p, index) {
                if (p.inQuestions) {
                    customPageIndices.push(index);
                }
                p.modelName = 'page';
            });
            survey.questions.forEach(function(p) {
                p.modelName = 'question';
            });
            customPageIndices.reverse().forEach(function(i) {
                survey.questions.push(survey.pages[i]);
                survey.pages.splice(i, 1);
            });
            if (survey.hasOwnProperty('_id')) {
                vm.survey = survey;
            }
            vm.pages = $filter('orderBy')(vm.survey.pages, 'position') || [];
            vm.questions = $filter('orderBy')(vm.survey.questions, 'position');
        }

        /**
         * Add sortable module to questions
         * so that question can be dragged and dropped to
         * main container
         */
        function setDragNDrop() {
            vm.questionListingOptions = {
                allowDuplicates: true,
                containment: '#sortable-container',
                orderChanged: function(cbObject) {
                    savePageAndQuestionOrder();
                },
                itemMoved: function(handler) {
                    if (handler.source.itemScope.modelValue.slug !== 'customPage') {
                        if (handler.source.sortableScope.$$prevSibling.$id === handler.dest.sortableScope.$id) {
                            handler.dest.sortableScope.removeItem(handler.dest.index || 0);
                            handler.source.itemScope.sortableScope.insertItem(handler.source.index, handler.source.itemScope.modelValue);
                        }
                    } else {
                        savePageAndQuestionOrder();
                    }
                }
            };

            vm.pagesListingOptions = {
                allowDuplicates: true,
                containment: '#sortable-container',
                orderChanged: function(cbObject) {
                    savePageAndQuestionOrder();
                },
                itemMoved: function(handler) {
                    if (handler.source.itemScope.modelValue.slug !== 'customPage') {
                        // Moving in between pages, its fine, move it
                        if (vm.pages === handler.dest.sortableScope.modelValue) {
                            savePageAndQuestionOrder();
                        } else {
                            handler.dest.sortableScope.removeItem(handler.dest.index || 0);
                            handler.source.itemScope.sortableScope.insertItem(handler.source.index, handler.source.itemScope.modelValue);
                        }
                    } else {
                        savePageAndQuestionOrder();
                    }
                }
            };

            vm.defaultQuestionTypeOptions = {
                clone: true,
                additionalPlaceholderClass: 'question-sortable',
                containment: '#sortable-container',
                itemMoved: function(handler) {
                    // Question is moved to question section, its fine.
                    if (vm.questions === handler.dest.sortableScope.modelValue) {
                        var positions = getPositions();
                        if (positions.questions.current != null) {
                            editQuestion({ questionType: positions.currentQuestion.slug }, positions);
                        }
                    }
                    handler.dest.sortableScope.removeItem(handler.dest.index || 0);

                }
            };

            vm.defaultPageOptions = {
                clone: true,
                additionalPlaceholderClass: 'page-sortable',
                containment: '#sortable-container',
                itemMoved: function(handler) {
                    var modelValue = handler.source.itemScope.modelValue;
                    // Page is droppped in question sections
                    if (vm.questions === handler.dest.sortableScope.modelValue) {
                        console.log('Page is dropped in questions');
                        if (modelValue.slug === 'customPage') {
                            var positions = getPositions();
                            positions.currentPage.inQuestions = true;
                            editPage(positions.currentPage, positions);
                        }
                    // Page is dropped in pages section, this is going to be ugly
                    } else {
                        console.log('Page is dropped in pages');
                        if (modelValue.slug === 'customPage') {
                            console.log('Page is a custom page');
                            editPage(modelValue, getPositions(null, modelValue));
                        } else {
                            console.log('Page is ', modelValue.slug);
                            // If this is second welcome/thank you page,
                            // we will not allow the drag & drop
                            if (_.filter(vm.pages, function(o) { return o.slug === modelValue.slug; }).length === 1) {
                                editPage(modelValue, getPositions(null, modelValue));
                            }
                        }
                    }
                    handler.dest.sortableScope.removeItem(handler.dest.index || 0);
                }
            };

        }

        function getPositions(question, page) {
            var positions = {
                questions: {},
                customPages: {},
                pages: {},
                currentQuestion: null,
                currentPage: null
            };
            vm.questions.forEach(function(q, index) {
                if (q.modelName === 'question') {
                    if (q._id) {
                        positions.questions[q._id] = index;
                    } else {
                        positions.questions.current = index;
                        positions.currentQuestion = q;
                    }
                } else if (q.modelName === 'page') {
                    if (q._id) {
                        positions.customPages[q._id] = index;
                    } else {
                        positions.customPages.current = index;
                        positions.currentPage = q;
                        positions.currentPage.inQuestions = true;
                    }
                }
            });
            vm.pages.forEach(function(p, index) {
                if (p._id) {
                    positions.pages[p._id] = index;
                } else {
                    positions.pages.current = index;
                    positions.currentPage = p;
                    positions.currentPage.inQuestions = false;
                }
            });
            return positions;
        }

        /**
         * function to check if survey contains pages
         * @return {Boolean} returns true if survey contains pages otherwise returns false
         */
        function surveyHasPages() {
            if (vm.survey && vm.pages && vm.pages.length > 0) {
                return true;
            } else {
                return false;
            }
        }
        /**
         * function to check if survey contains questions
         * @return {Boolean} returns true if survey contains questions otherwise returns false
         */
        function surveyHasQuestions() {
            if (vm.survey && vm.questions && vm.questions.length > 0) {
                return true;
            } else {
                return false;
            }
        }

        /**
         * Set default pages array
         */
        function setDefaultPages() {
            for (var slug in $window.pageTypes) {
                // check also if property is not inherited from prototype
                if ($window.pageTypes.hasOwnProperty(slug)) {
                    vm.defaultPages.push({
                        title: $window.pageTypes[slug].title,
                        slug: slug,
                        modelName: 'page'
                    });
                }
            }
        }

        function convertToArray(questionTypes) {
            var types = [];
            for (var k in questionTypes) {
                if (questionTypes.hasOwnProperty(k)) {
                    var obj = questionTypes[k];
                    obj.slug = k;
                    obj.modelName = 'question';
                    types.push(obj);
                }
            }
            return types;
        }

        /**
         * Save pages and question order in survey object
         * @return {[type]} [description]
         */
        function savePageAndQuestionOrder() {
            var url = '/api/surveys/' + vm.survey._id + '/reorder_questions';
            var positions = getPositions();
            if ((_.size(positions.questions) === 0) && (_.size(positions.customPages) === 0) && (_.size(positions.pages) === 0)) {
                return;
            }
            $http.put(url, { positions: positions })
                .success(function(data, status, headers, config) {
                    toastr.success('Order saved successfully');
                    $state.go('surveys.design', { id: vm.survey._id }, { reload: true });

                })
                .error(function(data, status, header, config) {
                    ErrorHandler.error(data);
                });
        }

        function getClassName(slug) {
            if ($window.questionTypes[slug]) {
                return $window.questionTypes[slug].className;
            } else {
                return '';
            }
        }

        function getQuestionType(slug) {
            if ($window.questionTypes[slug]) {
                return $window.questionTypes[slug].title;
            } else {
                return '';
            }
        }

        function getPageType(slug) {
            if ($window.pageTypes && (slug === 'welcome' || slug === 'thankYou' || slug === 'customPage')) {
                return $window.pageTypes[slug].title;
            } else {
                return '';
            }
        }

        /**
         * Go to question edit page
         * @param  {Object} question Question object
         */
        function editQuestion(question, positions) {
            $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: 'modules/questions/client/views/form.client.view.html',
                controller: 'QuestionsController',
                controllerAs: 'vm',
                size: 'lg',
                resolve: {
                    questionSlug: function() {
                        return question.questionType;
                    },
                    surveyID: function() {
                        return $stateParams.id;
                    },
                    questionID: function() {
                        return question._id;
                    },
                    positions: function() {
                        return positions;
                    }
                }
            });
        }

        /**
         * Open page editing modal
         * @param  {Object} question Question object
         */
        function editPage(page, positions) {
            $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: 'modules/pages/client/views/page-modal.client.view.html',
                controller: 'PageModalController',
                controllerAs: 'vm',
                size: 'lg',
                resolve: {
                    page: function() {
                        return page;
                    },
                    surveyID: function() {
                        return $stateParams.id;
                    },
                    positions: function() {
                        return positions;
                    }
                }
            });
        }

        /**
         * Delete a question from server
         * @param  {String} questionID id of question
         */
        function deleteQuestion(question, index) {

            /*
            *   Code added to check for question exists in logicJump
            */
            if (vm.survey.jumps) {
                for (var i = 0; i < vm.survey.jumps.length; i++) {
                    if (vm.survey.jumps[i].jumptoQuestion === question._id) {
                        toastr.error('This question is already present in LogicJump, Please Un-Select it from LogicJump then delete this question!!');
                        return false;
                    }
                }
            }
            if (question.logicJumps.length > 0) {
                toastr.error('This question is already present in LogicJump, Please Un-Select it from LogicJump then delete this question!!');
                return false;
            }
            /*
            *  End of Code added to check for question exists in logicJump
            */

            Question.remove({ id: question._id }, function success(response) {
                $state.go('surveys.design', { id: vm.survey._id }, { reload: true });
                toastr.success('Question deleted successfully');
            }, function error(err) {
                ErrorHandler.error(err);
            });
        }

        /**
         * Delete a Page from server
         * @param  {String} PageID id of each Page
         */
        function deletePage(page, index) {
            Page.delete({ id: page._id }, function success(response) {
                $state.go('surveys.design', { id: vm.survey._id }, { reload: true });
                toastr.success('Page deleted successfully');
            }, function error(err) {
                ErrorHandler.error(err);
            });

        }

        /**
         * Copy question
         * @param  {Object} question - Question object
         */
        function copyQuestion(question) {
            Question.copy({ id: question._id }, function success(response) {
                setModelNamesAndMoveCustomPage(response);
                $state.go('surveys.design', { id: vm.survey._id }, { reload: true });
                toastr.success('Question copied successfully');
            }, function error(err) {
                ErrorHandler.error(err);
            });
        }

        /**
         * Update survey after question deletion question
         * @return {[type]} [description]
         */
        function updateSurvey() {
            var d = $q.defer();
            vm.survey.$update(function() {
                d.resolve();
            }, function error(err) {
                d.reject(err);
            });
            return d.promise;
        }

        /**
         * Redirect User to Distribute
         * - Call server API and check if the survey is published or not
         * - if survey is published, redirect to distribute page
         * - if survey is not published, show confirmation popup for publishing survey
         * - if user accepts to publish survey, then call server API to publish the survey
         * - on success response of publish survey redirect user to distribute page
         * - else keep user on same page i.e. survey question listing page.
         */
        function navigateToDistribute() {
            $state.go('surveys.distribute');
        }

        /**
         * Call server api & change survey status to published
         * after successful publish, redirect to distribute page
         */
        function publishSurvey() {
            Survey.updateStatus({
                id: vm.survey.randomCode,
                status: 'published'
            }, function success(response) {
                $state.go('surveys.distribute', { id: vm.survey._id });
            }, function error(err) {
                ErrorHandler.error(err);
            });
        }

        /**
         * [openLogicJumps description]
         * @param  {[type]} question [description]
         * @return {[type]}          [description]
         */
        function openLogicJumps(question) {
            $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: 'modules/questions/client/views/logic-jump.client.view.html',
                controller: 'LogicJumpsController',
                controllerAs: 'vm',
                size: 'lg',
                resolve: {
                    currentQuestion: function() {
                        return question;
                    },
                    questions: function() {
                        return vm.questions;
                    },
                    surveyjumps: function() {
                        return vm.survey.jumps;
                    }
                }
            });
        }

      /**
       *
       * @param MouseOverIn JumpQuestionRelation for one to one and one to many relation
       * @param index
       */
      function jumpRelationQuestion(question, index) {
        var temp = [],
          temp3 = [],
          firstindex,
          questionLogicId,
          lineindex = [],
          lstindex = [],
          jumpQuestionId,
          lineheight,
          test1Top,
          test2Top;
        temp = question.logicJumps;
        firstindex = index;
        vm.survey.jumps.forEach(function (jumps, index) {
          temp.forEach(function(temp, index) {
            jumpQuestionId = temp;
            if (jumpQuestionId === jumps._id) {
              temp3 = jumps.jumptoQuestion;
              jumps.logic.forEach(function (q1, index) {
                questionLogicId = q1.question;
                vm.questions.forEach(function (q, index) {
                  var indexForCircle;
                  if (q._id === temp3) {
                    indexForCircle = index;
                    lstindex.push(index);
                    Math.max.apply(null, lstindex);
                    $('.ui-questions').children().eq(indexForCircle).addClass('circle-background line');
                    $('.ui-questions').children().eq(firstindex).addClass('circle-background line');
                  }
                  if (q._id === questionLogicId) {
                    indexForCircle = index;
                    lstindex.push(index);
                    Math.max.apply(null, lstindex);
                    $('.ui-questions').children().eq(indexForCircle).addClass('circle-background line');
                  }
                });
              });
            }
          });
        });

        $('.ui-questions').children().each(function (index) {
          if ($('.ui-questions').children().eq(index).hasClass('line')) {
            lineindex.push(index);
          }
        });
        var maxLength = Math.max.apply(null, lineindex);
        var minLength = Math.min.apply(null, lineindex);
        $('.ui-questions').children().eq(minLength).addClass('test1');
        $('.ui-questions').children().eq(maxLength).addClass('test2');
        for (var i = 0; i < 2; i++) {
          if ($('.test2').position() !== undefined && $('.test1').position() !== undefined) {
            test2Top = $('.test2').position().top + ($('.test2').height() / 2);
            test1Top = $('.test1').position().top + ($('.test1').height() / 2);
            lineheight = test2Top - test1Top;
            if (lineheight < 0) {
              lineheight = $('.test1').position().top - $('.test2').position().top;
            }
            if (minLength < maxLength) {
              $('.test1').append('<p class="dheight"></p>');
            } else {
              $('.test2').append('<p class="dheight"></p>');
            }
            $('.dheight').css('height', lineheight);
            $('.ui-questions').children().each(function (index) {
              if (!$('.ui-questions').children().eq(index).hasClass('line')) {
                $(this).addClass('grey-background-transparent');
                $(this).find('span.section-count').addClass('grey-background-transparent');
              }
            });
          }
        }
      }

      /**
       *  MouserOverOut jumpRelationQuestion CSS class Remove
       */
      function jumpRelationQuestionHide() {
        $('.ui-questions').children().removeClass('circle-background line');
        $('.ui-questions').children().removeClass('circle-background line');
        $('.ui-questions').children().removeClass('grey-background-transparent');
        $('.ui-questions').children().find('span.section-count').removeClass('grey-background-transparent');
        $('.dheight').remove();
        $('.ui-questions').children().removeClass('test2');
        $('.ui-questions').children().removeClass('test1');
      }

    }
}());
