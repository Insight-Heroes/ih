// Lists service used to communicate Lists REST endpoints
(function () {
    'use strict';

    angular
        .module('lists')
        .factory('ListsService', ListsService);

    ListsService.$inject = ['$resource'];

    function ListsService($resource) {
        return $resource('api/lists/:listId', { listId: '@_id' }, {
            update: {
                method: 'PUT'
            },
            addContacts: {
                method: 'POST', // Issue a PUT request for fetching list of logic jumps
                params: { listId: '@id' },
                data: { listHeaders: '@listHeaders', contacts: '@contacts', respondentType: '@respondentType' },
                url: '/api/lists/:listId/add_contacts'
            },
            getrepondanttypes: {
                method: 'POST', // Issue a PUT request for fetching list of logic jumps
                params: { listId: '@id' },
                data: { listHeaders: '@listHeaders', contacts: '@contacts', respondentType: '@respondentType' },
                url: '/api/lists/publish_survey'
            }
        });
    }
}());
