(function () {
    'use strict';

    angular
        .module('lists')
        .directive('csvType', function () {

            return {
                require: 'ngModel',
                restrict: 'A',

                link: function (scope, element, attrs, ctrl) {
                    /**
                     * Custom validator
                     */
                    ctrl.$validators.csvType = function (modelValue, viewValue) {
                        if (modelValue) {
                            var fileType = _.toLower(_.last(modelValue.name.split('.')));
                            return (fileType === 'csv');
                        } else {
                            return true;
                        }
                    };
                }
            };
        });
}());
