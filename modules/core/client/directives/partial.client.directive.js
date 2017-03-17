/**
 * Use templates as partials like rails passing local variables .
 * eg: <partial variables="{app: vm.app, count: 2}" url="{{vm.url}}"></partial>
 */
(function () {
    'use strict';

    angular
        .module('core')
        .directive('partial', Directive);

    function Directive() {
        return {
            restrict: 'E',
            template: '<ng-include src="url"></ng-include>',
            replace: true,
            scope: {
                url: '@',
                variables: '='
            },
            controller: function ($scope) {
                updateVariables();
                $scope.$watch('variables', function() {
                    updateVariables();
                });

                function updateVariables() {
                    for (var key in $scope.variables) {
                        if ($scope.hasOwnProperty(key)) {
                            $scope[key] = $scope.variables[key];
                        }
                    }
                }
            }
        };
    }
}());
