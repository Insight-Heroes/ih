(function () {
  'use strict';

  angular
    .module('core')
    .run(routeFilter);

  routeFilter.$inject = ['$rootScope', '$state', 'Authentication', 'toastr'];

  function routeFilter($rootScope, $state, Authentication, toastr) {
    $rootScope.$on('$stateChangeStart', stateChangeStart);
    $rootScope.$on('$stateChangeSuccess', stateChangeSuccess);

    function stateChangeStart(event, toState, toParams, fromState, fromParams) {
      $rootScope.navHeader = true;
      if (toState.data && toState.data.requireUser && !Authentication.user) {
        toastr.error('Please login to access this page');
        event.preventDefault();
        $state.transitionTo('authentication.signin', {}, {
          reload: true,
          inherit: false,
          notify: true
        });
      }
      if (toState.data && toState.data.requireNoUser && Authentication.user) {
        toastr.error('You are already logged in');
        event.preventDefault();
        $state.transitionTo('dashboard', {}, {
          reload: true,
          inherit: false,
          notify: true
        });
      }
    }

    function stateChangeSuccess(event, toState, toParams, fromState, fromParams) {
      // Record previous state
      $rootScope.$on('$stateChangeSuccess', function (event, next, nextParams, previous, prevParams) {

            if (toState.data && toState.data.authorizedRoles) {
              if (!_.includes(toState.data.authorizedRoles, Authentication.user.roles)) {
                console.error('From: %s \t To: %s \t Auth Roles: %s User Role: ', fromState.name, toState.name, JSON.stringify(toState.data.authorizedRoles), Authentication.user.roles);
                $state.go('forbidden');
              }
            } else {
                console.debug('Authorization Missing: State', next.name);
            }
        });
        // storePreviousState(fromState, fromParams);
    }

    // Store previous state
    function storePreviousState(state, params) {
      // only store this state if it shouldn't be ignored
      if (!state.data || !state.data.ignoreState) {
        $state.previous = {
          state: state,
          params: params,
          href: $state.href(state, params)
        };
      }
    }
  }
}());
