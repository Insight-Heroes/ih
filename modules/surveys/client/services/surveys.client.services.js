(function () {
    'use strict';

    angular
        .module('surveys')
        .factory('Survey', SurveyService);

    SurveyService.$inject = ['$resource'];

    function SurveyService($resource) {
        var Survey = $resource('/api/surveys/:id', { id: '@_id' }, {
            update: {
              method: 'PUT' // this method issues a PUT request
            },
            getStatus: {
                method: 'GET', // Issue a GET request for gettng status of survey
                params: { id: '@id' },
                url: '/api/surveys/:id/status'
            },
            updateStatus: {
                method: 'PUT', // Issue a PUT request for updating status of Survey, status can be draft/published
                params: { id: '@id', status: '@status' },
                url: '/api/surveys/:id/status'
            }
        });

        return Survey;

    }
}());
