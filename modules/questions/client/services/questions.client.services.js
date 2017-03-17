(function () {
    'use strict';

    angular
        .module('questions')
        .factory('Question', QuestionService);

    QuestionService.$inject = ['$resource'];

    function QuestionService($resource) {
        var Question = $resource('/api/questions/:id', { id: '@_id' }, {
            update: {
                method: 'PUT' // this method issues a PUT request
            },
            copy: {
                method: 'PUT', // Issue a post request for copying resource
                params: { id: '@id' },
                url: '/api/questions/:id/copy'
            },
            getLogicJumps: {
                method: 'GET', // Issue a GET request for fetching list of logic jumps
                params: { id: '@id' },
                url: '/api/questions/:id/logic_jumps'
            },
            updateLogicJumps: {
                method: 'PUT', // Issue a PUT request for updating logic jumps
                params: { id: '@id', jumps: '@jumps' },
                url: '/api/questions/:id/logic_jumps'
            }
        });

        return Question;
    }
}());
