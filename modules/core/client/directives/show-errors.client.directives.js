(function () {
  'use strict';

  // https://gist.github.com/rhutchison/c8c14946e88a1c8f9216

  angular
    .module('core')
    .directive('showErrors', showErrors);

  showErrors.$inject = ['$timeout', '$interpolate'];

  function showErrors($timeout, $interpolate) {
    var directive = {
      restrict: 'AE',
      require: '^form',
      link: linkFn
    };

    return directive;

    function linkFn(scope, el, attrs, formCtrl) {
      // find the text box element, which has the 'name' attribute
      var inputEl = el[0].querySelector('[name]');
      // convert the native text box element to an angular element
      var inputNgEl = angular.element(inputEl);
      // get the name on the text box so we know the property to check
      // on the form controller
      var inputName = inputNgEl.attr('name');

      // only apply the error-field class after the user leaves the text box
      inputNgEl.bind('blur', function() {
        el.toggleClass('has-error', formCtrl[inputNgEl.attr('name')].$invalid);
      });

      scope.$on('show-form-errors', function() {
        if (formCtrl[inputNgEl.attr('name')])
          el.toggleClass('has-error', formCtrl[inputNgEl.attr('name')].$invalid);
      });

      scope.$on('reset-form-errors', function() {
        $timeout(function() {
          el.removeClass('has-error');
        }, 0, false);
      });
    }
  }
}());
