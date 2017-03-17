(function () {
    'use strict';

    angular
        .module('questions')
        .directive('dropdownValidation', function () {

            return {
                require: 'ngModel',
                restrict: 'A',

                link: function (scope, element, attrs, ctrl) {
                    /**
                     * Custom validator
                     */
                    ctrl.$validators.dropdownValidation = function (modelValue, viewValue) {
                        // Return true for empty value
                        if (!modelValue || modelValue === '') {
                            return true;
                        }
                        console.log('Dropdwon ', modelValue, viewValue);
                        var options = _.filter(modelValue.split(','), function(o) {
                            if (o && o !== '') {
                                return true;
                            } else {
                                return false;
                            }
                        });
                        return (options.length > 1);
                    };
                }
            };
        });
}());
