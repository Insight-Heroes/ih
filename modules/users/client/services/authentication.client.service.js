(function () {
  'use strict';

  // Authentication service for user variables

  angular
    .module('userAuth')
    .factory('Authentication', Authentication);

  Authentication.$inject = ['$window', '$injector', '$rootScope'];

  function Authentication($window, $injector, $rootScope) {
    if ($window.user) {
      $('body').addClass('role-' + $window.user.roles);
    }
    var auth = {
      user: $window.user,
      logout: logout
    };

    $rootScope.authentication = auth;
    return auth;

    function logout() {
      var $http = $injector.get('$http'),
        $state = $injector.get('$state'),
        toastr = $injector.get('toastr'),
        ErrorHandler = $injector.get('ErrorHandler');
      $http.get('/api/auth/signout').success(function (response) {
        toastr.success('Signed out successfully');
        auth.user = null;
        $state.go('authentication.signin');
      }).error(function (response) {
        ErrorHandler.error(response.message);
      });
    }
  }
}());
