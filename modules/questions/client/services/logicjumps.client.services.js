(function () {
    'use strict';

    angular
        .module('logicjumps')
        .factory('LogicJump', LogicJumpService);

    LogicJumpService.$inject = ['$resource'];

    function LogicJumpService($resource) {
        var LogicJump = $resource('/api/logicjumps/:id', { id: '@_id' }, {
            update: {
                method: 'PUT' // this method issues a PUT request
            },
            copy: {
                method: 'PUT', // Issue a post request for copying resource
                params: { id: '@id' },
                url: '/api/logicjumps/:id/copy'
            },
            getLogicJumps: {
                method: 'GET', // Issue a GET request for fetching list of logic jumps
                params: { id: '@id' },
                url: '/api/logicjumps/:id/logic_jumps'
            },
            updateLogicJumps: {
                method: 'PUT', // Issue a PUT request for updating logic jumps
                params: { id: '@id', jumps: '@jumps' },
                url: '/api/logicjumps/:id/logic_jumps'
            },
            deleteLogicJumps: {
                method: 'POST', // Issue a POST request for DELETE logic jumps
                params: { deleteLogicjumps: '@deleteLogicjumps' },
                url: '/api/logicjumps/delete_jumps'
            },
            remLogicFromQues: {
                method: 'POST', // Issue a POST request for DELETE logic jumps from questions
                params: { remLogicFromQues: '@remLogicFromQues' },
                url: '/api/logicjumps/remLogicFromQues'
            }
        });

        return LogicJump;
    }
}());
