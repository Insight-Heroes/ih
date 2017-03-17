(function () {
  'use strict';

  angular
    .module('presentation')
    .controller('PresentationListController', PresentationListController);


  PresentationListController.$inject = ['$state', '$http', 'PresentsService', 'CommentsService', '$rootScope', '$stateParams', 'toastr', '$mdDialog', 'ErrorHandler', '$uibModal', '$filter'];

  function PresentationListController($state, $http, PresentsService, CommentsService, $rootScope, $stateParams, toastr, $mdDialog, ErrorHandler, $uibModal, $filter) {

      var vm = this;
      vm.presentation = '';
      vm.survey = {
        _id: $stateParams.id
      };
      // vm.presentation = PresentsService.query;


      vm.sendComment = sendComment;
      vm.previewOfChart = previewOfChart;
      vm.preview = false;
      vm.hidePublishButton = true;
      vm.hidePreview = true;
      vm.activecomment = false;
      presentationList();
      vm.presentationId = $stateParams.id;
      vm.deleteSingleGraph = deleteSingleGraph;
      vm.deleteStoryBoard = deleteStoryBoard;
      vm.inPlaceEditing = false;
      vm.cancelVariableRename = cancelVariableRename;
      vm.saveStoryAndDiscription = saveStoryAndDiscription;
      vm.inDiscriptionEditing = false;
      vm.ingraphTitleEditing = false;
      singleStoryBoardSelection();
      vm.activeCommentBox = activeCommentBox;
      previewOfChart();
      vm.sendPdfPopup = sendPdfPopup;
      vm.searchStoryBoard = searchStoryBoard;
      vm.searchStory = false;
      vm.previousSlide = previousSlide;
      vm.nextSlide = nextSlide;
      vm.currentIndex = 0;
      vm.goBack = goBack;
      vm.editText = editText;
      vm.presentLength = false;


    /**
     * Reset/Init graph object
     */
      vm.graphOptionsforSmallChart = {

      options: {
         responsive: true,
         maintainAspectRatio: true
      },
        scales: {
          xAxes: [{
            stacked: true,
            ticks: {
              beginAtZero: true
            }
          }],
          yAxes: [{
            stacked: true,
            ticks: {
              beginAtZero: true
            }
          }]
        },
        legend: { display: false }
      };
      /*
        Chart Colors
       */
    vm.chartColors = [
                '#0766EF',
                '#FB2355',
                '#71BEF4',
                '#360696',
                '#D0579A',
                '#99092A',
                '#D5A7E6',
                '#FFD86E',
                '#65CACAB',
                '#032F98',
                '#18AFC4',
                '#F4E66D',
                '#1BB7B8',
                '#6AF7OD',
                '#FF8AA3',
                '#F75A73',
                '#FEDO9O',
                '#FFC42F',
                '#FF135F',
                '#6FAAFF',
                '#43F165',
                '#FFD86E',
                '#5E65D8',
                '#C78EE1',
                '#658AED',
                '#7B4FB3',
                '#11E9DE'
            ];

    function goBack() {
      window.history.back();
    }

    // Cancel variable rename
    function cancelVariableRename() {
      vm.inPlaceEditing = false;
      vm.inDiscriptionEditing = false;
      vm.ingraphTitleEditing = false;
      // $state.go('presentation.comment', { id: vm.presentationId }, { reload: true });
    }
      /*
      * Hide the navigationbar and header for comments
      * */
      if ($state.current.name === 'presentation.comment') {
          $rootScope.navHeader = false;
      }

      /*
      * get the data for single stroyboard selection
      * */
      function singleStoryBoardSelection() {
        if ($state.current.name === 'presentation.view' || $state.current.name === 'presentation.comment' || $state.current.name === 'surveys.view') {
          if ($state.current.name === 'surveys.view') {
            vm.showNavBar = true;
          } else if ($state.current.name === 'presentation.view') {
            vm.showNavBar = false;
          }
            $http.get('/api/presentation/' + vm.presentationId).success(function success(presentation) {
              presentation.graphs = $filter('orderBy')(presentation.graphs, 'slideNo');
              vm.presentationView = presentation;
              vm.survey = presentation.survey;
              getindex();
              makeGraphDraggable();

            });

        }
      }

      /*
      *  fetch the list from analyze
      * */
      function presentationList() {
        if ($state.current.name === 'surveys.presentation') {
          $http.get('/api/presentation/survey/' + $stateParams.id).success(function (presentation) {
            vm.presentation = presentation;
            if (presentation.length > 0) {
              vm.showNavBar = true;
              vm.survey = presentation[0].survey;
            } else if ($state.current.name === 'surveys.presentation') {
              vm.showNavBar = false;
              vm.presentLength = true;
            }
          });
        } else if ($state.current.name === 'presentation.list') {
              $http.get('/api/presentation').success(function (presentation) {
              vm.presentation = presentation;
                vm.showNavBar = false;
                vm.survey = presentation[0].survey;

              });
          }
      }

      /*
      * preview of the chart selection
      * */
      function previewOfChart() {
          vm.preview = true;
          vm.activecomment = false;
          $('.container-fluid').removeClass('chart-size').addClass('chart-resize');
          $('.board').removeClass('col-md-7 col-md-offset-1').addClass('col-md-12 ');
          $('.previous-next-buttons').removeClass('absolute-pos');
      }

      function activeCommentBox () {
        vm.preview = false;
        vm.activecomment = true;
        $('.container-fluid').removeClass('chart-resize').addClass('chart-size');
        $('.board').removeClass('col-md-12').addClass('col-md-7 col-md-offset-1 ');
        $('.previous-next-buttons').addClass('absolute-pos');
        var indexsave = 0;
          vm.presentationView.graphs.forEach(function (g, index) {
            if (parseInt(g.slideNo, 10) === vm.currentIndex + 1) {
              indexsave = g._id;
            }
          });
          commentsList(indexsave);

      }

    /*
     * send single comment user write on box
     * */
      function sendComment(id) {
          vm.comments = vm.comments.replace(/^<p[^>]*>(.*)<\/p>$/i, '$1');
          var comment = {
            presentation: vm.presentationId,
            comment: vm.comments,
            graphId: id
          };
        var indexsave = 0;
        vm.presentationView.graphs.forEach(function (g, index) {
          if (parseInt(g.slideNo, 10) === vm.currentIndex + 1) {
            indexsave = g._id;
          }
        });
          $http.post('/api/comments', comment).success(function (comment) {
              toastr.success('Thank You For Comment');
              vm.comments = comment;
              commentsList(indexsave);
              // $state.go('presentation.comment', { id: vm.presentationId }, { reload: true });
          });
      }

      /*
      * Show all the comments on right side box
      * */
      function commentsList(id) {
        if ($state.current.name === 'presentation.comment') {
          $http.get('/api/comments/' + id).success(function (commentsList) {
            vm.commentsList = commentsList;
            vm.commentsList.reverse();
          });
        }
      }


      /*
      * Delete Stroyboard
      * */
      function deleteSingleGraph(graph, ev) {
        var confirm = $mdDialog.confirm()
          .title('Delete Graph?')
          .textContent('Are you sure you want to delete the Graph?')
          .targetEvent(ev)
          .ok('Yes')
          .cancel('No');
        $mdDialog.show(confirm).then(function() {
          $http.delete('/api/presentation/' + vm.presentationId + '/' + graph._id).success(function (response) {
            toastr.success('Graph deleted successfully');
            if ($state.current.name === 'presentation.view') {
              $state.go('presentation.view', { id: vm.presentationId }, { reload: true });
            } else {
              $state.go('surveys.view', { id: vm.presentationId }, { reload: true });
            }

          }, function error(err) {
            ErrorHandler.error(err);
          });
        });
      }


      /*
      * Delete Stroyboard
      * */
      function deleteStoryBoard(presentation, ev) {
        var confirm = $mdDialog.confirm()
          .title('Delete Storyboard?')
          .textContent('Are you sure you want to delete the Storyboard?')
          .targetEvent(ev)
          .ok('Yes')
          .cancel('No');
        $mdDialog.show(confirm).then(function() {
          $http.delete('/api/presentation/' + presentation._id).success(function (response) {
            toastr.success('Storyboard deleted successfully');
            $state.go('presentation.list', {}, { reload: true });
          }, function error(err) {
            ErrorHandler.error(err);
          });
        });
      }
      // Call server api & update stroyboardname and discription
      function saveStoryAndDiscription(presentation, e) {
        vm.inPlaceEditing = false;
        vm.inDiscriptionEditing = false;
        vm.ingraphTitleEditing = false;
        var params = {};
        // params.slideTitle = presentation
        params.graphs = presentation;
        $http.put('/api/presentation/' + $stateParams.id, params)
          .then(function success(res) {
            cancelVariableRename();
            toastr.success('Your changes has been saved successfully');
            singleStoryBoardSelection();
           // $state.go('presentation.comment', { id: vm.presentationId }, { reload: true });
          }, function error(err) {
            ErrorHandler.error(err);
          });
      }

      /*
      * GraphBox draggable
      * */
      function makeGraphDraggable() {
        vm.graphPositionChanged = {
          allowDuplicates: true,
          containment: '#sortable-container',
          orderChanged: function (cbObject) {
            var reArrangeSlideNo = [];
            vm.presentationView.graphs.forEach(function (graph, index) {
              reArrangeSlideNo.push({
                slideNo: index + 1,
                graphId: graph._id
              });
            });
            $http.put('/api/presentation/updateSlidePosition/' + $stateParams.id, reArrangeSlideNo)
            .then(function success(res) {
              $state.go('surveys.view', { id: $stateParams.id }, { reload: true });
              toastr.success('Slide positions saved successfully');
            }, function error(err) {
              ErrorHandler.error(err);
            });
          }
        };
      }

      /*
      * Share Pdf with the specfic user
      * */
      function sendPdfPopup(presentation) {
        $uibModal.open({
          animation: true,
          ariaLabelledBy: 'modal-title',
          ariaDescribedBy: 'modal-body',
          windowClass: 'app-modal-window-delete send-pdf-modal',
          templateUrl: 'modules/presentation/client/views/send-pdf-popup.view.html',
          controller: 'PresentsController',
          controllerAs: 'vm',
          size: 'lg',
          resolve: {
            presentation: function() {
              return presentation;
            }
          }
        });

      }

      function searchStoryBoard() {
        if (vm.searchStory) {
         return (vm.searchStory = false);
        }
        vm.searchStory = true;
      }

      function nextSlide() {
        var indexsave = 0;
        if (vm.currentIndex < vm.presentationView.graphs.length - 1) {
          cancelVariableRename();
          vm.currentIndex = vm.currentIndex + 1;
          vm.presentationView.graphs.forEach(function (g, index) {
            if (parseInt(g.slideNo, 10) === vm.currentIndex + 1) {
              indexsave = g._id;
            }
          });
          commentsList(indexsave);
        } else {
          return;
        }
      }

    function previousSlide() {
      var indexsave = 0;
      if (vm.currentIndex > 0) {
        cancelVariableRename();
        vm.currentIndex = vm.currentIndex - 1;
        vm.presentationView.graphs.forEach(function (g, index) {
          if (parseInt(g.slideNo, 10) === vm.currentIndex + 1) {
            indexsave = g._id;
          }
        });
      commentsList(indexsave);
      } else {
        return;
      }
    }

    function getindex() {
      if (vm.currentIndex === 0) {
          vm.presentationView.graphs.forEach(function (g, index) {
            if (g._id === $stateParams.graphId) {
              vm.currentIndex = g.slideNo - 1;
            }
          });
      }
    }


    function editText(presentation, e) {
      if ($(e.target).text().length > 100) {
        var modelName = e.target.attributes[0].nodeValue;
        $(e.target).text($(e.target).text().slice(0, 100));
        toastr.error('can not allow more then 100 character');
      }
    }
  }
}());
