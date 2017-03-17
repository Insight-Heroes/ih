(function () {
  'use strict';

  // Create the error handling wrapper service
  angular
    .module('core')
    .factory('ErrorHandler', ErrorHandler);

  ErrorHandler.$inject = ['toastr'];

  function ErrorHandler(toastr) {
    var service = {
      error: showError
    };

    return service;

    /**
     * Show error in toaster
     * Error can be
     * 1. Model Save validation error from Server
     * 2. Server Exceptions
     * 3. Internet errors
     * @param  {[type]} errorObject [description]
     * @return {[type]}             [description]
     */
    function showError(errorObject) {
      if (!errorObject) {
        toastr.error('Connection error. Please check your internet connection!');
      } else if (errorObject.hasOwnProperty('message')) {
        toastr.error(errorObject.message);
      } else if (errorObject.hasOwnProperty('data')) {
        console.error('Error:', errorObject);
        if (errorObject.data && errorObject.data.hasOwnProperty('message')) {
          toastr.error(errorObject.data.message);
        } else {
          toastr.error('Something Went Wrong.');

        }
      }
    }

  }
}());
