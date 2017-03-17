(function () {
  'use strict';

  angular
    .module('comments')
    .controller('CommentsListController', CommentsListController);

  CommentsListController.$inject = ['CommentsService'];

  function CommentsListController(CommentsService) {
    var vm = this;

    vm.comments = CommentsService.query();
  }
}());
